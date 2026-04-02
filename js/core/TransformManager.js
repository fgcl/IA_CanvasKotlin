import { LayoutEngine } from './LayoutEngine.js';
import { SnapEngine } from './SnapEngine.js';

export class TransformManager {
    constructor(state) {
        this.state = state;
    }

    getAbsoluteCoords(shape) {
        if (!shape.parentId) return { x: (shape.x || 0), y: (shape.y || 0) };
        
        // Use the active/animated state of the parent for absolute positioning
        const parent = this.state.getActiveShape(shape.parentId);
        if (!parent) return { x: (shape.x || 0), y: (shape.y || 0) };
        
        const pAbs = this.getAbsoluteCoords(parent);
        return { x: pAbs.x + (shape.x || 0), y: pAbs.y + (shape.y || 0) };
    }

    getShapeBounds(shape) {
        if (!shape) return { x: 0, y: 0, w: 0, h: 0 };
        const abs = this.getAbsoluteCoords(shape);
        const x = abs.x, y = abs.y;
        
        if (shape.type === 'group') {
            return { x: x, y: y, w: (shape.width || 0), h: (shape.height || 0) };
        }

        if (shape.type === 'rect' || shape.type === 'image') {
            return { 
                x: Math.min(x, x + (shape.width || 0)), 
                y: Math.min(y, y + (shape.height || 0)), 
                w: Math.abs(shape.width || 0), 
                h: Math.abs(shape.height || 0) 
            };
        }
        if (shape.type === 'circle') {
            const r = Math.sqrt((shape.width || 0)**2 + (shape.height || 0)**2);
            return { x: x - r, y: y - r, w: r * 2, h: r * 2 };
        }
        if (shape.type === 'line') {
            // Line endX is also relative if start is relative
            return { 
                x: Math.min(x, x + (shape.endX - shape.x)), 
                y: Math.min(y, y + (shape.endY - shape.y)),
                w: Math.abs(shape.x - shape.endX),
                h: Math.abs(shape.y - shape.endY)
            };
        }
        if (shape.points && shape.points.length > 0) {
            const xs = shape.points.map(p => [x + (p.x - shape.x), x + ( (p.cp1x||p.x) - shape.x), x + ( (p.cp2x||p.x) - shape.x)]).flat().filter(v => v !== undefined);
            const ys = shape.points.map(p => [y + (p.y - shape.y), y + ( (p.cp1y||p.y) - shape.y), y + ( (p.cp2y||p.y) - shape.y)]).flat().filter(v => v !== undefined);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        }
        if (shape.type === 'text') {
            const fs = shape.fontSize || 16;
            const width = (shape.text || '').length * fs * 0.6;
            return { x: x, y: y, w: width, h: fs };
        }
        if (shape.type === 'icon') {
            return { x: x, y: y, w: shape.width || 48, h: shape.height || 48 };
        }
        if (['button', 'input', 'checkbox', 'switch', 'slider', 'progress'].includes(shape.type)) {
            return { 
                x: x, 
                y: y, 
                w: Math.max(20, shape.width || 120), 
                h: Math.max(10, shape.height || 40) 
            };
        }
        return { x: 0, y: 0, w: 0, h: 0 };
    }

