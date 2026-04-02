import { BaseTool } from './BaseTool.js';
import { SnapEngine } from '../SnapEngine.js';

export class PenTool extends BaseTool {
    onMouseDown(e, coords) {
        const props = this.getCurrentProps();
        const tm = this.state.transformManager;
        const snapped = SnapEngine.snapCoords(coords.x, coords.y, this.state, tm);

        if (!this.state.isBezierDrawing) {
            this.state.isBezierDrawing = true;
            this.state.currentShape = {
                type: 'bezier',
                points: [{x: snapped.x, y: snapped.y, isSmooth: true}],
                fillColor: props.fillColor,
                strokeColor: props.strokeColor,
                strokeWidth: props.strokeWidth,
                opacity: props.opacity,
                useFill: props.useFill,
                useStroke: props.useStroke
            };
        } else if (this.state.currentShape) {
            // Check for path closure
            const first = this.state.currentShape.points[0];
            const dist = Math.sqrt((snapped.x - first.x)**2 + (snapped.y - first.y)**2);
            const closeThreshold = 10 / this.state.zoom;

            if (dist < closeThreshold && this.state.currentShape.points.length > 1) {
                this.state.isBezierDrawing = false;
                this.state.addShape(this.state.currentShape);
                this.state.selectedShapes = [this.state.currentShape];
                this.state.currentShape = null;
            } else {
                this.state.currentShape.points.push({
                    x: snapped.x, y: snapped.y, isSmooth: true
                });
                this.state.updateBezierHandles(this.state.currentShape);
            }
        }
        this.redraw();
    }

    onMouseMove(e, coords) {
        if (this.state.isBezierDrawing) {
            this.redraw();
        }
    }

    onMouseUp(e, coords) {
        // Pen tool usually doesn't finish on mouse up, but on point click
    }

    onDeactivate() {
        super.onDeactivate();
        this.state.isBezierDrawing = false;
    }
}
