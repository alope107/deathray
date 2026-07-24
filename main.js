const main = async () => {
    const device = await (await navigator.gpu?.requestAdapter( {
        powerPreference: "high-performance",
    }))?.requestDevice();
    
    let renderTarget = document.body.appendChild(document.createElement("canvas"));
    renderTarget.id = "renderTarget";

    const renderFormat = navigator.gpu.getPreferredCanvasFormat();
    const ctx = renderTarget.getContext("webgpu");
    ctx.configure( {
        device,
        format: renderFormat
    });

    const computeShaderCode = /* wgsl */ `
    @group(0) @binding(0) var<storage, read_write> data : array<vec4f>; 
    @compute @workgroup_size(1) fn sortAndDisplay() {
            for(var i = 0u; i < 1;) {
                data[i+1] = data[i];
            }
    }`;
    const renderShaderCode = /* wgsl */ `
        struct VertexOutput {
            @builtin(position) position : vec4f,
            @location(0) color : vec4f
        }
        @group(0) @binding(0) var<storage, read> circles : array<vec4f>; 
        @vertex fn triangle(@builtin(vertex_index) vertexIdx : u32, 
                            @builtin(instance_index) instanceIdx : u32) -> VertexOutput {
            let circle = circles[instanceIdx];

            return VertexOutput(
                circle,
                vec4f()
            );
        }
        @fragment fn solidColor(fragInput : VertexOutput) -> @location(0) vec4f {
            return fragInput.color;
        }`;

    const computePipeline = device.createComputePipeline({
        layout: "auto",
        compute: {
            module: device.createShaderModule({code:computeShaderCode}),
            entryPoint: "sortAndDisplay"
        }
    });

    const renderModule = device.createShaderModule({
        code: renderShaderCode
    });
    const renderPipeline = device.createRenderPipeline({
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
        colorAttachments: [
            {
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    };

    const dataSize = 48*10;
    const buffer = device.createBuffer({
        size: dataSize,
        usage: GPUBufferUsage.STORAGE |
               GPUBufferUsage.COPY_DST |
               GPUBufferUsage.COPY_SRC |
               GPUBufferUsage.VERTEX
    });

    const computeBindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: buffer},
        ]
    });

    const renderBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: buffer},
        ]
    });

    device.queue.writeBuffer(buffer, 0, new ArrayBuffer(dataSize));

    const encoder = device.createCommandEncoder();
    let computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(1); 
    computePass.end();

    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    const renderPass = encoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(13, 20);
    renderPass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
};

main();