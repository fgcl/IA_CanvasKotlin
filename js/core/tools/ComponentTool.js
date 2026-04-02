import { BaseTool } from './BaseTool.js';
import { SnapEngine } from '../SnapEngine.js';

export class ComponentTool extends BaseTool {
    onMouseDown(e, coords) {
        this.state.isDrawing = true;
        const tm = this.state.transformManager;
        const snapped = SnapEngine.snapCoords(coords.x, coords.y, this.state, tm);
        this.state.startX = snapped.x;
        this.state.startY = snapped.y;

        const type = this.state.currentComponentType || 'button';
        this.state.currentShape = {
            type: type,
            x: snapped.x,
            y: snapped.y,
            width: 0,
            height: 0,
            visible: true
        };
    }

    onMouseMove(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            const tm = this.state.transformManager;
            const snapped = SnapEngine.snapCoords(coords.x, coords.y, this.state, tm);
            this.state.currentShape.width = snapped.x - this.state.startX;
            this.state.currentShape.height = snapped.y - this.state.startY;
            this.redraw();
        }
    }

    onMouseUp(e, coords) {
        if (this.state.isDrawing && this.state.currentShape) {
            const MIN_SIZE = 10;
            const w = Math.abs(this.state.currentShape.width);
            const h = Math.abs(this.state.currentShape.height);

            // If it's a simple click (size too small), we could either:
            // 1. Discard (user's request: "precisa ter um tamanho minimo")
            // 2. Default size (like Figma)
            // The user said they DON'T want creation on click, so we discard if too small.
            if (w >= MIN_SIZE || h >= MIN_SIZE) {
                const finalShape = this.state.addShape(this.state.currentShape);
                this.state.selectedShapes = [finalShape];
                this.propertyEditor.update(finalShape);
                this.updateCode();
            }
        }
        this.state.isDrawing = false;
        this.state.currentShape = null;
        this.redraw();
    }
}
