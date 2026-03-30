export class RulerRenderer {
    static draw(canvas, state) {
        if (!canvas) return;
        this.drawRuler('ruler-horizontal', canvas.width, true, state);
        this.drawRuler('ruler-vertical', canvas.height, false, state);
    }

    static drawRuler(id, length, isHorizontal, state) {
        const el = document.getElementById(id);
        if (!el) return;
        
        let canvas = el.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            el.appendChild(canvas);
        }
        
        const dpr = window.devicePixelRatio || 1;
        const rect = el.getBoundingClientRect();
        if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }
        
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.fillStyle = '#8b949e';
        ctx.font = '9px Inter';
        ctx.textAlign = 'center';
        
        const zoom = state ? state.zoom : 1;
        const pan = state ? (isHorizontal ? state.panX : state.panY) : 0;
        
        const subStep = 10 * zoom;
        const labelStep = 50; // Label in canvas units

        const start = -pan;
        const end = start + (isHorizontal ? rect.width : rect.height);
        
        let currentSubStep = subStep;
        if (zoom < 0.5) { currentSubStep *= 2; }
        if (zoom < 0.2) { currentSubStep *= 2; }
        
        for (let i = Math.floor(start / currentSubStep) * currentSubStep; i <= end; i += currentSubStep) {
            const canvasPos = i;
            const screenPos = canvasPos * zoom + pan;
            const value = Math.round(canvasPos);
            
            const isBig = value % labelStep === 0;
            const h = isBig ? (isHorizontal ? rect.height : rect.width) : (isHorizontal ? rect.height/2 : rect.width/2);
            
            ctx.beginPath();
            if (isHorizontal) {
                ctx.moveTo(screenPos, rect.height); ctx.lineTo(screenPos, rect.height - h);
            } else {
                ctx.moveTo(rect.width, screenPos); ctx.lineTo(rect.width - h, screenPos);
            }
            ctx.stroke();
            
            if (isBig && screenPos >= 0) {
                if (isHorizontal) ctx.fillText(value, screenPos, 10);
                else {
                    ctx.save(); ctx.translate(10, screenPos); ctx.rotate(-Math.PI/2);
                    ctx.fillText(value, 0, 0); ctx.restore();
                }
            }
        }
        ctx.restore();
    }
}
