import { GridRenderer } from './GridRenderer.js';
import { RulerRenderer } from './RulerRenderer.js';
import { IconLibrary } from './IconLibrary.js';
import { AnimationEngine } from './AnimationEngine.js';
import { ComponentRenderer } from './ComponentRenderer.js';
import { HelperRenderer } from './HelperRenderer.js';
import { ShapeNormalizer } from './state/ShapeNormalizer.js';
import { SnapEngine } from './SnapEngine.js';

export class Renderer {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = state;
        this.imageCache = new Map();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawAll(state) {
        this.clear();
        const { shapes, selectedShapes, isBezierDrawing, marqueeRect, currentTool, currentShape, isDrawing, activeSnaps, panX, panY, zoom, canvasSize } = state;
        const dpr = window.devicePixelRatio || 1;
        
        // Background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Global Transform
        this.ctx.save();
        this.ctx.scale(dpr, dpr);
        this.ctx.translate(panX, panY);
        this.ctx.scale(zoom, zoom);

        // Artboard Surface
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)'; this.ctx.shadowBlur = 40; this.ctx.shadowOffsetY = 10;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        this.ctx.restore();
        
        // Unselected Shapes
        shapes.forEach(shape => {
            if (!shape || shape.parentId) return;
            if (!selectedShapes.includes(shape) && shape.visible !== false) {
                this.drawShape(shape);
            }
        });

        // Selected Shapes (In front)
        selectedShapes.forEach(shape => {
            if (!shape) return;
            if (shape.visible !== false) {
                const isDragging = isDrawing && (currentTool === 'select' || state.activeResizeHandle);
                const offsetX = isDragging ? (state.snapOffset?.x || 0) : 0;
                const offsetY = isDragging ? (state.snapOffset?.y || 0) : 0;
                
                this.ctx.save();
                if (shape.parentId) {
                    const abs = state.transformManager.getAbsoluteCoords(shape);
                    this.ctx.translate(abs.x - shape.x, abs.y - shape.y);
                }
                
                this.drawShape(shape, isBezierDrawing || shape.type === 'bezier' || currentTool === 'edit-points', offsetX, offsetY);
                this.ctx.restore();
                
                // For highlights, we need the animated state too
                const displayShape = (shape.keyframes && Object.keys(shape.keyframes).length > 0) ? 
                    AnimationEngine.animateShape(shape, state.currentTime) : shape;
                HelperRenderer.drawSelectionHighlight(displayShape, state, this.ctx, offsetX, offsetY);
            }
        });

        // Current Shape (being drawn)
        // Robustness: Draw the current shape if it exists and a creation tool is active.
        const isCreationTool = !['select', 'edit-points', 'hand'].includes(currentTool);
        if (currentShape && (isDrawing || isBezierDrawing || isCreationTool)) {
            this.drawShape(currentShape, isBezierDrawing || currentTool === 'bezier', 0, 0);
        }

        // Bezier Rubber-Band Preview
        if (isBezierDrawing && currentShape && currentShape.type === 'bezier' && state.mousePos) {
            const snapped = SnapEngine.snapCoords(state.mousePos.x, state.mousePos.y, state, state.transformManager);
            this._drawBezierPreview(this.ctx, currentShape, snapped);
        }

        // Creation Cursor Preview (Magnetizing before first click)
        if (isCreationTool && !isDrawing && !isBezierDrawing && state.mousePos) {
            const snapped = SnapEngine.snapCoords(state.mousePos.x, state.mousePos.y, state, state.transformManager);
            this._drawCreationCursor(this.ctx, snapped);
        }
        
        // Helpers (Marquee, Snaps)
        if (marqueeRect) HelperRenderer.drawMarquee(marqueeRect, this.ctx);
        if (activeSnaps) HelperRenderer.drawSnappingGuides(activeSnaps, this.ctx);

        this.ctx.restore(); // Restore Global Transform

