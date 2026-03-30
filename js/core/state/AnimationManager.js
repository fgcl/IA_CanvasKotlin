export class AnimationManager {
    constructor(state) {
        this.state = state;
        this.currentTime = 0;
        this.duration = 2000;
        this.isPlaying = false;
        this.isLooping = true;
        this.fps = 60;
    }

    setDuration(val) {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            this.duration = num;
        }
    }

    setCurrentTime(val) {
        if (val === undefined || val === null) return;
        const num = parseFloat(val);
        if (!isNaN(num)) {
            this.currentTime = Math.max(0, Math.min(this.duration || 2000, num));
        }
    }

    addKeyframe(shape, property, time, value) {
        if (!shape.keyframes) shape.keyframes = {};
        if (!shape.keyframes[property]) shape.keyframes[property] = [];
        
        const existingIdx = shape.keyframes[property].findIndex(kf => kf.time === time);
        if (existingIdx !== -1) {
            shape.keyframes[property][existingIdx].value = value;
        } else {
            shape.keyframes[property].push({ time, value, easing: 'linear' });
            shape.keyframes[property].sort((a, b) => a.time - b.time);
        }
    }

    removeKeyframe(shape, property, time) {
        if (!shape.keyframes || !shape.keyframes[property]) return;
        shape.keyframes[property] = shape.keyframes[property].filter(kf => kf.time !== time);
    }

    syncKeyframes(shape, properties, oldValues = {}) {
        if (!shape.keyframes) shape.keyframes = {};
        const epsilon = 0.05;
        
        properties.forEach(prop => {
            const hasKeyframing = shape.keyframes[prop] && shape.keyframes[prop].length > 0;
            const existingIdx = hasKeyframing ? 
                shape.keyframes[prop].findIndex(kf => Math.abs(kf.time - this.currentTime) < epsilon) : -1;

            if (existingIdx !== -1) {
                shape.keyframes[prop][existingIdx].value = shape[prop];
            } else if (this.currentTime > epsilon) {
                if (!hasKeyframing) {
                    // Use the old value for time 0 if provided, otherwise fallback to current
                    const baseValue = oldValues[prop] !== undefined ? oldValues[prop] : shape[prop];
                    this.addKeyframe(shape, prop, 0, baseValue);
                }
                this.addKeyframe(shape, prop, this.currentTime, shape[prop]);
            }
        });
    }
}
