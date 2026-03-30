export class SelectionManager {
    constructor(state) {
        this.state = state;
    }

    selectShapesInRect(x, y, w, h, toggle = false) {
        const x1 = Math.min(x, x + w), y1 = Math.min(y, y + h), x2 = Math.max(x, x + w), y2 = Math.max(y, y + h);
        const found = this.state.shapes.filter(s => {
            const b = this.state.getShapeBounds(s);
            return b.x + b.w >= x1 && b.x <= x2 && b.y + b.h >= y1 && b.y <= y2;
        });

        if (toggle) {
            found.forEach(s => {
                const idx = this.state.selectedShapes.indexOf(s);
                if (idx === -1) this.state.selectedShapes.push(s); else this.state.selectedShapes.splice(idx, 1);
            });
        } else {
            this.state.selectedShapes = found;
        }
        return this.state.selectedShapes;
    }

    selectShape(x, y, toggle = false, deep = false) {
        const current = this.state.selectedShapes[0];
        
        // 1. Smart Sibling Selection (Drill-down continuity)
        if (current && current.parentId) {
            const parentGroup = this.state.findShapeById(current.parentId);
            if (parentGroup && parentGroup.children) {
                const foundSibling = this.findShapeAt(x, y, parentGroup.children, deep);
                if (foundSibling) {
                    this.applySelection(foundSibling, toggle);
                    return foundSibling;
                }
            }
        }

        // 2. Global Selection
        const found = this.findShapeAt(x, y, this.state.shapes, deep);
        
        if (found) {
            this.applySelection(found, toggle);
            return found;
        } else if (!toggle) { 
            this.state.selectedShapes = []; 
        }
        return null;
    }

    applySelection(shape, toggle) {
        if (toggle) {
            const idx = this.state.selectedShapes.indexOf(shape);
            if (idx === -1) this.state.selectedShapes.push(shape); else this.state.selectedShapes.splice(idx, 1);
        } else if (!this.state.selectedShapes.includes(shape)) { 
            this.state.selectedShapes = [shape]; 
        }
    }

    findShapeAt(x, y, list, deep = false) {
        for (let i = list.length - 1; i >= 0; i--) {
            const shape = list[i];
            if (!shape.visible || shape.locked) continue;

            if (deep && shape.type === 'group' && shape.children) {
                const childFound = this.findShapeAt(x, y, shape.children, deep);
                if (childFound) return childFound;
            }

            if (this.state.isPointInShape(x, y, shape)) {
                return shape;
            }
        }
        return null;
    }
}
