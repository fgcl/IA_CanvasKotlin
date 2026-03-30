import { BaseTool } from './BaseTool.js';
import { SnapEngine } from '../SnapEngine.js';

export class LineTool extends BaseTool {
    _snap(x, y) {
        const tm = this.state.transformManager;
        return SnapEngine.snapCoords(x, y, this.state, tm);
    }

    onMouseDown(e, coords) {
        const props = this.getCurrentProps();
        this.state.isDrawing = true;

        const snapped = this._snap(coords.x, coords.y);
        this.state.startX = snapped.x;
        this.state.startY = snapped.y;

        this.state.currentShape = {
            type: 'line',
            x: snapped.x,
            y: snapped.y,
            endX: snapped.x,
            endY: snapped.y,
            strokeColor: props.strokeColor,
            strokeWidth: props.strokeWidth,
            opacity: props.opacity,
            useStroke: true,
            useFill: false
        };
    }

    onMouseMove(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            const snapped = this._snap(coords.x, coords.y);
            let dx = snapped.x - this.state.startX;
            let dy = snapped.y - this.state.startY;

            if (e.shiftKey) {
                // Snap to 45 degree increments (0, 45, 90, 135, 180, etc.)
                const angle = Math.atan2(dy, dx);
                const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                const dist = Math.sqrt(dx * dx + dy * dy);
                dx = Math.cos(snapAngle) * dist;
                dy = Math.sin(snapAngle) * dist;
            }

            this.state.currentShape.endX = this.state.startX + dx;
            this.state.currentShape.endY = this.state.startY + dy;
            this.redraw();
        }
    }

    onMouseUp(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            this.state.addShape(this.state.currentShape);
            this.state.selectedShapes = [this.state.currentShape];
            this.updateCode();
        }
        this.state.isDrawing = false;
        this.state.currentShape = null;
    }
}
