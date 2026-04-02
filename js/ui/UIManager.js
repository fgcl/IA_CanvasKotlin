import { LayoutEngine } from '../core/LayoutEngine.js';

export class UIManager {
    constructor(ctx) {
        this.state = ctx.state;
        this.canvas = ctx.canvas;
        this.renderer = ctx.renderer;
        this.timeline = ctx.timeline;
        this.updateCode = ctx.updateCode;
        this.redraw = ctx.redraw;

        this.init();
    }

    init() {
        this.bindSidebars();
        this.bindCanvasSettings();
        this.bindGridSettings();
        this.bindZoomAndToolbar();
        this.bindGlobalKeys();
        this.updateSidebarVisibility();
    }

    updateSidebarWidthVar() {
        const rightSidebar = document.getElementById('right-sidebar');
        if (!rightSidebar) return;
        const isCollapsed = rightSidebar.classList.contains('collapsed');
        const width = isCollapsed ? 0 : rightSidebar.offsetWidth;
        document.documentElement.style.setProperty('--right-sidebar-width', width + 'px');
    }

    resizeCanvas(isInitial = false) {
        const container = document.querySelector('.canvas-container');
        if (!container) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = container.clientHeight * dpr;
        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = container.clientHeight + 'px';
        
        if (isInitial) {
            this.state.zoom = 0.8;
            this.state.panX = (container.clientWidth - this.state.canvasSize.width * this.state.zoom) / 2;
            this.state.panY = (container.clientHeight - this.state.canvasSize.height * this.state.zoom) / 2;
        }
        this.redraw();
    }

    updateSidebarVisibility() {
        const leftSidebar = document.getElementById('left-sidebar');
        if (!leftSidebar) return;
        
        const hasSelection = this.state.selectedShapes && this.state.selectedShapes.length > 0;
        if (hasSelection) {
            leftSidebar.classList.remove('hidden');
        } else {
            leftSidebar.classList.add('hidden');
        }
    }

    updateZoomUI() {
        const zoomLevelEl = document.getElementById('zoom-level');
        if (zoomLevelEl) zoomLevelEl.textContent = Math.round(this.state.zoom * 100) + '%';
    }

