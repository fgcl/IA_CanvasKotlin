import { AnimationEngine } from '../core/AnimationEngine.js';

export class ContextToolbar {
    constructor(state, onAction, fillColorPicker, strokeColorPicker) {
        this.state = state;
        this.onAction = onAction; 
        this.fillColorPicker = fillColorPicker;
        this.strokeColorPicker = strokeColorPicker;
        this.quickColors = ['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6'];
        this.element = this.createToolbar();
        document.body.appendChild(this.element);
        this.visible = false;
    }

    createToolbar() {
        const div = document.createElement('div');
        div.className = 'floating-context-toolbar hidden';
        
        div.innerHTML = `
            <div class="toolbar-main-pill glass">
                <button class="tool-btn group-btn" title="Agrupar (Ctrl+G)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7h10v10H7z"/></svg>
                </button>
                <button class="tool-btn ungroup-btn" title="Desagrupar (Ctrl+Shift+G)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h10v10H7z"/><path d="M3 3l4 4"/><path d="M21 3l-4 4"/><path d="M3 21l4-4"/><path d="M21 21l-4-4"/></svg>
                </button>
                <div class="divider"></div>
                
                <!-- Color Triggers -->
                <button class="tool-btn menu-trigger-btn fill-trigger" title="Cor de Preenchimento">
                    <div class="color-preview-circle fill-preview"></div>
                </button>
                <button class="tool-btn menu-trigger-btn stroke-trigger" title="Cor do Traço">
                    <div class="color-preview-circle stroke-preview"></div>
                </button>
                
                <div class="divider"></div>
                <button class="tool-btn menu-trigger-btn stack-trigger" title="Organizar Stack">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 4v16M4 12h16"/></svg>
                </button>
                <button class="tool-btn menu-trigger-btn align-trigger" title="Alinhamento">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg>
                </button>
                <div class="divider"></div>
                <button class="tool-btn delete-btn" title="Excluir (Del)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>

            <!-- Fill Color Submenu -->
            <div class="context-submenu fill-menu hidden glass color-bar-menu">
                <div class="color-bar">
                    <button class="color-swatch-btn transparent-swatch" data-type="fill" data-color="transparent" title="Nenhum"></button>
                    ${this.quickColors.map(c => `
                        <button class="color-swatch-btn" data-type="fill" data-color="${c}" style="background-color: ${c}"></button>
                    `).join('')}
                    <button class="color-swatch-btn more-colors" data-type="fill" title="Mais cores">+</button>
                </div>
            </div>

            <!-- Stroke Color Submenu -->
            <div class="context-submenu stroke-menu hidden glass color-bar-menu">
                <div class="color-bar">
                    <button class="color-swatch-btn transparent-swatch" data-type="stroke" data-color="transparent" title="Nenhum"></button>
                    ${this.quickColors.map(c => `
                        <button class="color-swatch-btn" data-type="stroke" data-color="${c}" style="background-color: ${c}"></button>
                    `).join('')}
                    <button class="color-swatch-btn more-colors" data-type="stroke" title="Mais cores">+</button>
                </div>
            </div>

            <!-- Stack Submenu -->
            <div class="context-submenu stack-menu hidden glass">
                <button class="tool-btn layout-row-btn" title="Stack Horizontal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"/><path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/></svg>
                </button>
                <button class="tool-btn layout-col-btn" title="Stack Vertical">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/><path d="M8 8l4-4 4 4"/><path d="M8 16l4 4 4-4"/></svg>
                </button>
                <button class="tool-btn layout-none-btn" title="Remover Stack">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Alignment Submenu -->
            <div class="context-submenu align-menu hidden glass">
                <div class="submenu-group">
                    <button class="tool-btn align-btn" data-align="left" title="Esquerda">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
                    </button>
                    <button class="tool-btn align-btn" data-align="center" title="Centro (H)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12M8 6h8M8 18h8"/></svg>
                    </button>
                    <button class="tool-btn align-btn" data-align="right" title="Direita">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M10 12h10M4 18h16"/></svg>
                    </button>
                </div>
                <div class="submenu-divider"></div>
                <div class="submenu-group">
                    <button class="tool-btn align-btn" data-align="top" title="Topo">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M12 4v10M18 4v16"/></svg>
                    </button>
                    <button class="tool-btn align-btn" data-align="middle" title="Meio (V)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v12M6 8v8M18 8v8"/></svg>
                    </button>
                    <button class="tool-btn align-btn" data-align="bottom" title="Base">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M12 10v10M18 4v16"/></svg>
                    </button>
                </div>
            </div>
        `;

        // Main Actions
        div.querySelector('.group-btn').onclick = () => { this.state.groupSelected(); this.onAction(); };
        div.querySelector('.ungroup-btn').onclick = () => { this.state.ungroupSelected(); this.onAction(); };
        div.querySelector('.delete-btn').onclick = () => { this.state.deleteSelected(); this.onAction(); this.hide(); };

        // Submenu Triggers
        div.querySelector('.stack-trigger').onclick = (e) => this.toggleSubmenu('stack-menu', e);
        div.querySelector('.align-trigger').onclick = (e) => this.toggleSubmenu('align-menu', e);
        div.querySelector('.fill-trigger').onclick = (e) => this.toggleSubmenu('fill-menu', e);
        div.querySelector('.stroke-trigger').onclick = (e) => this.toggleSubmenu('stroke-menu', e);

        // Submenu Actions: Stack
        div.querySelector('.layout-row-btn').onclick = () => { this.updateLayout('row'); this.hideSubmenus(); };
        div.querySelector('.layout-col-btn').onclick = () => { this.updateLayout('column'); this.hideSubmenus(); };
        div.querySelector('.layout-none-btn').onclick = () => { this.updateLayout('none'); this.hideSubmenus(); };

        // Submenu Actions: Alignment
        div.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.align;
                this.state.alignShapes(type, this.state.canvasSize);
                this.onAction();
                this.hideSubmenus();
            };
        });

        // Submenu Actions: Colors
        div.querySelectorAll('.color-swatch-btn[data-color]').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                const color = btn.dataset.color;
                const isNone = color === 'transparent';
                
                this.state.saveState();
                this.state.selectedShapes.forEach(s => {
                    const animated = (s.keyframes && Object.keys(s.keyframes).length > 0) ? 
                        AnimationEngine.animateShape(s, this.state.currentTime) : s;

                    const prop = type === 'fill' ? 'fillColor' : 'strokeColor';
                    const useProp = type === 'fill' ? 'useFill' : 'useStroke';
                    const oldVal = animated[prop];
                    const oldUse = animated[useProp];

                    if (type === 'fill') {
                        s.fillColor = isNone ? 'transparent' : color;
                        s.useFill = !isNone;
                    } else {
                        s.strokeColor = isNone ? 'transparent' : color;
                        s.useStroke = !isNone;
                    }
                    this.state.syncKeyframes(s, [prop, useProp], { [prop]: oldVal, [useProp]: oldUse });
                });
                this.onAction();
                this.hideSubmenus();
            };
        });

        div.querySelectorAll('.more-colors').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                const picker = type === 'fill' ? this.fillColorPicker : this.strokeColorPicker;
                if (picker && this.state.selectedShapes.length > 0) {
                    const first = this.state.selectedShapes[0];
                    const currentColor = type === 'fill' ? 
                        (first.useFill === false ? 'transparent' : (first.fillColor || '#000000')) :
                        (first.useStroke === false ? 'transparent' : (first.strokeColor || '#000000'));
                    
                    picker.setColor(currentColor);
                    const rect = btn.getBoundingClientRect();
                    picker.openAt(rect);
                }
                this.hideSubmenus();
            };
        });

        return div;
    }

    toggleSubmenu(menuClass, event) {
        event.stopPropagation();
        const menu = this.element.querySelector(`.${menuClass}`);
        const isCurrentlyHidden = menu.classList.contains('hidden');
        
        this.hideSubmenus();
        
        if (isCurrentlyHidden) {
            menu.classList.remove('hidden');
            const triggerClass = menuClass.split('-')[0] + '-trigger';
            const trigger = this.element.querySelector(`.${triggerClass}`);
            if (trigger) trigger.classList.add('active');
        }
    }

    hideSubmenus() {
        this.element.querySelectorAll('.context-submenu').forEach(m => m.classList.add('hidden'));
        this.element.querySelectorAll('.menu-trigger-btn').forEach(b => b.classList.remove('active'));
    }

    updateLayout(type) {
        if (this.state.selectedShapes.length === 1 && this.state.selectedShapes[0].type === 'group') {
            const group = this.state.selectedShapes[0];
            group.layout = { ...(group.layout || {}), type: type };
            this.onAction();
        } else if (this.state.selectedShapes.length > 1) {
            this.state.groupSelected();
            if (this.state.selectedShapes.length === 1) {
                const group = this.state.selectedShapes[0];
                group.layout = { ...(group.layout || {}), type: type };
            }
            this.onAction();
        }
    }

    update(canvasElement) {
        const { selectedShapes } = this.state;
        if (selectedShapes.length === 0 || this.state.isDrawing || this.state.isBezierDrawing) {
            this.hide();
            return;
        }

        const bounds = this.state.getSelectionBounds();
        if (!bounds) {
            this.hide();
            return;
        }

        this.show();

        const tl = this.state.canvasToScreen(bounds.x + bounds.w / 2, bounds.y);
        const rect = canvasElement.getBoundingClientRect();
        
        const top = rect.top + tl.y;
        const left = rect.left + tl.x;

        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;

        const isGroup = selectedShapes.length === 1 && selectedShapes[0].type === 'group';
        this.element.querySelector('.ungroup-btn').style.display = isGroup ? 'flex' : 'none';
        
        const currentLayout = isGroup ? (selectedShapes[0].layout?.type || 'none') : 'none';
        this.element.querySelector('.layout-row-btn').classList.toggle('active', currentLayout === 'row');
        this.element.querySelector('.layout-col-btn').classList.toggle('active', currentLayout === 'column');
        
        // Update color previews
        const first = selectedShapes[0];
        const fillPreview = this.element.querySelector('.fill-preview');
        const strokePreview = this.element.querySelector('.stroke-preview');
        
        if (fillPreview) {
            if (first.useFill === false || first.fillColor === 'transparent') {
                fillPreview.style.backgroundColor = 'transparent';
                fillPreview.classList.add('transparent-preview');
            } else {
                fillPreview.style.backgroundColor = first.fillColor || '#000000';
                fillPreview.classList.remove('transparent-preview');
            }
        }
        
        if (strokePreview) {
            if (first.useStroke === false || first.strokeColor === 'transparent') {
                strokePreview.style.backgroundColor = 'transparent';
                strokePreview.classList.add('transparent-preview');
            } else {
                strokePreview.style.backgroundColor = first.strokeColor || '#000000';
                strokePreview.classList.remove('transparent-preview');
            }
        }
    }

    show() {
        if (!this.visible) {
            this.hideSubmenus();
            this.element.classList.remove('hidden');
            this.visible = true;
        }
    }

    hide() {
        if (this.visible) {
            this.hideSubmenus();
            this.element.classList.add('hidden');
            this.visible = false;
        }
    }
}
