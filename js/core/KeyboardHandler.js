export class KeyboardHandler {
    static handleKeyDown(e, state, toolbar, redraw, updateCode) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (e.shiftKey) state.redo(); else state.undo();
            redraw(); updateCode(); e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            state.redo(); redraw(); updateCode(); e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            state.copySelected();
            e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            state.paste();
            redraw(); updateCode(); e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
            if (e.shiftKey) {
                state.ungroupSelected();
            } else {
                state.groupSelected();
            }
            redraw(); updateCode(); e.preventDefault();
        }
        if (e.key === 'Escape' && state.isBezierDrawing && state.currentShape) {
            state.addShape(state.currentShape);
            state.isBezierDrawing = false; state.currentShape = null;
            updateCode(); redraw();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            if (state.selectedShapes.length > 0) {
                state.duplicateSelected();
                updateCode(); redraw();
            }
            e.preventDefault();
        }
        
        const moveKeys = { 'ArrowUp': [0, -1], 'ArrowDown': [0, 1], 'ArrowLeft': [-1, 0], 'ArrowRight': [1, 0] };
        if (moveKeys[e.key] && state.selectedShapes.length > 0 && !state.isDrawing && !state.isBezierDrawing && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            const mult = e.shiftKey ? 10 : 1;
            const [dx, dy] = moveKeys[e.key];
            state.saveState();
            state.selectedShapes.forEach(shape => state.moveShape(shape, dx * mult, dy * mult));
            redraw(); updateCode(); e.preventDefault();
        }

        const toolMap = { 'h': 'hand', 'v': 'select', 'e': 'edit-points', 't': 'text', 'r': 'rect', 'o': 'circle', 'l': 'line', 'p': 'bezier', 'i': 'icon' };
        if (toolMap[e.key.toLowerCase()]) {
            const tool = toolMap[e.key.toLowerCase()];
            state.setTool(tool); toolbar.updateActive(tool); redraw();
        }

        if (e.key === ' ' && !e.repeat) {
            state.previousTool = state.currentTool;
            state.setTool('hand'); toolbar.updateActive('hand'); redraw();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            state.panX = 0; state.panY = 0; state.zoom = 1; redraw();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.currentTool === 'edit-points' && state.currentShape && state.activePoint) {
                state.removePoint(state.currentShape, state.activePoint.index);
                state.activePoint = null; updateCode(); redraw();
            } else if (state.selectedShapes.length > 0 && !state.isDrawing && !state.isBezierDrawing) {
                state.deleteSelected(); updateCode(); redraw();
            }
        }
    }

    static handleKeyUp(e, state, toolbar, redraw) {
        if (e.key === ' ' && state.previousTool) {
            state.setTool(state.previousTool);
            toolbar.updateActive(state.previousTool);
            state.previousTool = null; redraw();
        }
    }
}
