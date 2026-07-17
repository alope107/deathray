// Ripped pretty much exactly from https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html

export const startResizeObservation = (canvas, maxTextureDimension2D) => {
const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(1, Math.min(width, maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, maxTextureDimension2D));
        }
    });
    observer.observe(canvas);
};