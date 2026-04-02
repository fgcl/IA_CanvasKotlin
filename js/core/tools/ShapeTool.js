import { BaseTool } from './BaseTool.js';
import { SnapEngine } from '../SnapEngine.js';

export class ShapeTool extends BaseTool {
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
            type: this.state.currentTool, // 'rect' or 'circle'
            x: snapped.x,
            y: snapped.y,
            width: 0,
            height: 0,
            fillColor: props.fillColor,
            strokeColor: props.strokeColor,
            strokeWidth: props.strokeWidth,
            opacity: props.opacity,
            useFill: props.useFill,
            useStroke: props.useStroke
        };
    }

    onMouseMove(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            const snapped = this._snap(coords.x, coords.y);
            let dx = snapped.x - this.state.startX;
            let dy = snapped.y - this.state.startY;

            if (e.shiftKey) {
                const size = Math.max(Math.abs(dx), Math.abs(dy));
                dx = Math.sign(dx) * size;
                dy = Math.sign(dy) * size;
            }

            this.state.currentShape.width = dx;
            this.state.currentShape.height = dy;
            this.redraw();
        }
    }

    onMouseUp(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            const MIN_SIZE = 5;
            const width = Math.abs(this.state.currentShape.width);
            const height = Math.abs(this.state.currentShape.height);

            if (width >= MIN_SIZE || height >= MIN_SIZE) {
                this.state.addShape(this.state.currentShape);
                this.state.selectedShapes = [this.state.currentShape];
                this.updateCode();
            }
        }
        this.state.isDrawing = false;
        this.state.currentShape = null;
        this.redraw();
    }
}
