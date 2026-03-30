export class LayoutEngine {
    static applyConstraints(parent, oldW, oldH, transformManager) {
        if (!parent || !parent.children || parent.children.length === 0 || (oldW === parent.width && oldH === parent.height)) return;
        
        const newW = parent.width;
        const newH = parent.height;
        const dw = newW - oldW;
        const dh = newH - oldH;
        const rw = newW / (oldW || 1);
        const rh = newH / (oldH || 1);

        parent.children.forEach(child => {
            const c = child.constraints || { horizontal: 'left', vertical: 'top' };
            const oldChildW = child.width || 0;
            const oldChildH = child.height || 0;
            
            // 1. Horizontal Transform
            let hDx = 0, hScale = 1;
            if (c.horizontal === 'right') hDx = dw;
            else if (c.horizontal === 'center') hDx = dw / 2;
            else if (c.horizontal === 'scale') hScale = rw;

            // 2. Vertical Transform
            let vDy = 0, vScale = 1;
            if (c.vertical === 'bottom') vDy = dh;
            else if (c.vertical === 'center') vDy = dh / 2;
            else if (c.vertical === 'scale') vScale = rh;

            // Apply to coordinates
            if (hScale !== 1) child.x *= hScale; else child.x += hDx;
            if (vScale !== 1) child.y *= vScale; else child.y += vDy;

            // Apply to size/points
            if (child.width !== undefined) {
                if (c.horizontal === 'scale') child.width *= rw;
                else if (c.horizontal === 'both') child.width += dw;
            }
            if (child.height !== undefined) {
                if (c.vertical === 'scale') child.height *= rh;
                else if (c.vertical === 'both') child.height += dh;
            }

            // Path point stretching
            if (child.points && child.points.length > 0) {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                child.points.forEach(p => {
                    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
                });
                
                const bWidth = maxX - minX || 1;
                const bHeight = maxY - minY || 1;
                const stretchSx = (bWidth + dw) / bWidth;
                const stretchSy = (bHeight + dh) / bHeight;

                child.points.forEach(p => {
                    const adjustX = (val) => c.horizontal === 'both' ? minX + (val - minX) * stretchSx : (hScale !== 1 ? val * hScale : val + hDx);
                    const adjustY = (val) => c.vertical === 'both' ? minY + (val - minY) * stretchSy : (vScale !== 1 ? val * vScale : val + vDy);

                    p.x = adjustX(p.x); p.y = adjustY(p.y);
                    if (p.cp1x !== undefined) { p.cp1x = adjustX(p.cp1x); p.cp1y = adjustY(p.cp1y); }
                    if (p.cp2x !== undefined) { p.cp2x = adjustX(p.cp2x); p.cp2y = adjustY(p.cp2y); }
                });
            } else if (child.type === 'line') {
                if (hScale !== 1) child.endX *= hScale; else child.endX += hDx;
                if (vScale !== 1) child.endY *= vScale; else child.endY += vDy;
            }

            if (child.type === 'text') {
                if (c.vertical === 'scale') child.fontSize = Math.max(1, (child.fontSize || 16) * rh);
                else if (c.vertical === 'both') child.fontSize = Math.max(1, (child.fontSize || 16) + dh);
            }

            // Recurse for nested groups
            if (child.type === 'group') {
                LayoutEngine.applyConstraints(child, oldChildW, oldChildH, transformManager);
            }
        });

        // 2. Process Auto Layout (Stacks) if active
        if (parent.layout && parent.layout.type !== 'none') {
            LayoutEngine.applyAutoLayout(parent);
        }
    }

    static applyCanvasConstraints(state, oldW, oldH) {
        const dummyCanvas = {
            width: state.canvasSize.width,
            height: state.canvasSize.height,
            children: state.shapes.filter(s => !s.parentId)
        };
        this.applyConstraints(dummyCanvas, oldW, oldH, state.transformManager);
    }

    static applyLayout(parent) {
        this.applyAutoLayout(parent);
    }

    static applyAutoLayout(parent) {
        if (!parent) return;
        const layout = parent.layout || { type: 'none', gap: 0, padding: 0 };
        if (layout.type === 'none' || !parent.children || parent.children.length === 0) return;

        let currentPos = layout.padding || 0;
        const gap = layout.gap || 0;

        parent.children.filter(c => c.visible !== false).forEach(child => {
            if (layout.type === 'column') {
                child.y = currentPos;
                child.x = layout.padding || 0;
                currentPos += (child.height || 0) + gap;
            } else if (layout.type === 'row') {
                child.x = currentPos;
                child.y = layout.padding || 0;
                currentPos += (child.width || 0) + gap;
            }
        });
    }
}
