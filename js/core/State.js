import { TransformManager } from './TransformManager.js';
import { HistoryManager } from './state/HistoryManager.js';
import { SelectionManager } from './state/SelectionManager.js';
import { ShapeManager } from './state/ShapeManager.js';
import { PathManager } from './state/PathManager.js';
import { AnimationManager } from './state/AnimationManager.js';

export class State {
    constructor() {
        this.shapes = [];
        this.selectedShapes = [];
        this.currentTool = 'select';
        this.currentShape = null;
        this.isDrawing = false; this.isBezierDrawing = false;
        this.startX = 0; this.startY = 0;
        this.marqueeRect = null;
        
        this.canvasSize = { width: 800, height: 600, isFixed: false };
        this.codeMode = 'absolute'; this.selectedLanguage = 'kotlin';
        this.activeResizeHandle = null;
        this.panX = 0; this.panY = 0; this.zoom = 1;
        
        this.gridType = 'none'; // 'square', 'dots', 'isometric'
        this.gridSize = 25; this.gridOpacity = 0.2;
        this.showGrid = true; this.snapToGrid = false;
        this.snapThreshold = 5;
        this.activeSnaps = { x: [], y: [] };
        this.snapOffset = { x: 0, y: 0 };

        // Composition
        this.history = new HistoryManager(this);
        this.selection = new SelectionManager(this);
        this.shapeManager = new ShapeManager(this);
        this.path = new PathManager(this);
        this.animation = new AnimationManager(this);
        this.transformManager = new TransformManager(this);
    }

    // Getters for manager state (compatibility)
    get undoStack() { return this.history.undoStack; }
    get redoStack() { return this.history.redoStack; }
    get clipboard() { return this.shapeManager.clipboard; }
    set clipboard(v) { this.shapeManager.clipboard = v; }
    get currentTime() { return this.animation ? this.animation.currentTime : 0; }
    set currentTime(v) { 
        if (this.animation && typeof this.animation.setCurrentTime === 'function') {
            this.animation.setCurrentTime(v); 
        } else {
            console.warn('AnimationManager not ready or missing setCurrentTime');
        }
    }
    get duration() { return this.animation.duration; }
    set duration(v) { this.animation.setDuration(v); }
    get isPlaying() { return this.animation ? this.animation.isPlaying : false; }
    set isPlaying(v) { if (this.animation) this.animation.isPlaying = v; }
    get isLooping() { return this.animation ? this.animation.isLooping : true; }
    set isLooping(v) { if (this.animation) this.animation.isLooping = v; }

    // Delegates - TransformManager
    getShapeBounds(s) { return this.transformManager.getShapeBounds(s); }
    getSelectionBounds() { return this.transformManager.getSelectionBounds(); }
    getResizeHandles(s) { return this.transformManager.getResizeHandles(s); }
    getHandleAt(x, y) { return this.transformManager.getHandleAt(x, y); }
    resizeShape(...args) { return this.transformManager.resizeShape(...args); }
    moveShape(...args) { return this.transformManager.moveShape(...args); }
    moveShapes(...args) { return this.transformManager.moveShapes(...args); }
    alignShapes(...args) { return this.transformManager.alignShapes(...args); }
    commitSnaps() { return this.transformManager.commitSnaps(); }
    getAbsoluteCoords(s) { return this.transformManager.getAbsoluteCoords(s); }
    moveShapeSilent(...args) { return this.transformManager.moveShapeSilent(...args); }

    // Delegates - HistoryManager
    saveState() { this.history.saveState(); }
    undo() { return this.history.undo(); }
    redo() { return this.history.redo(); }

    // Delegates - SelectionManager
    selectShapesInRect(...args) { return this.selection.selectShapesInRect(...args); }
    selectShape(...args) { return this.selection.selectShape(...args); }
    applySelection(...args) { return this.selection.applySelection(...args); }
    findShapeAt(...args) { return this.selection.findShapeAt(...args); }

    // Delegates - ShapeManager
    addShape(...args) { return this.shapeManager.addShape(...args); }
    deleteSelected() { return this.shapeManager.deleteSelected(); }
    reorderShape(...args) { return this.shapeManager.reorderShape(...args); }
    groupSelected() { return this.shapeManager.groupSelected(); }
    ungroupSelected() { return this.shapeManager.ungroupSelected(); }
    copySelected() { return this.shapeManager.copySelected(); }
    paste() { return this.shapeManager.paste(); }
    duplicateSelected() { return this.shapeManager.duplicateSelected(); }

