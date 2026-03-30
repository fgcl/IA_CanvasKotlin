export class BezierHandler {
    static handleBezierStart(state, redraw, props) {
        const { useFill, useStroke, fillColor, strokeColor, strokeWidth, opacity } = props;

        if (!state.isBezierDrawing) {
            state.isBezierDrawing = true;
            state.currentShape = {
                type: 'bezier',
                points: [{x: state.startX, y: state.startY, isSmooth: true}],
                fillColor: fillColor,
                strokeColor: strokeColor,
                strokeWidth: strokeWidth,
                opacity: opacity,
                useFill: useFill, useStroke: useStroke
            };
        } else if (state.currentShape) {
            // Check for path closure
            const first = state.currentShape.points[0];
            const dist = Math.sqrt((state.startX - first.x)**2 + (state.startY - first.y)**2);
            const closeThreshold = 10 / state.zoom;
            
            if (dist < closeThreshold && state.currentShape.points.length > 1) {
                // DON'T ADD POINT - Just finish
                state.isBezierDrawing = false;
                state.addShape(state.currentShape);
                state.selectedShapes = [state.currentShape];
                state.currentShape = null;
            } else {
                state.currentShape.points.push({
                    x: state.startX, y: state.startY, isSmooth: true
                });
                state.updateBezierHandles(state.currentShape);
            }
        }
        redraw();
    }

    static handleEditPointsStart(state, propertyEditor, updateCode, redraw) {
        const shapeFound = state.selectShape(state.startX, state.startY, false);
        let activePoint = null;

        if (shapeFound) {
            state.selectedShapes = [shapeFound];
            state.currentShape = shapeFound;
            activePoint = state.findNearestPoint(state.currentShape, state.startX, state.startY);
            propertyEditor.update(shapeFound);
        } else if (state.selectedShapes.length === 1) {
            state.currentShape = state.selectedShapes[0];
            activePoint = state.findNearestPoint(state.currentShape, state.startX, state.startY);
        }
        
        if (!activePoint && !shapeFound) {
            if (state.selectedShapes.length === 1 && state.selectedShapes[0].points) {
                const shape = state.selectedShapes[0];
                const segmentHit = state.findNearestSegment(shape, state.startX, state.startY);
                if (segmentHit) {
                    activePoint = state.addPointAt(shape, segmentHit.index, segmentHit.x, segmentHit.y);
                    updateCode(); redraw();
                }
            } else {
                state.marqueeRect = { x: state.startX, y: state.startY, w: 0, h: 0 };
            }
        }
        redraw();
        return activePoint;
    }

    static handlePointMove(state, activePoint, x, y, updateCode, redraw) {
        const p = state.currentShape.points[activePoint.index];
        state.mergeCandidate = null;

        if (activePoint.type === 'anchor') {
            const dx = x - p.x, dy = y - p.y;
            p.x = x; p.y = y;
            if (p.cp1x !== undefined) { p.cp1x += dx; p.cp1y += dy; p.cp2x += dx; p.cp2y += dy; }

            const hitRadius = 12 / state.zoom;
            state.currentShape.points.forEach((otherP, idx) => {
                if (idx !== activePoint.index) {
                    const d = Math.sqrt((x - otherP.x)**2 + (y - otherP.y)**2);
                    if (d < hitRadius) {
                        state.mergeCandidate = idx;
                        p.x = otherP.x; p.y = otherP.y;
                    }
                }
            });
            state.updateBezierHandles(state.currentShape);
        }
        updateCode(); redraw();
    }
}
