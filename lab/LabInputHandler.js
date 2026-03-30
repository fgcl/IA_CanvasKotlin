export class LabInputHandler {
    constructor(canvas, manager) {
        this.canvas = canvas;
        this.manager = manager;
        this.state = manager.state;
        
        this.isMouseDown = false;
        this.activeShape = null;
        this.dragOffset = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Tool Switcher logic
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.currentTool = btn.dataset.tool;
                this.manager.log(`Ferramenta: ${this.state.currentTool.toUpperCase()}`, "info");
            });
        });
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return this.state.screenToCanvas(x, y);
    }

    onMouseDown(e) {
        this.isMouseDown = true;
        const pos = this.getCanvasPos(e);
        
        if (this.state.currentTool === 'select') {
            const handle = this.state.getHandleAt(pos.x, pos.y);
            if (handle) {
                this.state.activeResizeHandle = handle.id;
                this.activeShape = this.state.selectedShapes[0];
                this.startPos = pos;
                this.manager.log(`Resizing: ${handle.id}`, "info");
            } else {
                const hit = this.state.findShapeAt(pos.x, pos.y, this.state.shapes);
                if (hit) {
                    this.activeShape = hit;
                    this.state.selectedShapes = [hit];
                    this.dragOffset = { x: pos.x - hit.x, y: pos.y - hit.y };
                    this.manager.log(`Selecionado: ${hit.name || hit.type}`, "info");
                } else {
                    this.activeShape = null;
                    this.state.selectedShapes = [];
                }
            }
        } else if (this.state.currentTool === 'bezier') {
            this.handleBezierClick(pos);
        }
        
        this.manager.draw();
    }

    handleBezierClick(pos) {
        if (!this.state.isBezierDrawing) {
            this.state.isBezierDrawing = true;
            this.activeShape = {
                id: 'bezier-' + Date.now(),
                type: 'bezier',
                name: 'Novo Caminho',
                points: [{ x: pos.x, y: pos.y, isSmooth: true }],
                fillColor: 'rgba(168, 85, 247, 0.2)',
                strokeColor: '#a855f7',
                strokeWidth: 2,
                useFill: true, useStroke: true
            };
            this.state.shapes.push(this.activeShape);
        } else if (this.activeShape) {
            this.activeShape.points.push({ x: pos.x, y: pos.y, isSmooth: true });
            this.state.updateBezierHandles(this.activeShape);
        }
    }

    onMouseMove(e) {
        if (!this.isMouseDown && !this.state.isBezierDrawing) return;
        const pos = this.getCanvasPos(e);

        if (this.state.currentTool === 'select' && this.activeShape && this.isMouseDown) {
            if (this.state.activeResizeHandle) {
                const dx = pos.x - this.startPos.x;
                const dy = pos.y - this.startPos.y;
                this.state.resizeShape(this.activeShape, this.state.activeResizeHandle, dx, dy, e.shiftKey);
                this.startPos = pos;
            } else {
                this.activeShape.x = pos.x - this.dragOffset.x;
                this.activeShape.y = pos.y - this.dragOffset.y;
                this.manager.applyLogic();
            }
        } else if (this.state.currentTool === 'bezier' && this.state.isBezierDrawing && this.activeShape) {
            const lastPoint = this.activeShape.points[this.activeShape.points.length - 1];
            lastPoint.x = pos.x; lastPoint.y = pos.y;
            this.state.updateBezierHandles(this.activeShape);
        }

        this.manager.draw(); // Live update for assertions
    }

    onMouseUp() {
        this.isMouseDown = false;
        this.state.activeResizeHandle = null;
        if (this.state.currentTool === 'select') {
            this.activeShape = null;
        }
    }
}
