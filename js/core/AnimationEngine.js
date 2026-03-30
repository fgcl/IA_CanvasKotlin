export class AnimationEngine {
    static getInterpolatedValue(keyframes, time) {
        if (!keyframes || keyframes.length === 0) return null;
        
        // Find the boundary keyframes
        let prev = null;
        let next = null;

        for (let i = 0; i < keyframes.length; i++) {
            if (keyframes[i].time <= time) {
                prev = keyframes[i];
            } else {
                next = keyframes[i];
                break;
            }
        }

        if (!prev) return next.value;
        if (!next) return prev.value;

        const range = next.time - prev.time;
        const progress = (time - prev.time) / range;
        
        // Apply Easing (Simple Linear for now, can expand later)
        const t = progress; 

        if (typeof prev.value === 'number') {
            return prev.value + (next.value - prev.value) * t;
        } else if (typeof prev.value === 'string' && prev.value.startsWith('#')) {
            return this.interpolateColor(prev.value, next.value, t);
        }

        return prev.value;
    }

    static interpolateColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    static hexToRgb(hex) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
            return { r: 0, g: 0, b: 0 };
        }
        
        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16) || 0;
            g = parseInt(hex.slice(3, 5), 16) || 0;
            b = parseInt(hex.slice(5, 7), 16) || 0;
        }
        return { r, g, b };
    }

    static animateShape(shape, time) {
        if (!shape.keyframes) return shape;

        // Create a temporary object with interpolated values
        const animatedProperties = {};
        for (const prop in shape.keyframes) {
            const val = this.getInterpolatedValue(shape.keyframes[prop], time);
            if (val !== null) {
                animatedProperties[prop] = val;
            }
        }

        // Return a proxy or a merged object for the renderer
        return { ...shape, ...animatedProperties };
    }
}
