export class DiagnosticRenderer {
    static drawOverlays(ctx, state, options) {
        if (!options.showBounds && !options.showPadding && !options.showGaps) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(state.panX, state.panY);
        ctx.scale(state.zoom, state.zoom);

        state.shapes.forEach(shape => {
            if (shape) this.drawShapeDebug(ctx, shape, options);
        });

        // 4. Selection Visuals (Handles & Constraint Pins)
        if (state.selectedShapes && state.selectedShapes.length === 1) {
            const selected = state.selectedShapes[0];
            this.drawSelectionExtras(ctx, selected, state);
        }
        ctx.restore();
    }

    static drawShapeDebug(ctx, shape, options) {
        if (!shape) return;
        const { x, y, width, height, layout, type, children } = shape;

        // 1. Padding Overlay (Purple)
        if (options.showPadding && layout && layout.padding > 0) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
            const p = layout.padding;
            // Draw 4 rectangles for padding areas
            ctx.fillRect(x, y, width, p); // Top
            ctx.fillRect(x, y + height - p, width, p); // Bottom
            ctx.fillRect(x, y + p, p, height - 2 * p); // Left
            ctx.fillRect(x + width - p, y + p, p, height - 2 * p); // Right
        }

        // 2. Gaps Overlay (Orange)
        if (options.showGaps && layout && layout.type !== 'none' && children && children.length > 1) {
            ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
            const sorted = [...children].sort((a, b) => layout.type === 'row' ? a.x - b.x : a.y - b.y);
            
            for (let i = 0; i < sorted.length - 1; i++) {
                const a = sorted[i];
                const b = sorted[i+1];
                if (layout.type === 'row') {
                    const gapX = a.x + (a.width || 0);
                    const gapW = b.x - gapX;
                    if (gapW > 0) ctx.fillRect(x + gapX, y, gapW, height);
                } else {
                    const gapY = a.y + (a.height || 0);
                    const gapH = b.y - gapY;
                    if (gapH > 0) ctx.fillRect(x, y + gapY, width, gapH);
                }
            }
        }

        // 3. Bounds (Cyan/Red based on type)
        if (options.showBounds) {
            ctx.strokeStyle = type === 'group' ? '#22d3ee' : '#94a3b8';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
        }

        // Recursive call for children
        if (children) {
            children.forEach(child => this.drawShapeDebug(ctx, child, options));
        }
    }

    static drawAssertions(ctx, assertions, state) {
        if (!assertions) return;
        
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        if (state) {
            ctx.translate(state.panX, state.panY);
            ctx.scale(state.zoom, state.zoom);
        }

        assertions.forEach(asrt => {
            if (asrt.type === 'coord') {
                ctx.beginPath();
                ctx.arc(asrt.x, asrt.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = asrt.pass ? '#22c55e' : '#ef4444';
                ctx.fill();
                
                if (!asrt.pass) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 1/state.zoom;
                    ctx.setLineDash([2/state.zoom, 2/state.zoom]);
                    ctx.strokeRect(asrt.x - 10, asrt.y - 10, 20, 20);
                    ctx.setLineDash([]);
                }
            }
        });
        ctx.restore();
    }

    static drawSelectionExtras(ctx, shape, state) {
        const b = state.getShapeBounds(shape);
        
        // 1. Resize Handles
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        const handles = state.getResizeHandles(shape);
        const size = 6;
        handles.forEach(h => {
            ctx.fillRect(h.x - size/2, h.y - size/2, size, size);
            ctx.strokeRect(h.x - size/2, h.y - size/2, size, size);
        });

        // 2. Constraint Pins (Dashed lines to parent edges)
        if (shape.parentId) {
            const parent = state.findShapeById(shape.parentId);
            if (!parent) return;
            const pAbs = state.getAbsoluteCoords(parent);
            const pW = parent.width || 0;
            const pH = parent.height || 0;
            
            ctx.setLineDash([2, 4]);
            ctx.strokeStyle = '#f43f5e'; // Rose pink for constraints
            ctx.beginPath();
            
            const c = shape.constraints || { horizontal: 'left', vertical: 'top' };
            const abs = state.getAbsoluteCoords(shape);
            const centerX = abs.x + (shape.width || 0)/2;
            const centerY = abs.y + (shape.height || 0)/2;

            // Horizontal Pins
            if (c.horizontal === 'left' || c.horizontal === 'both') {
                ctx.moveTo(pAbs.x, centerY); ctx.lineTo(abs.x, centerY);
            }
            if (c.horizontal === 'right' || c.horizontal === 'both') {
                ctx.moveTo(abs.x + (shape.width || 0), centerY); ctx.lineTo(pAbs.x + pW, centerY);
            }
            if (c.horizontal === 'center') {
                ctx.moveTo(pAbs.x + pW/2, centerY - 10); ctx.lineTo(pAbs.x + pW/2, centerY + 10);
            }

            // Vertical Pins
            if (c.vertical === 'top' || c.vertical === 'both') {
                ctx.moveTo(centerX, pAbs.y); ctx.lineTo(centerX, abs.y);
            }
            if (c.vertical === 'bottom' || c.vertical === 'both') {
                ctx.moveTo(centerX, abs.y + (shape.height || 0)); ctx.lineTo(centerX, pAbs.y + pH);
            }
            if (c.vertical === 'center') {
                ctx.moveTo(centerX - 10, pAbs.y + pH/2); ctx.lineTo(centerX + 10, pAbs.y + pH/2);
            }

            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
