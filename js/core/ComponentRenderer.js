export class ComponentRenderer {
    static draw(shape, ctx) {
        const { x, y, width, height, type, text, cornerRadius, fillColor, strokeColor, strokeWidth, checked, value } = shape;
        
        ctx.save();
        if (type === 'button') {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, cornerRadius || 8);
            ctx.fillStyle = fillColor || '#4f46e5';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = `600 ${Math.min(height * 0.35, 14)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text || 'Button', x + width / 2, y + height / 2);
        } else if (type === 'input') {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, cornerRadius || 8);
            ctx.fillStyle = '#f8fafc';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.min(height * 0.3, 13)}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text || 'Hint...', x + 16, y + height / 2);
        } else if (type === 'checkbox') {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 4);
            ctx.fillStyle = checked ? '#4f46e5' : '#fff';
            ctx.fill();
            ctx.strokeStyle = checked ? '#4f46e5' : '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (checked) {
                ctx.strokeStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(x + 6, y + 12); ctx.lineTo(x + 10, y + 16); ctx.lineTo(x + 18, y + 8);
                ctx.stroke();
            }
        } else if (type === 'switch') {
            const r = height / 2;
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, r);
            ctx.fillStyle = checked ? '#4f46e5' : '#cbd5e1';
            ctx.fill();
            ctx.beginPath();
            const thumbX = checked ? x + width - r : x + r;
            ctx.arc(thumbX, y + r, r - 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        } else if (type === 'slider') {
            ctx.beginPath();
            ctx.roundRect(x, y + height / 2 - 2, width, 4, 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.fill();
            const progress = (value || 50) / 100;
            ctx.beginPath();
            ctx.roundRect(x, y + height / 2 - 2, width * progress, 4, 2);
            ctx.fillStyle = '#4f46e5';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + width * progress, y + height / 2, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 2; ctx.stroke();
        } else if (type === 'progress') {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, height / 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.fill();
            const progress = (value || 40) / 100;
            ctx.beginPath();
            ctx.roundRect(x, y, width * progress, height, height / 2);
            ctx.fillStyle = '#4f46e5';
            ctx.fill();
        }
        ctx.restore();
    }
}
