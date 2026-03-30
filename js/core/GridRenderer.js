export class GridRenderer {
    static draw(ctx, state, canvasWidth, canvasHeight) {
        if (state.gridType === 'none' || !state.showGrid) return;

        const { gridType, gridSize, gridOpacity, panX, panY, zoom, canvasSize } = state;
        
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);

        ctx.strokeStyle = `rgba(100, 150, 255, ${gridOpacity})`;
        ctx.fillStyle = `rgba(100, 150, 255, ${gridOpacity})`;
        ctx.lineWidth = 1 / zoom;

        // Calculate visible range in canvas coordinates
        const startX = -panX / zoom;
        const startY = -panY / zoom;
        const endX = startX + (canvasWidth / dpr) / zoom;
        const endY = startY + (canvasHeight / dpr) / zoom;

        if (gridType === 'square') {
            this.drawSquareGrid(ctx, startX, startY, endX, endY, gridSize);
        } else if (gridType === 'dots') {
            this.drawDotGrid(ctx, startX, startY, endX, endY, gridSize, 2 / zoom);
        } else if (gridType === 'isometric') {
            this.drawIsometricGrid(ctx, startX, startY, endX, endY, gridSize);
        }

        ctx.restore();
    }

    static drawSquareGrid(ctx, startX, startY, endX, endY, size) {
        ctx.beginPath();
        for (let x = Math.floor(startX / size) * size; x <= endX; x += size) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = Math.floor(startY / size) * size; y <= endY; y += size) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }

    static drawDotGrid(ctx, startX, startY, endX, endY, size, radius) {
        for (let x = Math.floor(startX / size) * size; x <= endX; x += size) {
            for (let y = Math.floor(startY / size) * size; y <= endY; y += size) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    static drawIsometricGrid(ctx, startX, startY, endX, endY, size) {
        const h = size * Math.sqrt(3); // Height of the diamond
        const w = size; // Half-width of the diamond
        
        ctx.beginPath();
        
        // 30 degree lines (positive slope in canvas y-down)
        // Equation: y = 0.577x + c  => c = y - 0.577x
        // We use a simpler approach: draw a series of parallel lines
        const angle = Math.PI / 6; // 30 degrees
        const tanA = Math.tan(angle);
        
        // Vertical spacing between parallel lines
        const vStep = size;
        
        // Lines of type /
        for (let c = Math.floor((startY - tanA * endX) / vStep) * vStep; c <= endY - tanA * startX; c += vStep) {
            const x1 = startX;
            const y1 = tanA * x1 + c;
            const x2 = endX;
            const y2 = tanA * x2 + c;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        
        // Lines of type \
        for (let c = Math.floor((startY + tanA * startX) / vStep) * vStep; c <= endY + tanA * endX; c += vStep) {
            const x1 = startX;
            const y1 = -tanA * x1 + c;
            const x2 = endX;
            const y2 = -tanA * x2 + c;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        
        ctx.stroke();
    }
}