    bindSidebars() {
        const leftSidebar = document.getElementById('left-sidebar');
        const rightSidebar = document.getElementById('right-sidebar');
        const toggleLeftBtn = document.getElementById('toggle-left-sidebar');
        const toggleRightBtn = document.getElementById('toggle-right-sidebar');
        const leftPullBtn = document.getElementById('left-sidebar-pull');
        const rightPullBtn = document.getElementById('right-sidebar-pull');
        const resizer = document.getElementById('sidebar-resizer');

        /* Left sidebar toggle is now automatic based on selection */

        if (toggleRightBtn) toggleRightBtn.addEventListener('click', () => {
            rightSidebar.classList.toggle('collapsed');
            rightPullBtn.style.display = rightSidebar.classList.contains('collapsed') ? 'flex' : 'none';
            this.updateSidebarWidthVar();
            setTimeout(() => this.resizeCanvas(), 300);
        });

        /* Left pull button logic removed as it's now select-driven */

        if (rightPullBtn) rightPullBtn.addEventListener('click', () => {
            rightSidebar.classList.remove('collapsed'); rightPullBtn.style.display = 'none';
            this.updateSidebarWidthVar();
            setTimeout(() => this.resizeCanvas(), 300);
        });

        let isResizing = false;
        if (resizer) {
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                resizer.classList.add('dragging');
                rightSidebar.classList.add('no-transition');
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const offsetRight = document.body.clientWidth - e.clientX;
                const minWidth = 250;
                const maxWidth = 1000;
                if (offsetRight >= minWidth && offsetRight <= maxWidth) {
                    rightSidebar.style.width = offsetRight + 'px';
                    this.updateSidebarWidthVar();
                    this.resizeCanvas();
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = 'default';
                    resizer.classList.remove('dragging');
                    rightSidebar.classList.remove('no-transition');
                }
            });
        }
    }

    bindCanvasSettings() {
        const settingsToggle = document.getElementById('canvas-settings-toggle');
        const settingsPopup = document.getElementById('canvas-settings-popup');
        const canvasWidthInput = document.getElementById('canvas-width');
        const canvasHeightInput = document.getElementById('canvas-height');
        const canvasPresets = document.getElementById('canvas-presets');
        const responsiveCodeToggle = document.getElementById('responsive-code');

        if (settingsToggle) settingsToggle.addEventListener('click', (e) => {
            const isOpen = settingsPopup.classList.toggle('hidden');
            settingsToggle.classList.toggle('active', !isOpen);
            e.stopPropagation();
        });

        document.addEventListener('click', (e) => {
            if (settingsPopup && !settingsPopup.contains(e.target) && e.target !== settingsToggle && !settingsToggle.contains(e.target)) {
                settingsPopup.classList.add('hidden');
                settingsToggle.classList.remove('active');
            }
        });

        if (canvasWidthInput) canvasWidthInput.addEventListener('change', () => {
            const oldW = this.state.canvasSize.width;
            this.state.canvasSize.width = parseInt(canvasWidthInput.value);
            this.state.canvasSize.isFixed = true; canvasPresets.value = 'custom';
            LayoutEngine.applyCanvasConstraints(this.state, oldW, this.state.canvasSize.height);
            this.resizeCanvas(); this.updateCode();
        });

        if (canvasHeightInput) canvasHeightInput.addEventListener('change', () => {
            const oldH = this.state.canvasSize.height;
            this.state.canvasSize.height = parseInt(canvasHeightInput.value);
            this.state.canvasSize.isFixed = true; canvasPresets.value = 'custom';
            LayoutEngine.applyCanvasConstraints(this.state, this.state.canvasSize.width, oldH);
            this.resizeCanvas(); this.updateCode();
        });

        if (canvasPresets) canvasPresets.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'custom') this.state.canvasSize.isFixed = false;
            else {
                this.state.canvasSize.isFixed = true;
                const dims = { mobile: [390, 844], tablet: [820, 1180], desktop: [1440, 900], square: [1080, 1080] };
                if (dims[val]) { 
                    const oldW = this.state.canvasSize.width;
                    const oldH = this.state.canvasSize.height;
                    [this.state.canvasSize.width, this.state.canvasSize.height] = dims[val]; 
                    LayoutEngine.applyCanvasConstraints(this.state, oldW, oldH);
                }
                canvasWidthInput.value = this.state.canvasSize.width;
                canvasHeightInput.value = this.state.canvasSize.height;
            }
            this.resizeCanvas(); this.updateCode();
        });

        if (responsiveCodeToggle) responsiveCodeToggle.addEventListener('change', (e) => {
            this.state.codeMode = e.target.checked ? 'responsive' : 'absolute';
            this.updateCode();
        });
    }

    bindGridSettings() {
        const gridSettingsToggle = document.getElementById('grid-settings-toggle');
        const gridSettingsPopup = document.getElementById('grid-settings-popup');
        
        if (gridSettingsToggle && gridSettingsPopup) {
            gridSettingsToggle.addEventListener('click', (e) => {
                gridSettingsPopup.classList.toggle('hidden');
                gridSettingsToggle.classList.toggle('active');
                e.stopPropagation();
            });
            gridSettingsPopup.addEventListener('click', (e) => e.stopPropagation());
            
            document.addEventListener('click', (e) => {
                if (gridSettingsPopup && !gridSettingsPopup.contains(e.target) && e.target !== gridSettingsToggle && !gridSettingsToggle.contains(e.target)) {
                    gridSettingsPopup.classList.add('hidden');
                    gridSettingsToggle.classList.remove('active');
                }
            });
        }

        const gridType = document.getElementById('grid-type');
        const gridSize = document.getElementById('grid-size');
        const gridOpacity = document.getElementById('grid-opacity');
        const snapToGrid = document.getElementById('snap-to-grid');

        if (gridType) gridType.addEventListener('change', (e) => { this.state.gridType = e.target.value; this.redraw(); });
        if (gridSize) gridSize.addEventListener('input', (e) => { this.state.gridSize = parseInt(e.target.value) || 25; this.redraw(); });
        if (gridOpacity) gridOpacity.addEventListener('input', (e) => { this.state.gridOpacity = parseInt(e.target.value) / 100; this.redraw(); });
        if (snapToGrid) snapToGrid.addEventListener('change', (e) => { this.state.snapToGrid = e.target.checked; });
    }

    bindZoomAndToolbar() {
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const zoomResetArea = document.querySelector('.clickable-zoom');
        const layersToggle = document.getElementById('toggle-layers-btn');
        const layersPopup = document.getElementById('layers-popup');
        const clearBtn = document.getElementById('clear-canvas');
        const copyBtn = document.getElementById('copy-code');
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        const alignBtns = document.querySelectorAll('.align-btn');

        if (zoomIn) zoomIn.addEventListener('click', () => { this.state.zoom = Math.min(20, this.state.zoom * 1.2); this.updateZoomUI(); this.redraw(); });
        if (zoomOut) zoomOut.addEventListener('click', () => { this.state.zoom = Math.max(0.05, this.state.zoom / 1.2); this.updateZoomUI(); this.redraw(); });
        
        if (zoomResetArea) zoomResetArea.addEventListener('click', () => {
            const container = document.querySelector('.canvas-container');
            this.state.zoom = 1;
            this.state.panX = (container.clientWidth - this.state.canvasSize.width) / 2;
            this.state.panY = (container.clientHeight - this.state.canvasSize.height) / 2;
            this.updateZoomUI(); this.redraw();
        });

        if (layersToggle && layersPopup) {
            layersToggle.addEventListener('click', (e) => {
                layersPopup.classList.toggle('hidden');
                layersToggle.classList.toggle('active');
                e.stopPropagation();
            });

            // Prevent clicks inside the popup from bubbling to any potential outside close listeners
            layersPopup.addEventListener('click', (e) => e.stopPropagation());
        }

        if (clearBtn) clearBtn.addEventListener('click', () => { this.state.clear(); this.renderer.clear(); this.updateCode(); this.redraw(); });
        if (copyBtn) copyBtn.addEventListener('click', () => {
            const codeToCopy = this.state.lastGeneratedCode || '';
            navigator.clipboard.writeText(codeToCopy).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copiado!';
                setTimeout(() => copyBtn.textContent = originalText, 2000);
            });
        });

        if (undoBtn) undoBtn.addEventListener('click', () => { if (this.state.undo()) { this.redraw(); this.updateCode(); } });
        if (redoBtn) redoBtn.addEventListener('click', () => { if (this.state.redo()) { this.redraw(); this.updateCode(); } });
        
        if (alignBtns) alignBtns.forEach(btn => btn.addEventListener('click', () => {
            this.state.alignShapes(btn.dataset.align, this.state.canvasSize);
            this.redraw(); this.updateCode();
        }));
    }

    bindGlobalKeys() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                if (this.timeline) this.timeline.togglePlay();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                if (this.timeline && this.timeline.selectedKeyframe) {
                    if (this.timeline.deleteSelectedKeyframe()) {
                        this.updateCode(); this.redraw();
                        return;
                    }
                }

                if (this.state.selectedShapes.length > 0) {
                    this.state.deleteSelected();
                    this.updateCode(); this.redraw();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                const btn = document.getElementById('toggle-left-sidebar');
                if (btn) btn.click(); e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                const btn = document.getElementById('toggle-right-sidebar');
                if (btn) btn.click(); e.preventDefault();
            }
        });
    }
}