    // Delegates - PathManager
    findNearestPoint(...args) { return this.path.findNearestPoint(...args); }
    removePoint(...args) { return this.path.removePoint(...args); }
    togglePointType(...args) { return this.path.togglePointType(...args); }
    updateBezierHandles(...args) { return this.path.updateBezierHandles(...args); }
    findNearestSegment(...args) { return this.path.findNearestSegment(...args); }
    addPointAt(...args) { return this.path.addPointAt(...args); }

    // Delegates - AnimationManager
    addKeyframe(...args) { return this.animation.addKeyframe(...args); }
    removeKeyframe(...args) { return this.animation.removeKeyframe(...args); }
    syncKeyframes(...args) { return this.animation.syncKeyframes(...args); }

    // Core Helpers
    findShapeById(id, list = this.shapes) {
        for (const s of list) {
            if (s.id === id) return s;
            if (s.children) {
                const found = this.findShapeById(id, s.children);
                if (found) return found;
            }
        }
        return null;
    }

    screenToCanvas(x, y) { return { x: (x - this.panX) / this.zoom, y: (y - this.panY) / this.zoom }; }
    canvasToScreen(x, y) { return { x: x * this.zoom + this.panX, y: y * this.zoom + this.panY }; }
    clear() { this.saveState(); this.shapes = []; this.selectedShapes = []; }
    setTool(tool) { this.currentTool = tool; }
    toggleVisibility(shape) { if (shape) { this.saveState(); shape.visible = !shape.visible; } }
    toggleLock(shape) { if (shape) { this.saveState(); shape.locked = !shape.locked; } }
    renameShape(shape, name) { if (shape && name) { this.saveState(); shape.name = name; } }

    isPointInShape(x, y, shape) {
        if (shape.type === 'rect' || shape.type === 'group' || shape.type === 'text' || shape.type === 'icon' || 
            ['button', 'input', 'checkbox', 'switch', 'slider', 'progress'].includes(shape.type)) {
            const b = this.getShapeBounds(shape);
            return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
        }
        if (shape.type === 'circle') {
            const abs = this.getAbsoluteCoords(shape);
            return Math.sqrt((x - abs.x)**2 + (y - abs.y)**2) <= Math.sqrt(shape.width**2 + shape.height**2);
        }
        if (shape.type === 'line') {
            const abs = this.getAbsoluteCoords(shape);
            const dx = shape.endX - shape.x; const dy = shape.endY - shape.y;
            const endX = abs.x + dx; const endY = abs.y + dy;
            const l2 = (abs.x - endX)**2 + (abs.y - endY)**2;
            if (l2 === 0) return Math.sqrt((x - abs.x)**2 + (y - abs.y)**2) <= 10;
            const t = Math.max(0, Math.min(1, ((x - abs.x) * (endX - abs.x) + (y - abs.y) * (endY - abs.y)) / l2));
            return Math.sqrt((x - (abs.x + t * (endX - abs.x)))**2 + (y - (abs.y + t * (endY - abs.y)))**2) <= 10 / this.zoom;
        }
        if (shape.type === 'pencil' && shape.points) {
            const hitRadius = 10 / this.zoom;
            for (let i = 1; i < shape.points.length; i++) {
                const p1 = shape.points[i-1], p2 = shape.points[i];
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const l2 = dx*dx + dy*dy;
                let t = l2 === 0 ? 0 : ((x - p1.x) * dx + (y - p1.y) * dy) / l2;
                t = Math.max(0, Math.min(1, t));
                const dist = Math.sqrt((x - (p1.x + t * dx))**2 + (y - (p1.y + t * dy))**2);
                if (dist <= hitRadius) return true;
            }
        }
        if (shape.points) {
            const hitRadius = 12 / this.zoom;
            if (shape.points.find(p => Math.sqrt((x - p.x)**2 + (y - p.y)**2) <= hitRadius)) return true;
            if (shape.useFill !== false) {
                const b = this.getShapeBounds(shape);
                return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
            }
        }
        return false;
    }

    recursiveParentUpdate(shape, parentId = null) {
        shape.parentId = parentId;
        if (shape.children) {
            shape.children.forEach(c => this.recursiveParentUpdate(c, shape.id));
        }
    }
}
