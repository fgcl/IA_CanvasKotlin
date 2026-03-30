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
            this.state.addShape(this.state.currentShape);
            this.state.selectedShapes = [this.state.currentShape];
        }
        this.state.isDrawing = false;
        this.state.currentShape = null;
        this.updateCode();
    }
}