    getSelectionBounds() {
        if (this.state.selectedShapes.length === 0) return null;
        const bounds = this.state.selectedShapes.map(s => this.getShapeBounds(s));
        const minX = Math.min(...bounds.map(b => b.x));
        const minY = Math.min(...bounds.map(b => b.y));
        const maxX = Math.max(...bounds.map(b => b.x + b.w));
        const maxY = Math.max(...bounds.map(b => b.y + b.h));
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    getResizeHandles(shape) {
        const b = this.getShapeBounds(shape);
        const margin = 2;
        return [
            { x: b.x - margin, y: b.y - margin, cursor: 'nw-resize', id: 'tl' },
            { x: b.x + b.w/2, y: b.y - margin, cursor: 'n-resize', id: 't' },
            { x: b.x + b.w + margin, y: b.y - margin, cursor: 'ne-resize', id: 'tr' },
            { x: b.x + b.w + margin, y: b.y + b.h/2, cursor: 'e-resize', id: 'r' },
            { x: b.x + b.w + margin, y: b.y + b.h + margin, cursor: 'se-resize', id: 'br' },
            { x: b.x + b.w/2, y: b.y + b.h + margin, cursor: 's-resize', id: 'b' },
            { x: b.x - margin, y: b.y + b.h + margin, cursor: 'sw-resize', id: 'bl' },
            { x: b.x - margin, y: b.y + b.h/2, cursor: 'w-resize', id: 'w' }
        ];
    }

    getHandleAt(x, y) {
        if (this.state.selectedShapes.length !== 1) return null;
        const shape = this.state.selectedShapes[0];
        const handles = this.getResizeHandles(shape);
        const hitRadius = 15 / this.state.zoom;
        return handles.find(h => Math.abs(x - h.x) < hitRadius && Math.abs(y - h.y) < hitRadius);
    }

    resizeShape(shape, handleId, dx, dy, shiftKey = false) {
        const b = this.getShapeBounds(shape);
        let newX = shape.x;
        let newY = shape.y;
        let newW = shape.width !== undefined ? shape.width : (shape.type === 'icon' ? 48 : (shape.type === 'text' ? (shape.text || '').length * (shape.fontSize || 16) * 0.6 : 0));
        let newH = shape.height !== undefined ? shape.height : (shape.type === 'icon' ? 48 : (shape.type === 'text' ? (shape.fontSize || 16) : 0));

        this.state.activeSnaps = { x: [], y: [] };
        
        const dimensionTypes = ['rect', 'image', 'icon', 'text', 'circle', 'button', 'input', 'checkbox', 'switch', 'slider', 'progress'];
        if (dimensionTypes.includes(shape.type)) {
            const isL = handleId.includes('l') || handleId === 'w';
            const isR = handleId.includes('r') || handleId === 'e';
            const isT = handleId.includes('t') || handleId === 'n';
            const isB = handleId.includes('b') || handleId === 's';

            const oldW = shape.width || 48, oldH = shape.height || 48;
            const oldX = shape.x, oldY = shape.y;

            if (isL) { newX += dx; newW -= dx; }
            if (isR) { newW += dx; }
            if (isT) { newY += dy; newH -= dy; }
            if (isB) { newH += dy; }
            
            this.state.activeSnaps = { x: [], y: [] };
            
            // Initial clamp
            newW = Math.max(1, newW);
            newH = Math.max(1, newH);

            const targets = SnapEngine.getSnapTargets(shape, this.state, this);
            const snapThreshold = (this.state.snapThreshold || 8) / this.state.zoom;

            const applySnap = (val, axisHandles, isAxisX) => {
                // 1. Grid snapping (Priority)
                if (this.state.snapToGrid && this.state.gridType !== 'none') {
                    const snapped = SnapEngine.snapPoint(isAxisX ? val : 0, isAxisX ? 0 : val, this.state);
                    return isAxisX ? snapped.x : snapped.y;
                }

                // 2. Smart object snapping
                const snap = SnapEngine.findBestSnap([val], isAxisX ? targets.x : targets.y, this.state, snapThreshold);
                if (snap) {
                    this.state.activeSnaps[isAxisX ? 'x' : 'y'].push(SnapEngine.calculateSnapRange(snap.value, isAxisX ? 'x' : 'y', shape, this.state, this));
                    return snap.value;
                }
                return val;
            };

            if (isL) { 
                const abs = this.getAbsoluteCoords(shape);
                const snappedX = applySnap(abs.x + (newX - shape.x), ['l'], true);
                const deltaX = snappedX - (abs.x + (newX - shape.x));
                newX += deltaX; newW -= deltaX;
            } else if (isR) {
                const abs = this.getAbsoluteCoords(shape);
                const snappedRight = applySnap(abs.x + newW + (newX - shape.x), ['r'], true);
                newW = snappedRight - (abs.x + (newX - shape.x));
            }

            if (isT) {
                const abs = this.getAbsoluteCoords(shape);
                const snappedY = applySnap(abs.y + (newY - shape.y), ['t'], false);
                const deltaY = snappedY - (abs.y + (newY - shape.y));
                newY += deltaY; newH -= deltaY;
            } else if (isB) {
                const abs = this.getAbsoluteCoords(shape);
                const snappedBottom = applySnap(abs.y + newH + (newY - shape.y), ['b'], false);
                newH = snappedBottom - (abs.y + (newY - shape.y));
            }

            // Proportional Lock (Applied AFTER snapping to keep it precise)
            if (shape.type === 'image' || shape.type === 'icon' || shape.type === 'circle' || shiftKey) {
                const ratio = shape.aspectRatio || (oldW / oldH) || 1;
                if (isL || isR) {
                    newH = newW / ratio;
                    if (isT) newY = oldY - (newH - oldH);
                } else if (isT || isB) {
                    newW = newH * ratio;
                    if (isL) newX = oldX - (newW - oldW);
                }
            }

            shape.x = newX; shape.y = newY; 
            
            if (shape.type === 'text') {
                shape.fontSize = Math.max(1, newH);
                // Width is calculated based on fontSize
                shape.width = (shape.text || '').length * shape.fontSize * 0.6;
                shape.height = shape.fontSize;
                this.state.syncKeyframes(shape, ['x', 'y', 'fontSize', 'width', 'height']);
            } else {
                shape.width = newW; shape.height = newH;
                this.state.syncKeyframes(shape, ['x', 'y', 'width', 'height']);
            }
            if (shape.children) LayoutEngine.applyConstraints(shape, oldW, oldH, this);
            if (shape.layout?.type !== 'none') LayoutEngine.applyLayout(shape);
        } else {
            this.resizeGeneric(shape, handleId, dx, dy);
        }
    }

    resizeGeneric(shape, handleId, dx, dy) {
        const snap = (x, y) => SnapEngine.snapCoords(x, y, this.state, this, [shape]);
        
        if (shape.type === 'group') {
            const oldW = shape.width, oldH = shape.height;
            let nx = shape.x + dx, ny = shape.y + dy;
            let nw = shape.width, nh = shape.height;

            if (handleId.includes('l') || handleId === 'w') { 
                const s = snap(nx, ny);nx = s.x; dx = nx - shape.x; nw -= dx;
            }
            if (handleId.includes('r')) { 
                const s = snap(nx + nw + dx, ny); nw = s.x - nx; 
            }
            if (handleId.includes('t')) { 
                const s = snap(nx, ny); ny = s.y; dy = ny - shape.y; nh -= dy;
            }
            if (handleId.includes('b')) { 
                const s = snap(nx, ny + nh + dy); nh = s.y - ny;
            }
            
            shape.x = nx; shape.y = ny;
            shape.width = Math.max(1, nw);
            shape.height = Math.max(1, nh);

            this.state.syncKeyframes(shape, ['x', 'y', 'width', 'height']);
            LayoutEngine.applyConstraints(shape, oldW, oldH, this);
        } else if (shape.type === 'circle') {
             let nw = shape.width, nh = shape.height;
             if (handleId.includes('l')) { nw -= dx; } else if (handleId.includes('r')) { nw += dx; }
             if (handleId.includes('t')) { nh -= dy; } else if (handleId.includes('b')) { nh += dy; }
             // Circles usually snap via dimensionTypes but resizeGeneric is fallback
             shape.width = nw; shape.height = nh;
             this.state.syncKeyframes(shape, ['width', 'height']);
        } else if (shape.type === 'line') {
            if (['tl', 't', 'l', 'w', 'bl'].includes(handleId)) { 
                const s = snap(shape.x + dx, shape.y + dy);
                shape.x = s.x; shape.y = s.y; 
            } else { 
                const s = snap(shape.endX + dx, shape.endY + dy);
                shape.endX = s.x; shape.endY = s.y; 
            }
            this.state.syncKeyframes(shape, ['x', 'y', 'endX', 'endY']);
        }
    }

    alignShapes(type, canvasSize = null) {
        if (this.state.selectedShapes.length < 1) return;
        let totalBounds = (this.state.selectedShapes.length === 1 && canvasSize) ? 
            { x: 0, y: 0, w: canvasSize.width, h: canvasSize.height } : this.getSelectionBounds();
        if (!totalBounds) return;

        this.state.saveState();
        this.state.selectedShapes.forEach(shape => {
            const b = this.getShapeBounds(shape);
            let dx = 0, dy = 0;
            if (type === 'left') dx = totalBounds.x - b.x;
            else if (type === 'center') dx = (totalBounds.x + totalBounds.w/2) - (b.x + b.w/2);
            else if (type === 'right') dx = (totalBounds.x + totalBounds.w) - (b.x + b.w);
            else if (type === 'top') dy = totalBounds.y - b.y;
            else if (type === 'middle') dy = (totalBounds.y + totalBounds.h/2) - (b.y + b.h/2);
            else if (type === 'bottom') dy = (totalBounds.y + totalBounds.h) - (b.y + b.h);
            
            this.moveShapeSilent(shape, dx, dy);
            this.state.syncKeyframes(shape, ['x', 'y']);
        });
    }

    moveShape(shape, dx, dy) {
        this.moveShapes([shape], dx, dy);
    }

    moveShapes(shapes, dx, dy) {
        if (!shapes || shapes.length === 0) return;

        // Move all shapes silently first
        shapes.forEach(s => this.moveShapeSilent(s, dx, dy));

        // Global Grid Snapping
        if (this.state.snapToGrid && this.state.gridType !== 'none') {
            const bounds = this.getSelectionBoundsFor(shapes);
            const snapped = SnapEngine.snapPoint(bounds.x, bounds.y, this.state);
            const snapDX = snapped.x - bounds.x;
            const snapDY = snapped.y - bounds.y;
            shapes.forEach(s => this.moveShapeSilent(s, snapDX, snapDY));
            this.state.activeSnaps = { x: [], y: [] }; // Grid usually doesn't show guide lines
        } else {
            // Smart Object Snapping (Figma-like Collective Snapping)
            this.state.activeSnaps = { x: [], y: [] };
            
            // For collective snapping, we use the bounding box of the whole selection
            const bounds = this.getSelectionBoundsFor(shapes);
            const candidates = SnapEngine.getSnapPoints(bounds);
            const targets = SnapEngine.getSnapTargets(shapes, this.state, this);

            const snapX = SnapEngine.findBestSnap(candidates.x, targets.x, this.state);
            if (snapX) {
                shapes.forEach(s => this.moveShapeSilent(s, snapX.diff, 0));
                this.state.activeSnaps.x.push(SnapEngine.calculateSnapRange(snapX.value, 'x', shapes[0], this.state, this));
            }

            const snapY = SnapEngine.findBestSnap(candidates.y, targets.y, this.state);
            if (snapY) {
                shapes.forEach(s => this.moveShapeSilent(s, 0, snapY.diff));
                this.state.activeSnaps.y.push(SnapEngine.calculateSnapRange(snapY.value, 'y', shapes[0], this.state, this));
            }
        }
        
        shapes.forEach(s => this.state.syncKeyframes(s, ['x', 'y']));
    }

    getSelectionBoundsFor(shapes) {
        if (shapes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
        const bounds = shapes.map(s => this.getShapeBounds(s));
        const minX = Math.min(...bounds.map(b => b.x));
        const minY = Math.min(...bounds.map(b => b.y));
        const maxX = Math.max(...bounds.map(b => b.x + b.w));
        const maxY = Math.max(...bounds.map(b => b.y + b.h));
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    moveShapeSilent(shape, dx, dy) {
        shape.x += dx; shape.y += dy;
        if (shape.points) shape.points.forEach(p => { 
            p.x += dx; p.y += dy; 
            if (p.cp1x !== undefined) { p.cp1x += dx; p.cp1y += dy; p.cp2x += dx; p.cp2y += dy; }
        });
        if (shape.type === 'line') { shape.endX += dx; shape.endY += dy; }
    }

    commitSnaps() {
        this.state.snapOffset = { x: 0, y: 0 };
        this.state.activeSnaps = { x: [], y: [] };
    }
}
