export class Toolbar {
    constructor(toolBtns, onToolChange) {
        this.toolBtns = toolBtns;
        this.onToolChange = onToolChange;
        this.init();
    }

    init() {
        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (tool) {
                    this.updateActive(tool);
                    this.onToolChange(tool);
                } else {
                    // It's a momentary action btn, just trigger callbacks if needed
                    // (Though currently main.js handles these separately)
                    this.onToolChange(null, btn.id);
                }
            });
        });
    }

    updateActive(tool) {
        if (!tool) return;
        this.toolBtns.forEach(b => {
            if (b.dataset.tool) {
                if (b.dataset.tool === tool) b.classList.add('active');
                else b.classList.remove('active');
            }
        });
    }
}
