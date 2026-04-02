export class SnapEngine {

    // Grid snapping — called when snapToGrid is enabled
    static snapPoint(x, y, state) {
        if (!state.snapToGrid || state.gridType === 'none') return { x, y };
        
        const size = state.gridSize;
        const threshold = (state.snapThreshold || 5) / state.zoom;

        if (state.gridType === 'square' || state.gridType === 'dots') {
            const snappedX = Math.round(x / size) * size;
            const snappedY = Math.round(y / size) * size;
            
            return {
                x: Math.abs(x - snappedX) < threshold ? snappedX : x,
                y: Math.abs(y - snappedY) < threshold ? snappedY : y
            };
        } else if (state.gridType === 'isometric') {
            const angle = Math.PI / 6;
            const tanA = Math.tan(angle);
            const c1 = y - tanA * x;
            const c2 = y + tanA * x;
            const snappedC1 = Math.round(c1 / size) * size;
            const snappedC2 = Math.round(c2 / size) * size;
            return {
                x: (snappedC2 - snappedC1) / (2 * tanA),
                y: (snappedC1 + snappedC2) / 2
            };
        }
        return { x, y };
    }

    // All-in-one: snaps a coordinate during shape creation (grid OR smart alignment)
    static snapCoords(x, y, state, transformManager, excludeShapes = []) {
        // Grid snapping takes priority when enabled
        if (state.snapToGrid && state.gridType !== 'none') {
            return this.snapPoint(x, y, state);
        }

        // Smart object + artboard snapping during creation
        const threshold = (state.snapThreshold || 5) / state.zoom;
        const targets = this.getSnapTargets(excludeShapes, state, transformManager);

        const snapX = this.findBestSnap([x], targets.x, state, threshold);
        const snapY = this.findBestSnap([y], targets.y, state, threshold);

        return {
            x: snapX ? snapX.value : x,
            y: snapY ? snapY.value : y
        };
    }

    // Extract left/center/right and top/middle/bottom from a {x,y,w,h} bounds object
    static getSnapPoints(bounds) {
        return {
            x: [bounds.x, bounds.x + bounds.w / 2, bounds.x + bounds.w],
            y: [bounds.y, bounds.y + bounds.h / 2, bounds.y + bounds.h]
        };
    }

    // Find the best snapping target given a list of candidates and targets
    static findBestSnap(candidates, targets, state, customThreshold = null) {
        let best = null;
        // 5px at screen resolution — light, non-intrusive, like Figma
        let minDiff = customThreshold !== null ? customThreshold : (state.snapThreshold || 5) / state.zoom;
        
        for (const candidate of candidates) {
            for (const target of targets) {
                const diff = Math.abs(candidate - target);
                if (diff < minDiff) {
                    minDiff = diff;
                    best = { value: target, candidate, diff: target - candidate };
                }
            }
        }
        return best;
    }

    // Collect all snap target coordinates from other shapes + artboard
    static getSnapTargets(excludeShapes, state, transformManager) {
        const excludeList = Array.isArray(excludeShapes) ? excludeShapes : [excludeShapes];
        const targets = { 
            x: [0, state.canvasSize.width, state.canvasSize.width / 2], 
            y: [0, state.canvasSize.height, state.canvasSize.height / 2] 
        };
        state.shapes.forEach(other => {
            if (!other || excludeList.includes(other) || other.visible === false || state.selectedShapes.includes(other)) return;
            const ob = transformManager.getShapeBounds(other);
            const points = this.getSnapPoints(ob);
            targets.x.push(...points.x);
            targets.y.push(...points.y);
        });
        return targets;
    }

    // Calculate the visual extent of the snap guide line
    static calculateSnapRange(value, axis, movingShape, state, transformManager) {
        const b = transformManager.getShapeBounds(movingShape);
        let min = axis === 'x' ? b.y : b.x;
        let max = axis === 'x' ? b.y + b.h : b.x + b.w;
        
        // Extend to canvas edges when snapping to artboard
        const canvasSize = axis === 'x' ? state.canvasSize.height : state.canvasSize.width;
        const isArtboard = Math.abs(value) < 1 ||
            Math.abs(value - (axis === 'x' ? state.canvasSize.width : state.canvasSize.height)) < 1 ||
            Math.abs(value - (axis === 'x' ? state.canvasSize.width / 2 : state.canvasSize.height / 2)) < 1;
        if (isArtboard) {
            min = Math.min(min, 0);
            max = Math.max(max, canvasSize);
        }

        // Extend to include aligned objects
        state.shapes.forEach(other => {
            if (other.visible === false || state.selectedShapes.includes(other)) return;
            const ob = transformManager.getShapeBounds(other);
            const otherPoints = this.getSnapPoints(ob)[axis];
            if (otherPoints.some(p => Math.abs(p - value) < 1)) {
                if (axis === 'x') { min = Math.min(min, ob.y); max = Math.max(max, ob.y + ob.h); }
                else { min = Math.min(min, ob.x); max = Math.max(max, ob.x + ob.w); }
            }
        });

        return { value, min, max };
    }
}
