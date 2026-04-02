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
        // Use a more realistic epsilon for UI interactions (50ms)
        const epsilon = 50; 
        
        properties.forEach(prop => {
            if (shape[prop] === undefined) return;

            const propKeyframes = shape.keyframes[prop] || [];
            const hasKeyframing = propKeyframes.length > 0;
            
            // Check if we are close to an existing keyframe
            const existingIdx = propKeyframes.findIndex(kf => Math.abs(kf.time - this.currentTime) < epsilon);

            if (existingIdx !== -1) {
                // Update existing keyframe value
                propKeyframes[existingIdx].value = shape[prop];
                // Optionally update the time to the current time for precise snapping
                propKeyframes[existingIdx].time = this.currentTime;
                propKeyframes.sort((a, b) => a.time - b.time);
            } else if (this.currentTime > epsilon || (this.currentTime <= epsilon && hasKeyframing)) {
                // If not at start, and no keyframe exists at current time, create one
                // But first, ensure there is a keyframe at time 0
                if (!hasKeyframing && this.currentTime > epsilon) {
                    const baseValue = oldValues[prop] !== undefined ? oldValues[prop] : shape[prop];
                    this.addKeyframe(shape, prop, 0, baseValue);
                }
                this.addKeyframe(shape, prop, this.currentTime, shape[prop]);
            }
        });
    }
}
