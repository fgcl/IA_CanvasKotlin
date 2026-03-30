export class Toolbar {
    constructor(toolBtns, onToolChange) {
        this.toolBtns = toolBtns;
        this.onToolChange = onToolChange;
        this.init();
    }

    init() {
        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.updateActive(btn.dataset.tool);
                this.onToolChange(btn.dataset.tool);
            });
        });
    }

    updateActive(tool) {
        this.toolBtns.forEach(b => {
            if (b.dataset.tool === tool) b.classList.add('active');
            else b.classList.remove('active');
        });
    }
}
