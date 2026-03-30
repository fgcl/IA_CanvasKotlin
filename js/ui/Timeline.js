export class Timeline {
    constructor(elements, state, onRedraw) {
        this.el = elements;
        this.state = state;
        this.onRedraw = onRedraw;
        this.pixelsPerSecond = 200;
        this.lastTime = 0;
        this.selectedKeyframe = null; // { shape, prop, keyframe }
        this.isCollapsed = true;
        this.init();
    }

    init() {
        this.el.playPauseBtn.onclick = () => this.togglePlay();
        this.el.stopBtn.onclick = () => this.stop();
        this.el.durationInput.onchange = (e) => {
            const val = parseFloat(e.target.value.replace(',', '.'));
            if (!isNaN(val) && val > 0) {
                this.state.duration = val * 1000;
            } else {
                e.target.value = (this.state.duration / 1000).toFixed(1);
            }
            this.render();
        };
        this.el.loopBtn.onchange = (e) => this.state.isLooping = e.target.checked;
        this.el.addKfBtn.onclick = () => this.addKeyframeFromSelection();
        
        const toggleBtn = document.getElementById('toggle-timeline');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                this.isCollapsed = !this.isCollapsed;
                const panel = document.getElementById('timeline-panel');
                if (this.isCollapsed) {
                    panel.classList.add('collapsed');
                    document.documentElement.style.setProperty('--timeline-offset', '44px');
                } else {
                    panel.classList.remove('collapsed');
                    document.documentElement.style.setProperty('--timeline-offset', '180px');
                }
            };
        }

        // Scrubbing
        let isScrubbing = false;
        const handleScrub = (e) => {
            if (!isScrubbing) return;
            const rect = this.el.scrollContainer.getBoundingClientRect();
            const x = e.clientX - rect.left + this.el.scrollContainer.scrollLeft;
            const duration = isNaN(this.state.duration) ? 2000 : this.state.duration;
            let time = Math.max(0, Math.min(duration, (x / this.pixelsPerSecond) * 1000));
            
            if (isNaN(time)) time = 0;
            
            // Snap to nearest keyframe (within 10px / ~50ms)
            const snapThresholdMs = (10 / this.pixelsPerSecond) * 1000;
            let closestKfTime = null;
            let minDiff = snapThresholdMs;

            this.state.shapes.forEach(s => {
                if (s.keyframes) {
                    Object.values(s.keyframes).flat().forEach(kf => {
                        const diff = Math.abs(kf.time - time);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestKfTime = kf.time;
                        }
                    });
                }
            });

            if (closestKfTime !== null) time = closestKfTime;

            this.state.currentTime = time;
            this.updateCursor();
            this.onRedraw();
        };

        this.el.scrollContainer.addEventListener('mousedown', (e) => {
            if (e.target.closest('.timeline-ruler') || e.target === this.el.scrollContainer || e.target.classList.contains('timeline-track')) {
                this.selectedKeyframe = null; // Clear selection on background click
                isScrubbing = true;
                this.state.isPlaying = false;
                handleScrub(e);
                this.render(); // Update UI
            }
        });
        window.addEventListener('mousemove', handleScrub);
        window.addEventListener('mouseup', () => isScrubbing = false);

        // Animation Loop
        const loop = (now) => {
            if (this.state.isPlaying) {
                const delta = now - this.lastTime;
                this.state.currentTime += delta;
                
                if (this.state.currentTime >= this.state.duration) {
                    if (this.state.isLooping) this.state.currentTime = 0;
                    else {
                        this.state.currentTime = this.state.duration;
                        this.state.isPlaying = false;
                    }
                }
                this.updateCursor();
                this.onRedraw();
            }
            this.lastTime = now;
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    togglePlay() {
        this.state.isPlaying = !this.state.isPlaying;
        this.el.playPauseBtn.innerHTML = this.state.isPlaying ? 
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' :
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }

    stop() {
        this.state.isPlaying = false;
        this.state.currentTime = 0;
        this.updateCursor();
        this.onRedraw();
    }

    updateCursor() {
        const time = isNaN(this.state.currentTime) ? 0 : this.state.currentTime;
        const duration = isNaN(this.state.duration) ? 2000 : this.state.duration;
        
        const x = (time / 1000) * this.pixelsPerSecond;
        this.el.cursor.style.left = x + 'px';
        this.el.timeDisplay.textContent = (time / 1000).toFixed(2) + 's';
    }

    render() {
        const duration = this.state.duration / 1000;
        const totalWidth = duration * this.pixelsPerSecond;
        this.el.tracksContainer.style.width = totalWidth + 'px';
        this.el.ruler.style.width = totalWidth + 'px';

        // Render Ruler
        this.el.ruler.innerHTML = '';
        for (let i = 0; i <= duration; i += 0.5) {
            const tick = document.createElement('div');
            tick.className = 'ruler-tick';
            tick.style.left = (i * this.pixelsPerSecond) + 'px';
            if (i % 1 === 0) {
                tick.style.height = '8px';
                const time = document.createElement('span');
                time.className = 'ruler-time';
                time.textContent = i + 's';
                time.style.left = (i * this.pixelsPerSecond) + 'px';
                this.el.ruler.appendChild(time);
            }
            this.el.ruler.appendChild(tick);
        }

        // Render Tracks
        this.el.labelsContainer.innerHTML = '';
        this.el.tracksContainer.innerHTML = '';
        
        this.state.shapes.forEach(shape => {
            if (shape.parentId) return; // Only top-level for now
            
            const label = document.createElement('div');
            label.className = 'track-label';
            if (this.state.selectedShapes.includes(shape)) label.classList.add('selected');
            label.textContent = shape.name;
            this.el.labelsContainer.appendChild(label);

            const track = document.createElement('div');
            track.className = 'timeline-track';
            if (this.state.selectedShapes.includes(shape)) track.classList.add('selected');
            
            // Draw Keyframes
            if (shape.keyframes) {
                Object.keys(shape.keyframes).forEach(prop => {
                    shape.keyframes[prop].forEach(kf => {
                        const diamond = document.createElement('div');
                        diamond.className = 'keyframe';
                        if (this.selectedKeyframe && 
                            this.selectedKeyframe.shape === shape && 
                            this.selectedKeyframe.prop === prop && 
                            this.selectedKeyframe.keyframe === kf) {
                            diamond.classList.add('selected');
                        }
                        
                        diamond.style.left = (kf.time / 1000) * this.pixelsPerSecond + 'px';
                        diamond.title = `${prop}: ${kf.value}`;
                        diamond.onclick = (e) => {
                            e.stopPropagation();
                            this.selectedKeyframe = { shape, prop, keyframe: kf };
                            this.state.currentTime = kf.time;
                            this.updateCursor();
                            this.render(); // Re-render to show selection
                            this.onRedraw();
                        };
                        track.appendChild(diamond);
                    });
                });
            }
            this.el.tracksContainer.appendChild(track);
        });
        this.updateCursor();
    }

    addKeyframeFromSelection() {
        if (this.state.selectedShapes.length === 0) return;
        this.state.selectedShapes.forEach(shape => {
            // Add keyframes for current position/size
            this.state.addKeyframe(shape, 'x', this.state.currentTime, shape.x);
            this.state.addKeyframe(shape, 'y', this.state.currentTime, shape.y);
            if (shape.width) this.state.addKeyframe(shape, 'width', this.state.currentTime, shape.width);
            if (shape.height) this.state.addKeyframe(shape, 'height', this.state.currentTime, shape.height);
            this.state.addKeyframe(shape, 'fillColor', this.state.currentTime, shape.fillColor);
            this.state.addKeyframe(shape, 'opacity', this.state.currentTime, shape.opacity);
        });
        this.render();
    }

    deleteSelectedKeyframe() {
        if (!this.selectedKeyframe) return;
        const { shape, prop, keyframe } = this.selectedKeyframe;
        if (shape.keyframes && shape.keyframes[prop]) {
            const idx = shape.keyframes[prop].indexOf(keyframe);
            if (idx !== -1) {
                shape.keyframes[prop].splice(idx, 1);
                // If no more keyframes for this property, clean up
                if (shape.keyframes[prop].length === 0) {
                    delete shape.keyframes[prop];
                }
                this.selectedKeyframe = null;
                this.render();
                this.onRedraw();
                return true;
            }
        }
        return false;
    }
}
