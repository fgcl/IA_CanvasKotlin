export class PathManager {
    constructor(state) {
        this.state = state;
    }

    findNearestPoint(shape, x, y) {
        if (!shape || !shape.points) return null;
        let nearest = null; let minDist = 25;
        shape.points.forEach((p, index) => {
            const d = Math.sqrt((x - p.x)**2 + (y - p.y)**2);
            if (d < minDist) { minDist = d; nearest = { index, type: 'anchor' }; }
        });
        return nearest;
    }

    removePoint(shape, index) {
        if (shape.points && shape.points.length > 2) { 
            this.state.saveState(); 
            shape.points.splice(index, 1); 
            return true; 
        }
        return false;
    }

    togglePointType(shape, index) {
        if (!shape || !shape.points || !shape.points[index]) return;
        this.state.saveState();
        const p = shape.points[index];
        p.isSmooth = !p.isSmooth;
        this.updateBezierHandles(shape);
    }

    updateBezierHandles(shape) {
        if (!shape || !shape.points || shape.points.length < 2) return;
        for (let i = 0; i < shape.points.length; i++) {
            const p = shape.points[i];
            if (!p.isSmooth) {
                p.cp1x = p.x; p.cp1y = p.y; p.cp2x = p.x; p.cp2y = p.y;
                continue;
            }
            const prev = shape.points[(i - 1 + shape.points.length) % shape.points.length];
            const next = shape.points[(i + 1) % shape.points.length];
            const dx = next.x - prev.x; const dy = next.y - prev.y;
            const angle = Math.atan2(dy, dx);
            const dPrev = Math.sqrt((p.x - prev.x)**2 + (p.y - prev.y)**2);
            const dNext = Math.sqrt((p.x - next.x)**2 + (p.y - next.y)**2);
            const factor = 0.35;
            const h1Len = dPrev * factor; const h2Len = dNext * factor;
            p.cp1x = p.x - Math.cos(angle) * h1Len; p.cp1y = p.y - Math.sin(angle) * h1Len;
            p.cp2x = p.x + Math.cos(angle) * h2Len; p.cp2y = p.y + Math.sin(angle) * h2Len;
        }
    }

    findNearestSegment(shape, x, y) {
        if (!shape || !shape.points || shape.points.length < 2) return null;
        let minHitDist = 15 / this.state.zoom;
        let bestSegment = null;
        for (let i = 0; i < shape.points.length; i++) {
            const p1 = shape.points[i];
            const p2 = shape.points[(i + 1) % shape.points.length];
            const res = this.getDistanceToBezier(x, y, p1.x, p1.y, p1.cp2x || p1.x, p1.cp2y || p1.y, p2.cp1x || p2.x, p2.cp1y || p2.y, p2.x, p2.y);
            if (res.dist < minHitDist) { minHitDist = res.dist; bestSegment = { index: i, t: res.t, x: x, y: y }; }
        }
        return bestSegment;
    }

    getDistanceToBezier(px, py, x0, y0, x1, y1, x2, y2, x3, y3) {
        const steps = 30; let minDist = Infinity; let bestT = 0;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = (1-t)**3 * x0 + 3*(1-t)**2*t * x1 + 3*(1-t)*t**2 * x2 + t**3 * x3;
            const cy = (1-t)**3 * y0 + 3*(1-t)**2*t * y1 + 3*(1-t)*t**2 * y2 + t**3 * y3;
            const d = Math.sqrt((px - cx)**2 + (py - cy)**2);
            if (d < minDist) { minDist = d; bestT = t; }
        }
        return { dist: minDist, t: bestT };
    }

    addPointAt(shape, segmentIndex, x, y) {
        if (!shape || !shape.points) return null;
        this.state.saveState();
        const newPoint = { x, y, cp1x: x, cp1y: y, cp2x: x, cp2y: y, isSmooth: true };
        shape.points.splice(segmentIndex + 1, 0, newPoint);
        this.updateBezierHandles(shape);
        return { index: segmentIndex + 1, type: 'anchor' };
    }
}
