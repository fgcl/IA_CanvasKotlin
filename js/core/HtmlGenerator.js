import { IconLibrary } from './IconLibrary.js';

export class HtmlGenerator {
    static hexToRgba(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    static generate(shapes, canvasSize) {
        const { width, height } = canvasSize;
        let cssRules = "";
        let bodyHtml = "";

        shapes.forEach((shape, index) => {
            if (!shape.visible) return;

            const id = `shape-${index}`;
            const color = this.hexToRgba(shape.fillColor, shape.opacity);
            const strokeColor = this.hexToRgba(shape.strokeColor, shape.opacity);
            const sw = shape.strokeWidth || 0;

            let shapeCss = `        #${id} {\n`;

            if (shape.type === 'rect') {
                const r = shape.cornerRadius || 0;
                shapeCss += `            left: ${shape.x.toFixed(1)}px;\n`;
                shapeCss += `            top: ${shape.y.toFixed(1)}px;\n`;
                shapeCss += `            width: ${shape.width.toFixed(1)}px;\n`;
                shapeCss += `            height: ${shape.height.toFixed(1)}px;\n`;
                if (shape.useFill !== false) shapeCss += `            background-color: ${color};\n`;
                if (shape.useStroke !== false && sw > 0) shapeCss += `            border: ${sw}px solid ${strokeColor};\n`;
                if (r > 0) shapeCss += `            border-radius: ${r}px;\n`;
                bodyHtml += `        <!-- Retângulo -->\n        <div id="${id}" class="shape"></div>\n`;

            } else if (shape.type === 'circle') {
                const radius = Math.sqrt(shape.width**2 + shape.height**2);
                shapeCss += `            left: ${(shape.x - radius).toFixed(1)}px;\n`;
                shapeCss += `            top: ${(shape.y - radius).toFixed(1)}px;\n`;
                shapeCss += `            width: ${(radius * 2).toFixed(1)}px;\n`;
                shapeCss += `            height: ${(radius * 2).toFixed(1)}px;\n`;
                shapeCss += `            border-radius: 50%;\n`;
                if (shape.useFill !== false) shapeCss += `            background-color: ${color};\n`;
                if (shape.useStroke !== false && sw > 0) shapeCss += `            border: ${sw}px solid ${strokeColor};\n`;
                bodyHtml += `        <!-- Círculo -->\n        <div id="${id}" class="shape"></div>\n`;

            } else if (shape.type === 'icon') {
                const iconPath = IconLibrary[shape.iconName] || IconLibrary['Favorite'];
                const size = shape.width || 24;
                shapeCss += `            left: ${shape.x.toFixed(1)}px;\n`;
                shapeCss += `            top: ${shape.y.toFixed(1)}px;\n`;
                shapeCss += `            fill: ${color};\n`;
                bodyHtml += `        <!-- Ícone: ${shape.iconName} -->\n`;
                bodyHtml += `        <svg id="${id}" class="shape svg-shape" width="${size}" height="${size}" viewBox="0 0 24 24">\n`;
                bodyHtml += `            <path d="${iconPath}" />\n`;
                bodyHtml += `        </svg>\n`;

            } else if (shape.type === 'text') {
                shapeCss += `            left: ${shape.x.toFixed(1)}px;\n`;
                shapeCss += `            top: ${shape.y.toFixed(1)}px;\n`;
                shapeCss += `            color: ${color};\n`;
                shapeCss += `            font-size: ${shape.fontSize || 16}px;\n`;
                shapeCss += `            white-space: nowrap;\n`;
                bodyHtml += `        <!-- Texto -->\n        <div id="${id}" class="shape">${shape.text || ''}</div>\n`;

            } else if (shape.type === 'line' || shape.type === 'pencil' || shape.type === 'bezier') {
                const xs = (shape.type === 'line') ? [shape.x, shape.endX] : shape.points.map(p => p.x);
                const ys = (shape.type === 'line') ? [shape.y, shape.endY] : shape.points.map(p => p.y);
                const minX = Math.min(...xs) - sw;
                const minY = Math.min(...ys) - sw;
                const maxX = Math.max(...xs) + sw;
                const maxY = Math.max(...ys) + sw;

                shapeCss += `            left: ${minX.toFixed(1)}px;\n`;
                shapeCss += `            top: ${minY.toFixed(1)}px;\n`;
                
                let svgContent = "";
                if (shape.type === 'line') {
                    svgContent = `<line x1="${shape.x - minX}" y1="${shape.y - minY}" x2="${shape.endX - minX}" y2="${shape.endY - minY}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" />`;
                } else {
                    let d = `M ${shape.points[0].x - minX} ${shape.points[0].y - minY} `;
                    if (shape.type === 'pencil') {
                        for (let i = 1; i < shape.points.length; i++) {
                            d += `L ${shape.points[i].x - minX} ${shape.points[i].y - minY} `;
                        }
                    } else {
                        for (let i = 1; i < shape.points.length; i++) {
                            const p = shape.points[i]; const prev = shape.points[i-1];
                            d += `C ${prev.cp2x - minX} ${prev.cp2y - minY}, ${p.cp1x - minX} ${p.cp1y - minY}, ${p.x - minX} ${p.y - minY} `;
                        }
                        const firstP = shape.points[0]; const lastP = shape.points[shape.points.length - 1];
                        d += `C ${lastP.cp2x - minX} ${lastP.cp2y - minY}, ${firstP.cp1x - minX} ${firstP.cp1y - minY}, ${firstP.x - minX} ${firstP.y - minY} Z`;
                    }
                    svgContent = `<path d="${d}" fill="${shape.useFill !== false ? color : 'none'}" stroke="${shape.useStroke !== false ? strokeColor : 'none'}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" />`;
                }
                bodyHtml += `        <!-- ${shape.type} -->\n`;
                bodyHtml += `        <svg id="${id}" class="shape svg-shape" width="${maxX - minX}" height="${maxY - minY}">\n            ${svgContent}\n        </svg>\n`;
            } else if (['button', 'input', 'checkbox', 'switch', 'slider', 'progress'].includes(shape.type)) {
                shapeCss += `            left: ${shape.x.toFixed(1)}px;\n`;
                shapeCss += `            top: ${shape.y.toFixed(1)}px;\n`;
                shapeCss += `            width: ${shape.width.toFixed(1)}px;\n`;
                shapeCss += `            height: ${shape.height.toFixed(1)}px;\n`;
                
                if (shape.type === 'button') {
                    shapeCss += `            background-color: ${color};\n`;
                    shapeCss += `            color: white;\n`;
                    shapeCss += `            border: none;\n`;
                    shapeCss += `            border-radius: ${shape.cornerRadius || 8}px;\n`;
                    shapeCss += `            cursor: pointer;\n`;
                    bodyHtml += `        <button id="${id}" class="shape">${shape.text || 'Button'}</button>\n`;
                } else if (shape.type === 'input') {
                    shapeCss += `            border: 1px solid #cbd5e1;\n`;
                    shapeCss += `            border-radius: ${shape.cornerRadius || 8}px;\n`;
                    shapeCss += `            padding: 0 12px;\n`;
                    bodyHtml += `        <input id="${id}" class="shape" type="text" placeholder="${shape.text || 'Hint...'}">\n`;
                } else if (shape.type === 'checkbox') {
                    bodyHtml += `        <input id="${id}" class="shape" type="checkbox" ${shape.checked ? 'checked' : ''}>\n`;
                } else if (shape.type === 'switch') {
                    // Simple switch via custom div or checkbox (using checkbox for simplicity here)
                    bodyHtml += `        <input id="${id}" class="shape" type="checkbox" role="switch" ${shape.checked ? 'checked' : ''}>\n`;
                } else if (shape.type === 'slider') {
                    bodyHtml += `        <input id="${id}" class="shape" type="range" value="${shape.value || 50}">\n`;
                } else if (shape.type === 'progress') {
                    bodyHtml += `        <progress id="${id}" class="shape" max="100" value="${shape.value || 40}"></progress>\n`;
                }
            }

            shapeCss += `        }\n`;
            cssRules += shapeCss;
        });

        let html = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n`;
        html += `    <meta charset="UTF-8">\n    <title>Canvas Export</title>\n    <style>\n`;
        html += `        :root {\n            --canvas-width: ${width}px;\n            --canvas-height: ${height}px;\n        }\n`;
        html += `        body {\n            margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; font-family: 'Inter', sans-serif;\n        }\n`;
        html += `        .canvas-container {\n            position: relative; width: var(--canvas-width); height: var(--canvas-height); background-color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; border-radius: 8px;\n        }\n`;
        html += `        .shape { position: absolute; box-sizing: border-box; pointer-events: none; }\n`;
        html += `        .svg-shape { overflow: visible; }\n`;
        html += cssRules;
        html += `    </style>\n</head>\n<body>\n`;
        html += `    <div class="canvas-container">\n`;
        html += bodyHtml;
        html += `    </div>\n`;
        html += this.generateAnimationScript(shapes);
        html += `</body>\n</html>`;
        
        return html;
    }

    static generateAnimationScript(shapes) {
        const animData = shapes.map((s, i) => ({
            id: `shape-${i}`,
            keyframes: s.keyframes || {}
        })).filter(s => Object.keys(s.keyframes).length > 0);

        if (animData.length === 0) return "";

        return `
    <script>
        const animData = ${JSON.stringify(animData)};
        const duration = 2000;
        let startTime = performance.now();

        function lerp(a, b, t) { return a + (b - a) * t; }
        
        function hexToRgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        }

        function interpolateColor(c1, c2, t) {
            const rgb1 = hexToRgb(c1);
            const rgb2 = hexToRgb(c2);
            const r = Math.round(lerp(rgb1.r, rgb2.r, t));
            const g = Math.round(lerp(rgb1.g, rgb2.g, t));
            const b = Math.round(lerp(rgb1.b, rgb2.b, t));
            return \`rgb(\${r},\${g},\${b})\`;
        }

        function getVal(kfs, time) {
            let prev = null, next = null;
            for (let kf of kfs) {
                if (kf.time <= time) prev = kf;
                else { next = kf; break; }
            }
            if (!prev) return next.value;
            if (!next) return prev.value;
            const t = (time - prev.time) / (next.time - prev.time);
            if (typeof prev.value === 'number') return lerp(prev.value, next.value, t);
            if (typeof prev.value === 'string' && prev.value.startsWith('#')) return interpolateColor(prev.value, next.value, t);
            return prev.value;
        }

        function render() {
            const now = performance.now();
            const time = (now - startTime) % duration;
            
            animData.forEach(data => {
                const el = document.getElementById(data.id);
                if (!el) return;
                
                for (const prop in data.keyframes) {
                    const val = getVal(data.keyframes[prop], time);
                    if (prop === 'x') el.style.left = val + 'px';
                    else if (prop === 'y') el.style.top = val + 'px';
                    else if (prop === 'width') el.style.width = val + 'px';
                    else if (prop === 'height') el.style.height = val + 'px';
                    else if (prop === 'opacity') el.style.opacity = val;
                    else if (prop === 'fillColor') {
                        if (el.tagName === 'svg') el.style.fill = val;
                        else el.style.backgroundColor = val;
                    }
                }
            });
            requestAnimationFrame(render);
        }
        render();
    </script>\n`;
    }
}
