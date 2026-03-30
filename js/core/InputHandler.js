import { KeyboardHandler } from './KeyboardHandler.js';
import { SelectTool } from './tools/SelectTool.js';
import { PencilTool } from './tools/PencilTool.js';
import { PenTool } from './tools/PenTool.js';
import { ShapeTool } from './tools/ShapeTool.js';
import { HandTool } from './tools/HandTool.js';
import { TextTool } from './tools/TextTool.js';
import { IconTool } from './tools/IconTool.js';
import { ComponentTool } from './tools/ComponentTool.js';
import { EditPointsTool } from './tools/EditPointsTool.js';
import { LineTool } from './tools/LineTool.js';

export class InputHandler {
    constructor(canvas, state, renderer, propertyEditor, toolbar, layersPanel, updateCode, redraw, textEditor) {
        this.canvas = canvas; this.state = state; this.renderer = renderer;
        this.propertyEditor = propertyEditor; this.toolbar = toolbar;
        this.layersPanel = layersPanel; this.updateCode = updateCode;
        this.redraw = redraw; this.textEditor = textEditor;
        
        // Tool Registry
        const toolArgs = [state, canvas, renderer, propertyEditor, updateCode, redraw];
        const textToolArgs = [...toolArgs, textEditor];
        this.tools = {
            'select': new SelectTool(...toolArgs),
            'pencil': new PencilTool(...toolArgs),
            'bezier': new PenTool(...toolArgs),
            'rect': new ShapeTool(...toolArgs),
            'circle': new ShapeTool(...toolArgs),
            'hand': new HandTool(...toolArgs),
            'text': new TextTool(...textToolArgs),
            'icon': new IconTool(...toolArgs),
            'add-component': new ComponentTool(...toolArgs),
            'edit-points': new EditPointsTool(...toolArgs),
            'line': new LineTool(...toolArgs)
        };
        this.activeTool = this.tools['select'];

        this.init();
    }

    init() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.drawing.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        this.canvas.addEventListener('mousemove', this.updateCursor.bind(this));
        
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return this.state.screenToCanvas(x, y);
    }

    getActiveTool() {
        const toolName = this.state.currentTool;
        // Handle switching
        if (this.tools[toolName] && this.activeTool !== this.tools[toolName]) {
            if (this.activeTool) this.activeTool.onDeactivate();
            this.activeTool = this.tools[toolName];
        }
        return this.activeTool;
    }

    updateCursor(e) {
        if (this.state.isDrawing) return;
        const { x, y } = this.getCanvasPos(e);

        if (this.state.currentTool === 'select' || this.state.currentTool === 'edit-points') {
            const handle = this.state.getHandleAt(x, y);
            if (handle) {
                this.canvas.style.cursor = handle.cursor;
                return;
            }
        }
        
        const cursors = { 'select': 'default', 'hand': 'grab', 'pencil': 'crosshair', 'rect': 'crosshair', 'circle': 'crosshair', 'line': 'crosshair', 'bezier': 'crosshair', 'edit-points': 'default' };
        this.canvas.style.cursor = cursors[this.state.currentTool] || 'default';
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const before = this.state.screenToCanvas(mouseX, mouseY);
        const factor = Math.pow(1.1, -e.deltaY / 100);
        
        this.state.zoom *= factor;
        this.state.zoom = Math.max(0.05, Math.min(20, this.state.zoom));

        const after = this.state.canvasToScreen(before.x, before.y);
        this.state.panX += mouseX - after.x;
        this.state.panY += mouseY - after.y;

        this.redraw();
    }

    startDrawing(e) {
        const coords = this.getCanvasPos(e);
        this.state.startX = coords.x; this.state.startY = coords.y;
        this.state.mouseDownPos = { x: e.clientX, y: e.clientY };
        
        if (e.button === 1) { // Middle mouse always pans
            this.tools['hand'].onMouseDown(e, coords);
            return;
        }

        const tool = this.getActiveTool();
        if (tool) tool.onMouseDown(e, coords);
        this.redraw();
    }

    drawing(e) {
        const coords = this.getCanvasPos(e);
        this.state.mousePos = coords;

        if (e.buttons === 4) { // Middle mouse drag
            this.tools['hand'].onMouseMove(e, coords);
            return;
        }

        const tool = this.getActiveTool();
        if (tool) tool.onMouseMove(e, coords);
        this.redraw();
    }

    stopDrawing(e) {
        const coords = this.getCanvasPos(e);
        const tool = this.getActiveTool();
        if (tool) tool.onMouseUp(e, coords);
        this.redraw();
    }

    handleKeyDown(e) { KeyboardHandler.handleKeyDown(e, this.state, this.toolbar, this.redraw, this.updateCode); }
    handleKeyUp(e) { KeyboardHandler.handleKeyUp(e, this.state, this.toolbar, this.redraw); }

    handleDoubleClick(e) {
        const coords = this.getCanvasPos(e);
        const tool = this.getActiveTool();
        if (tool && tool.onDoubleClick) {
            tool.onDoubleClick(e, coords);
        }
    }
}
