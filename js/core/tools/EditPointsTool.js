import { BaseTool } from './BaseTool.js';
import { BezierHandler } from '../BezierHandler.js';

export class EditPointsTool extends BaseTool {
    constructor(...args) {
        super(...args);
        this.activePoint = null;
    }

    onMouseDown(e, coords) {
        this.activePoint = BezierHandler.handleEditPointsStart(this.state, this.propertyEditor, this.updateCode, this.redraw.bind(this));
    }

    onMouseMove(e, coords) {
        if (this.state.currentShape && this.activePoint) {
            BezierHandler.handlePointMove(this.state, this.activePoint, coords.x, coords.y, this.updateCode, this.redraw.bind(this));
        }
    }

    onMouseUp(e, coords) {
        const moveDist = this.state.mouseDownPos ? Math.sqrt((e.clientX - this.state.mouseDownPos.x)**2 + (e.clientY - this.state.mouseDownPos.y)**2) : 100;
        const isClick = moveDist < 5;

        if (this.state.currentShape && this.activePoint) {
            if (this.state.mergeCandidate !== null && this.state.mergeCandidate !== undefined) {
                this.state.removePoint(this.state.currentShape, this.activePoint.index);
                this.state.mergeCandidate = null;
            } else if (isClick && this.activePoint.type === 'anchor') {
                this.state.togglePointType(this.state.currentShape, this.activePoint.index);
            }
        }
        this.activePoint = null;
        this.updateCode();
        this.redraw();
    }
}
