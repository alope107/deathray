import { computeShaderCode } from "./compute.js";
import { renderShaderCode } from "./render.js";
import { startResizeObservation } from "./resize.js";
import { circleStruct, uniformsStruct } from "./structs.js";
import { randCircles } from "./random.js";

// JS managed game state
let accel = {x: 0, y:-9.8, z:0};
let pointerLoc = [0, 0];
let pointerHeldNow = false;
let pointerHeldLastFrame = false;

const GRAVITY_FACTOR = 16000;
const POLYS_PER_CIRCLE = 30;
const CIRCLE_COUNT = 200;
const RADIUS = .05;

const main = async () => {
    const device = await (await navigator.gpu?.requestAdapter( {
        powerPreference: "high-performance",
    }))?.requestDevice();

    let renderTarget;
    if(device) {        
        renderTarget = document.body.appendChild(document.createElement("canvas"));
        renderTarget.id = "renderTarget";
    } else {
        let errorMessage = document.body.appendChild(document.createElement("span"));
        errorMessage.innerText = "No WebGPU support :( "
        console.error("No WebGPU support :(");
        return;
    }

    startResizeObservation(renderTarget, device.limits.maxTextureDimension2D);

    // These errors are automatically surfaced in the chrome terminal,
    // but need to be explicitly listened for on webkit
    device.addEventListener("uncapturederror", (e) => {
        console.error("Uncaptured error: ", e.error.message);
    });

    const renderFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = renderTarget.getContext("webgpu");
    ctx.configure( {
        device,
        format: renderFormat
    });

    const computeModule = device.createShaderModule({
        label: "compute shader module",
        code:computeShaderCode
    })
    const physicsPipeline = device.createComputePipeline({
        label: "physics pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "applyPhysics"
        }
    });

    const renderModule = device.createShaderModule({
        label: "render module",
        code: renderShaderCode(POLYS_PER_CIRCLE)
    });
    const renderPipeline = device.createRenderPipeline({
        label: "render pipeline",
        layout: "auto",
        vertex: {
            entryPoint: "triangle",
            module: renderModule
        },
        fragment:{
            entryPoint: "solidColor",
            module: renderModule,
            targets: [{format: renderFormat}]
        },
        primitive: {
            topology: "triangle-strip"
        }
    });
    const renderPassDescriptor = {
        label: "render pass descriptor",
        colorAttachments: [
            {
                clearValue: [0, 0, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    };

    const circles = randCircles(CIRCLE_COUNT, RADIUS);

    const circlePingBuffer = device.createBuffer({
        label: "circlePingBuffer",
        size: circles.data.byteLength,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
            //    GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });
    const circlePongBuffer = device.createBuffer({
        label: "circlePongBuffer",
        size: circles.data.byteLength,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
            //    GPUBufferUsage.COPY_SRC | // used for debugging
               GPUBufferUsage.VERTEX
    });


    let uniform = uniformsStruct.createFilled({
            gravity: [accel.x/GRAVITY_FACTOR, accel.y/GRAVITY_FACTOR],
            pointerLoc: [0, 0],//TODO
            pointerHeld: 0,// TODO
            pointerPressed: 0 // TODO
        });
    const uniformBuffer = device.createBuffer({
        label: "uniform buffer",
        size: uniform.data.byteLength,
        usage: GPUBufferUsage.UNIFORM | 
               GPUBufferUsage.COPY_DST 
    });

    const physicsPingToPongBindGroup = device.createBindGroup({
        label: "physicsPingToPongBindGroup",
        layout: physicsPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePingBuffer},
            {binding: 1, resource: circlePongBuffer},
            {binding: 2, resource: uniformBuffer}
        ]
    });
    const physicsPongToPingBindGroup = device.createBindGroup({
        label: "physicsPongToPingBindGroup",
        layout: physicsPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePongBuffer},
            {binding: 1, resource: circlePingBuffer},
            {binding: 2, resource: uniformBuffer}
        ]
    });

    const renderPingBindGroup = device.createBindGroup({
        label: "renderPingBindGroup",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePingBuffer},
        ]
    });
    const renderPongBindGroup = device.createBindGroup({
        label: "renderPongBindGroup",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: circlePongBuffer},
        ]
    });



    device.queue.writeBuffer(circlePingBuffer, 0, circles.data);
    device.queue.writeBuffer(circlePongBuffer, 0, circles.data);
    device.queue.writeBuffer(uniformBuffer, 0, uniform.data);

    renderTarget.addEventListener("pointermove", () => {
        // Rescale to clip space, the scaling used by the compute/vertex shaders
        pointerLoc = [(2 * event.clientX / renderTarget.width) - 1, -((2 * event.clientY / renderTarget.height) - 1)];
    });
    renderTarget.addEventListener('pointerdown', () => { pointerHeldNow = 1; });
    renderTarget.addEventListener('pointerup', () => { pointerHeldNow = 0; });
    renderTarget.addEventListener('pointeleave', () => { pointerHeldNow = 0; });
    renderTarget.addEventListener('pointercancel', () => { pointerHeldNow = 0; });


    let frameCount = 0;
    const render = async() => {
        const encoder = device.createCommandEncoder({label: "encoder"});

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(physicsPipeline);
        computePass.setBindGroup(0, frameCount % 2 == 0 ? physicsPingToPongBindGroup: physicsPongToPingBindGroup);
        computePass.dispatchWorkgroups(circles.count);
        computePass.end();
        

        renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, frameCount % 2 == 0 ? renderPongBindGroup : renderPingBindGroup);
        renderPass.draw(2*POLYS_PER_CIRCLE + 1, circles.count);
        renderPass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        frameCount++;
    };

    const animationFrame = async (timestamp) => {
        uniform = uniformsStruct.createFilled({
            gravity: [accel.x/GRAVITY_FACTOR, accel.y/GRAVITY_FACTOR],
            pointerLoc: pointerLoc,
            pointerHeld: pointerHeldNow,
            pointerPressed: !pointerHeldLastFrame && pointerHeldNow 
        });
        pointerHeldLastFrame = pointerHeldNow;
        device.queue.writeBuffer(uniformBuffer, 0, uniform.data);
        render();
        requestAnimationFrame(animationFrame);
    };
    requestAnimationFrame(animationFrame);
};

const initializeAccelerometer = async (e) => {
    document.getElementById("prompt").remove();
    window.addEventListener("devicemotion", (event) => {
        let accelInclG = event.accelerationIncludingGravity;
        if(accelInclG.x != null) {
            accel.x = accelInclG.x*-1;
            accel.y = accelInclG.y*-1;
            accel.z = accelInclG.z;
        }
    });
    main();
}

// Only need user input if on mobile so accelerometer can be accessed
// Otherwise just start immedately on desktop
if(!window.matchMedia('(hover: hover)').matches && window.matchMedia('(pointer: coarse)').matches) {
    let userPrompt = document.body.appendChild(document.createElement("h1"));
    userPrompt.innerText = "Press me";
    userPrompt.id="prompt";
    userPrompt.addEventListener("pointerup", initializeAccelerometer);
} else {
    main();
}