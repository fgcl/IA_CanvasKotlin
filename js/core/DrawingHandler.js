export class DrawingHandler {
    static createShape(type, startX, startY, properties) {
        const { fillColor, strokeColor, lineWidth, alpha, currentFill, currentStroke } = properties;
        
        return {
            type: type,
            x: startX, y: startY,
            width: 0, height: 0,
            points: (type === 'pencil') ? [{x: startX, y: startY}] : [],
            fillColor: fillColor,
            strokeColor: strokeColor,
            opacity: alpha,
            useFill: (type === 'pencil') ? false : currentFill,
            useStroke: (type === 'pencil') ? true : currentStroke
        };
    }

    static handleComponentAddition(state, propertyEditor, toolbar, updateCode, redraw) {
        const componentType = state.currentComponentType;
        const shape = {
            type: componentType,
            x: state.startX,
            y: state.startY
        };
        state.addShape(shape);
        state.selectedShapes = [shape];
        propertyEditor.update(shape);
        
        // Revert to select
        state.setTool('select');
        if (toolbar) toolbar.updateActive('select');
        
        updateCode(); redraw();
        state.isDrawing = false;
    }

    static handleTextCreation(state, propertyEditor, updateCode, redraw) {
        const shape = {
            type: 'text',
            x: state.startX, y: state.startY,
            text: 'Novo Texto',
            fontSize: parseInt(propertyEditor.elements.fontSize.value) || 24,
            fillColor: '#58a6ff', // Premium Blue
            strokeColor: propertyEditor.strokeColorPicker.color,
            opacity: parseInt(propertyEditor.elements.opacity.value) / 100,
            useFill: true, useStroke: false
        };
        state.addShape(shape);
        state.selectedShapes = [shape];
        propertyEditor.update(shape);
        updateCode(); redraw();
        state.isDrawing = false;
    }

    static handleIconCreation(state, propertyEditor, updateCode, redraw) {
        const iconNameEl = document.getElementById('icon-name');
        const iconName = state.lastSelectedIcon || (iconNameEl ? iconNameEl.value : 'Favorite');
        const shape = {
            type: 'icon',
            x: state.startX, y: state.startY,
            width: 48, height: 48,
            iconName: iconName,
            fillColor: '#58a6ff',
            strokeColor: propertyEditor.strokeColorPicker.color,
            strokeWidth: parseInt(propertyEditor.elements.strokeWidth.value),
            opacity: parseInt(propertyEditor.elements.opacity.value) / 100,
            useFill: true, useStroke: false
        };
        state.addShape(shape);
        state.selectedShapes = [shape];
        propertyEditor.update(shape);
        updateCode(); redraw();
        state.isDrawing = false;
    }
}
