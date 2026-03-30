import { BaseTool } from './BaseTool.js';

export class HandTool extends BaseTool {
    constructor(...args) {
        super(...args);
        this.lastX = 0;
        this.lastY = 0;
    }

    onMouseDown(e, coords) {
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.state.isDrawing = true; // Use this to track mouse down
        this.canvas.style.cursor = 'grabbing';
    }

    onMouseMove(e, coords) {
        if (this.state.isDrawing) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.state.panX += dx;
            this.state.panY += dy;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.redraw();
        }
    }

    onMouseUp(e, coords) {
        this.state.isDrawing = false;
        this.canvas.style.cursor = 'grab';
    }

    onDeactivate() {
        super.onDeactivate();
        this.canvas.style.cursor = 'default';
    }
}
