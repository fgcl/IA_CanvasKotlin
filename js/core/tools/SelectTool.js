import { BaseTool } from './BaseTool.js';

export class SelectTool extends BaseTool {
    constructor(...args) {
        super(...args);
        this.isDragging = false;
    }

    onMouseDown(e, coords) {
        this.state.startX = coords.x;
        this.state.startY = coords.y;

        const handle = this.state.getHandleAt(coords.x, coords.y);
        if (handle) {
            this.state.activeResizeHandle = handle.id;
            this.state.saveState();
            return;
        }

        const hit = this.state.findShapeAt(coords.x, coords.y, this.state.shapes);
        const isMultiSelect = e.shiftKey;
        const isDeepSelect = e.ctrlKey || e.metaKey;

        const shape = this.state.selectShape(coords.x, coords.y, isMultiSelect, isDeepSelect);
        
        if (shape) {
            this.isDragging = true;
            this.propertyEditor.update(shape);
            this.state.saveState();
        } else if (!isMultiSelect) {
            this.state.marqueeRect = { x: coords.x, y: coords.y, w: 0, h: 0 };
        }
    }

    onMouseMove(e, coords) {
        if (this.state.activeResizeHandle) {
            this.state.isDrawing = true;
            const dx = coords.x - this.state.startX;
            const dy = coords.y - this.state.startY;
            this.state.resizeShape(this.state.selectedShapes[0], this.state.activeResizeHandle, dx, dy, e.shiftKey);
            this.state.startX = coords.x;
            this.state.startY = coords.y;
            this.updateCode();
            return;
        }

        if (this.state.marqueeRect) {
            this.state.marqueeRect.w = coords.x - this.state.marqueeRect.x;
            this.state.marqueeRect.h = coords.y - this.state.marqueeRect.y;
            return;
        }

        if (this.isDragging && this.state.selectedShapes.length > 0) {
            this.state.isDrawing = true;
            const dx = coords.x - this.state.startX;
            const dy = coords.y - this.state.startY;
            
            this.state.moveShapes(this.state.selectedShapes, dx, dy);
            
            this.state.startX = coords.x;
            this.state.startY = coords.y;
            this.updateCode();
        }
    }

    onMouseUp(e, coords) {
        if (this.state.marqueeRect) {
            this.state.selectShapesInRect(
                this.state.marqueeRect.x, 
                this.state.marqueeRect.y, 
                this.state.marqueeRect.w, 
                this.state.marqueeRect.h
            );
            if (this.state.selectedShapes.length > 0) {
                this.propertyEditor.update(this.state.selectedShapes[0]);
            }
            this.state.marqueeRect = null;
        }

        this.isDragging = false;
        this.state.isDrawing = false;
        this.state.activeResizeHandle = null;
        this.state.commitSnaps();
        this.state.activeSnaps = { x: [], y: [] };
    }
}
