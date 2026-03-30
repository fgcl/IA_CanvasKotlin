export class BaseTool {
    constructor(state, canvas, renderer, propertyEditor, updateCode, redraw) {
        this.state = state;
        this.canvas = canvas;
        this.renderer = renderer;
        this.propertyEditor = propertyEditor;
        this.updateCode = updateCode;
        this.redraw = redraw;
    }

    // Standard Mouse Events
    onMouseDown(e, coords) {}
    onMouseMove(e, coords) {}
    onMouseUp(e, coords) {}
    onKeyDown(e) {}
    onKeyUp(e) {}

    // Special Events
    onDoubleClick(e, coords) {}
    onDeactivate() {
        // Cleanup when tool is switched
        this.state.isDrawing = false;
        this.state.currentShape = null;
    }

    // Helper to get normalized props from UI
    getCurrentProps() {
        const { strokeWidth, opacity } = this.propertyEditor.elements;
        const fill = this.propertyEditor.fillColorPicker.color;
        const stroke = this.propertyEditor.strokeColorPicker.color;

        return {
            fillColor: fill,
            strokeColor: stroke,
            useFill: fill !== 'transparent',
            useStroke: stroke !== 'transparent',
            strokeWidth: parseInt(strokeWidth.value) || 2,
            opacity: (parseInt(opacity.value) || 100) / 100
        };
    }
}
