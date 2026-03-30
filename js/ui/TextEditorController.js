export class TextEditorController {
    constructor() {
        this.input = null;
        this.activeShape = null;
    }

    show(shape, canvas, state, onCommit, onCancel) {
        if (this.input) this.remove();

        this.activeShape = shape;
        const rect = canvas.getBoundingClientRect();
        
        // Convert canvas coordinates to screen coordinates
        const screenPos = state.canvasToScreen(shape.x, shape.y);

        this.input = document.createElement('textarea');
        this.input.value = shape.text || '';
        this.input.className = 'inline-text-editor';
        
        // Styling matches the shape as much as possible
        const zoom = state.zoom;
        Object.assign(this.input.style, {
            position: 'absolute',
            left: (rect.left + screenPos.x) + 'px',
            top: (rect.top + screenPos.y) + 'px',
            fontSize: (shape.fontSize * zoom) + 'px',
            color: shape.fillColor,
            fontFamily: 'Inter, sans-serif',
            background: 'transparent',
            border: '1px solid #58a6ff',
            outline: 'none',
            padding: '0',
            margin: '0',
            resize: 'none',
            overflow: 'hidden',
            zIndex: '2000',
            minWidth: '100px',
            lineHeight: '1',
            transform: 'translateY(-2px)'
        });

        document.body.appendChild(this.input);
        this.input.focus();
        this.input.select();

        // Auto-resize
        const autoResize = () => {
            this.input.style.width = 'auto';
            this.input.style.width = Math.max(100, this.input.scrollWidth + 10) + 'px';
            this.input.style.height = 'auto';
            this.input.style.height = this.input.scrollHeight + 'px';
        };
        this.input.addEventListener('input', autoResize);
        autoResize();

        const commit = () => {
            if (!this.input) return;
            const newText = this.input.value;
            this.remove();
            onCommit(newText);
        };

        const cancel = () => {
            this.remove();
            if (onCancel) onCancel();
        };

        this.input.addEventListener('blur', commit);
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
            }
            if (e.key === 'Escape') {
                cancel();
            }
        });
    }

    remove() {
        if (this.input && this.input.parentNode) {
            this.input.parentNode.removeChild(this.input);
        }
        this.input = null;
        this.activeShape = null;
    }

    isActive() {
        return this.input !== null;
    }
}
