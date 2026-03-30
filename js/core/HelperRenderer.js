export class HelperRenderer {
    static drawSelectionHighlight(shape, state, ctx, offsetX = 0, offsetY = 0) {
        if (state.currentTool === 'edit-points') return;
        const bounds = state.getShapeBounds(shape);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
        
        // Resize Handles
        const handles = state.getResizeHandles(shape);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2; ctx.setLineDash([]);
        const s = 10;
        handles.forEach(h => {
            ctx.beginPath(); ctx.rect(h.x - s/2, h.y - s/2, s, s); ctx.fill(); ctx.stroke();
        });

        // Constraint Indicators (NEW)
        if (shape.parentId) {
            this.drawConstraintIndicators(shape, state, ctx);
        }
        ctx.restore();
    }

    static drawConstraintIndicators(shape, state, ctx) {
        // Find parent with new recursive search
        const parent = state.findShapeById(shape.parentId);
        if (!parent) return;

        // Both use absolute bounds now
        const pb = state.getShapeBounds(parent);
        const cb = state.getShapeBounds(shape);
        const c = shape.constraints || { horizontal: 'left', vertical: 'top' };

        ctx.save();
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.8)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.setLineDash([4, 4]);

        const drawLine = (x1, y1, x2, y2) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            this.drawTBar(ctx, x1, y1, x2, y2, state.zoom);
        };

        // Horizontal
        if (c.horizontal === 'left' || c.horizontal === 'both') {
            drawLine(pb.x, cb.y + cb.h / 2, cb.x, cb.y + cb.h / 2);
        }
        if (c.horizontal === 'right' || c.horizontal === 'both') {
            drawLine(pb.x + pb.w, cb.y + cb.h / 2, cb.x + cb.w, cb.y + cb.h / 2);
        }
        if (c.horizontal === 'center') {
            drawLine(pb.x + pb.w / 2, cb.y + cb.h / 2, cb.x + cb.w / 2, cb.y + cb.h / 2);
        }

        // Vertical
        if (c.vertical === 'top' || c.vertical === 'both') {
            drawLine(cb.x + cb.w / 2, pb.y, cb.x + cb.w / 2, cb.y);
        }
        if (c.vertical === 'bottom' || c.vertical === 'both') {
            drawLine(cb.x + cb.w / 2, pb.y + pb.h, cb.x + cb.w / 2, cb.y + cb.h);
        }
        if (c.vertical === 'center') {
            drawLine(cb.x + cb.w / 2, pb.y + pb.h / 2, cb.x + cb.w / 2, cb.y + cb.h / 2);
        }

        ctx.restore();
    }

    static drawTBar(ctx, x1, y1, x2, y2, zoom) {
        const size = 6 / zoom;
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 2) return;
        const ux = dx / len, uy = dy / len;
        
        ctx.setLineDash([]);
        const drawCap = (x, y) => {
            ctx.beginPath();
            ctx.moveTo(x - uy * size, y + ux * size);
            ctx.lineTo(x + uy * size, y - ux * size);
            ctx.stroke();
        };
        drawCap(x1, y1);
        drawCap(x2, y2);
        ctx.setLineDash([4, 4]);
    }

    static drawSnappingGuides(snaps, ctx) {
        ctx.save();
        ctx.strokeStyle = '#ff7b72'; 
        ctx.lineWidth = 1; 
        ctx.setLineDash([]); // Solid lines are cleaner for layout tools like Figma
        
        const draw = (s, isX) => {
            ctx.beginPath();
            if (isX) { 
                ctx.moveTo(s.value, s.min); 
                ctx.lineTo(s.value, s.max); 
            } else { 
                ctx.moveTo(s.min, s.value); 
                ctx.lineTo(s.max, s.value); 
            }
            ctx.stroke();

            // Draw small dot at snap points for extra precision feel
            ctx.fillStyle = '#ff7b72';
            ctx.beginPath();
            if (isX) {
                ctx.arc(s.value, s.min, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s.value, s.max, 2, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.arc(s.min, s.value, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s.max, s.value, 2, 0, Math.PI * 2); ctx.fill();
            }
        };
        if (snaps.x) snaps.x.forEach(s => draw(s, true));
        if (snaps.y) snaps.y.forEach(s => draw(s, false));
        ctx.restore();
    }

    static drawMarquee(rect, ctx) {
        ctx.save();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = 'rgba(88, 166, 255, 0.1)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
    }

    static drawBezierHelpers(shape, state, ctx) {
        if (!shape.points) return;
        shape.points.forEach((p, i) => {
            const isTarget = state.mergeCandidate === i;
            ctx.strokeStyle = isTarget ? '#ff7b72' : '#58a6ff';
            ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
            if (p.isSmooth) {
                ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.stroke();
            } else {
                ctx.strokeRect(p.x - 5, p.y - 5, 10, 10);
            }
        });
    }
}
