export class AnimationEngine {
    static getInterpolatedValue(keyframes, time, easingType = 'easeInOut') {
        if (!keyframes || keyframes.length === 0) return null;
        
        // Ensure keyframes are sorted by time for safety
        const sortedKFs = [...keyframes].sort((a, b) => a.time - b.time);
        
        // Find the boundary keyframes
        let prev = null;
        let next = null;

        for (let i = 0; i < sortedKFs.length; i++) {
            if (sortedKFs[i].time <= time) {
                prev = sortedKFs[i];
            } else {
                next = sortedKFs[i];
                break;
            }
        }

        if (!prev) return next.value;
        if (!next) return prev.value;

        const range = next.time - prev.time;
        if (range === 0) return prev.value;
        
        let progress = (time - prev.time) / range;
        progress = Math.max(0, Math.min(1, progress));
        
        // Apply Easing
        let t = progress; 
        const easing = easingType || (prev && prev.easing) || 'easeInOut';

        if (easing === 'easeInOut') {
            t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        } else if (easing === 'linear') {
            t = progress;
        }

        if (typeof prev.value === 'number') {
            const nextVal = typeof next.value === 'number' ? next.value : parseFloat(next.value) || 0;
            return prev.value + (nextVal - prev.value) * t;
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
        
        const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    static hexToRgb(hex) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
            return { r: 0, g: 0, b: 0 };
        }
        
        const h = hex.trim();
        let r, g, b;
        if (h.length === 4) {
            r = parseInt(h[1] + h[1], 16) || 0;
            g = parseInt(h[2] + h[2], 16) || 0;
            b = parseInt(h[3] + h[3], 16) || 0;
        } else if (h.length === 7) {
            r = parseInt(h.slice(1, 3), 16) || 0;
            g = parseInt(h.slice(3, 5), 16) || 0;
            b = parseInt(h.slice(5, 7), 16) || 0;
        } else {
            return { r: 0, g: 0, b: 0 };
        }
        return { r, g, b };
    }

    static animateShape(shape, time) {
        if (!shape.keyframes) return shape;

        // Create a temporary object with interpolated values
        const animatedProperties = {};
        for (const prop in shape.keyframes) {
            const kfs = shape.keyframes[prop];
            if (!kfs || kfs.length === 0) continue;
            
            // Determine easing from the current segment's start keyframe or default
            const val = this.getInterpolatedValue(kfs, time);
            if (val !== null) {
                animatedProperties[prop] = val;
            }
        }

        // Return a proxy or a merged object for the renderer
        return { ...shape, ...animatedProperties };
    }
}
