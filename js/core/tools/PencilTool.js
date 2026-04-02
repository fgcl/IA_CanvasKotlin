import { BaseTool } from './BaseTool.js';

export class PencilTool extends BaseTool {
    onMouseDown(e, coords) {
        const props = this.getCurrentProps();
        this.state.isDrawing = true;
        this.state.currentShape = {
            type: 'pencil',
            x: coords.x, y: coords.y,
            points: [{x: coords.x, y: coords.y}],
            fillColor: 'transparent',
            strokeColor: props.strokeColor,
            strokeWidth: props.strokeWidth,
            opacity: props.opacity,
            useFill: false,
            useStroke: true
        };
    }

    onMouseMove(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            this.state.currentShape.points.push({x: coords.x, y: coords.y});
        }
    }

    onMouseUp(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            // Only add if we have at least 3 points (prevent click-spots)
            if (this.state.currentShape.points.length > 2) {
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