        // UI Layer (Non-transformed)
        GridRenderer.draw(this.ctx, state, this.canvas.width, this.canvas.height);
        RulerRenderer.draw(this.canvas, state);
    }

    drawShape(rawShape, isDrawingHelpers = false, offsetX = 0, offsetY = 0) {
        if (!rawShape) return;
        
        // --- ALWAYS ANIMATE IN RENDERER TO MATCH INTERACTION (isPointInShape) ---
        const animatedShape = (rawShape.keyframes && Object.keys(rawShape.keyframes).length > 0) ? 
            AnimationEngine.animateShape(rawShape, this.state.currentTime) : rawShape;

        // Normalize the shape before rendering (Excalidraw pattern)
        const shape = ShapeNormalizer.normalize(animatedShape);
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Global Style Reset (Prevents pollution)
        ctx.globalAlpha = shape.opacity !== undefined && shape.opacity !== null ? shape.opacity : 1;
        ctx.setLineDash([]);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        
        ctx.fillStyle = shape.fillColor;
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        
        switch (shape.type) {
            case 'rect': this._drawRect(ctx, shape); break;
            case 'circle': this._drawCircle(ctx, shape); break;
            case 'line': this._drawLine(ctx, shape); break;
            case 'bezier': this._drawBezier(ctx, shape); break;
            case 'text': this._drawText(ctx, shape); break;
            case 'icon': this._drawIcon(ctx, shape); break;
            case 'pencil': this._drawPencil(ctx, shape); break;
            case 'group': this._drawGroup(ctx, shape); break;
            case 'image': this._drawImage(ctx, shape); break;
            default:
                if (['button', 'input', 'checkbox', 'switch', 'slider', 'progress'].includes(shape.type)) {
                    ComponentRenderer.draw(shape, ctx);
                }
        }

        ctx.restore();
        
        if (isDrawingHelpers) {
            HelperRenderer.drawBezierHelpers(shape, this.state, this.ctx);
        }
    }

    _drawRect(ctx, s) {
        const r = Math.max(0, Math.min(s.cornerRadius || 0, Math.abs(s.width) / 2, Math.abs(s.height) / 2));
        if (r > 0) ctx.roundRect(s.x, s.y, s.width, s.height, r);
        else ctx.rect(s.x, s.y, s.width, s.height);
        if (s.useFill) ctx.fill(); 
        if (s.useStroke && s.strokeWidth > 0) ctx.stroke();
    }

    _drawCircle(ctx, s) {
        const radius = Math.sqrt(s.width**2 + s.height**2);
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        if (s.useFill) ctx.fill(); 
        if (s.useStroke && s.strokeWidth > 0) ctx.stroke();
    }

    _drawLine(ctx, s) {
        ctx.moveTo(s.x, s.y); ctx.lineTo(s.endX, s.endY);
        if (s.useStroke) ctx.stroke();
    }

    _drawPencil(ctx, s) {
        if (!s.points || s.points.length < 1) return;
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
    }

    _drawBezier(ctx, s) {
        if (!s.points || s.points.length < 1) return;
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
            const p = s.points[i], prev = s.points[i-1];
            ctx.bezierCurveTo(prev.cp2x, prev.cp2y, p.cp1x, p.cp1y, p.x, p.y);
        }
        if (s.points.length > 1) {
            const last = s.points[s.points.length - 1], first = s.points[0];
            ctx.bezierCurveTo(last.cp2x, last.cp2y, first.cp1x, first.cp1y, first.x, first.y);
        }
        if (s.useFill) ctx.fill(); 
        if (s.useStroke && s.strokeWidth > 0) ctx.stroke();
    }

    _drawText(ctx, s) {
        ctx.font = `${s.fontSize || 24}px Inter, sans-serif`; ctx.textBaseline = 'top';
        if (s.useFill) ctx.fillText(s.text || '', s.x, s.y);
    }

    _drawIcon(ctx, s) {
        const pathData = IconLibrary[s.iconName || 'Favorite'];
        if (pathData) {
            const p = new Path2D(pathData);
            ctx.save(); 
            ctx.translate(s.x, s.y);
            const scaleX = (s.width || 24) / 24, scaleY = (s.height || 24) / 24;
            ctx.scale(scaleX, scaleY);
            if (s.useFill) ctx.fill(p); 
            ctx.restore();
        }
    }

    _drawGroup(ctx, s) {
        ctx.save(); ctx.translate(s.x, s.y);
        if (s.children) {
            s.children.forEach(child => this.drawShape(child));
        }
        ctx.restore();
    }

    _drawImage(ctx, s) {
        if (!s.src) return;
        
        let img = this.imageCache.get(s.src);
        if (!img) {
            img = new Image();
            img.src = s.src;
            img.onload = () => {
                this.imageCache.set(s.src, img);
                // Trigger redraw via state's notify mechanisms if available,
                // or just wait for next interaction/frame.
            };
            this.imageCache.set(s.src, 'loading');
            return;
        }

        if (img === 'loading') return;

        ctx.save();
        if (s.useStroke && s.strokeWidth > 0) {
            ctx.strokeStyle = s.strokeColor;
            ctx.lineWidth = s.strokeWidth;
            ctx.strokeRect(s.x, s.y, s.width, s.height);
        }
        ctx.drawImage(img, s.x, s.y, s.width, s.height);
        ctx.restore();
    }

    _drawBezierPreview(ctx, shape, snappedMouse) {
        if (!shape.points || shape.points.length === 0) return;
        const last = shape.points[shape.points.length - 1];
        
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#03DAC688';
        ctx.lineWidth = 1.5;
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(snappedMouse.x, snappedMouse.y);
        ctx.stroke();
        
        // Draw a small dot at mouse to show where point will be
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.fillStyle = '#03DAC6';
        ctx.arc(snappedMouse.x, snappedMouse.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawCreationCursor(ctx, snapped) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#03DAC6aa';
        ctx.lineWidth = 1;
        ctx.arc(snapped.x, snapped.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.fillStyle = '#03DAC6';
        ctx.arc(snapped.x, snapped.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
