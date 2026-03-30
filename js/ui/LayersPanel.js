export class LayersPanel {
    constructor(containerId, state, onUpdate) {
        this.container = document.getElementById(containerId);
        this.state = state;
        this.onUpdate = onUpdate;
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
    }

    render() {
        if (!this.container) return;
        const { shapes } = this.state;
        
        // Render top-level shapes (which contain children)
        const layersHtml = [...shapes].reverse().map(shape => this.renderLayer(shape, 0)).join('');
        
        this.container.innerHTML = `
            <div class="layers-list">
                ${shapes.length === 0 ? '<div class="layers-empty">Nenhuma camada</div>' : ''}
                ${layersHtml}
            </div>
        `;

        this.attachEvents();
    }

    renderLayer(shape, depth) {
        const { selectedShapes } = this.state;
        const isSelected = selectedShapes.includes(shape);
        const indent = depth * 16;
        
        let html = `
            <div class="layer-item ${isSelected ? 'active' : ''} ${shape.locked ? 'locked' : ''} ${!shape.visible ? 'hidden-layer' : ''}" 
                 data-id="${shape.id}" style="padding-left: ${indent + 8}px">
                <div class="layer-info">
                    <span class="layer-icon">${this.getIcon(shape.type)}</span>
                    <span class="layer-name" contenteditable="false">${shape.name}</span>
                </div>
                <div class="layer-actions">
                    <button class="layer-btn visibility-btn" title="Ocultar/Mostrar">
                        ${shape.visible ? this.getEyeIcon('open') : this.getEyeIcon('closed')}
                    </button>
                    <button class="layer-btn lock-btn" title="Bloquear/Desbloquear">
                        ${shape.locked ? this.getLockIcon('locked') : this.getLockIcon('unlocked')}
                    </button>
                    ${depth === 0 ? `
                    <button class="layer-btn move-up-btn" title="Trazer para frente">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button class="layer-btn move-down-btn" title="Enviar para trás">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        if (shape.children && shape.children.length > 0) {
            html += [...shape.children].reverse().map(child => this.renderLayer(child, depth + 1)).join('');
        }

        return html;
    }

    attachEvents() {
        const items = this.container.querySelectorAll('.layer-item');
        items.forEach(item => {
            const id = item.dataset.id;
            
            // Search shape recursively
            const findShapeRecursive = (list) => {
                for (const s of list) {
                    if (s.id === id) return s;
                    if (s.children) {
                        const found = findShapeRecursive(s.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const shape = findShapeRecursive(this.state.shapes);
            if (!shape) return;

            // Select
            item.addEventListener('click', (e) => {
                if (e.target.closest('.layer-btn')) return;
                this.state.selectedShapes = [shape];
                this.onUpdate();
            });

            // Visibility
            item.querySelector('.visibility-btn').addEventListener('click', () => {
                this.state.toggleVisibility(shape);
                this.onUpdate();
            });

            // Lock
            item.querySelector('.lock-btn').addEventListener('click', () => {
                this.state.toggleLock(shape);
                this.onUpdate();
            });

            // Move Up
            const moveUpBtn = item.querySelector('.move-up-btn');
            if (moveUpBtn) {
                moveUpBtn.addEventListener('click', () => {
                    this.state.reorderShape(shape, 'up');
                    this.onUpdate();
                });
            }

            // Move Down
            const moveDownBtn = item.querySelector('.move-down-btn');
            if (moveDownBtn) {
                moveDownBtn.addEventListener('click', () => {
                    this.state.reorderShape(shape, 'down');
                    this.onUpdate();
                });
            }

            // Rename
            const nameEl = item.querySelector('.layer-name');
            nameEl.addEventListener('dblclick', () => {
                nameEl.contentEditable = true;
                nameEl.focus();
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(nameEl);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });

            nameEl.addEventListener('blur', () => {
                nameEl.contentEditable = false;
                this.state.renameShape(shape, nameEl.textContent);
                this.onUpdate();
            });

            nameEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nameEl.blur();
                }
            });
        });
    }

    getIcon(type) {
        switch(type) {
            case 'rect': return '⬜';
            case 'circle': return '⚪';
            case 'line': return '╱';
            case 'pencil': return '✏️';
            case 'bezier': return '🖋️';
            case 'group': return '📦';
            case 'text': return 'Text';
            case 'icon': return '🖼️';
            default: return '📄';
        }
    }

    getEyeIcon(state) {
        if (state === 'open') {
            return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    }

    getLockIcon(state) {
        if (state === 'locked') {
            return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        }
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
    }
}
