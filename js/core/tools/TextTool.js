import { BaseTool } from './BaseTool.js';

export class TextTool extends BaseTool {
    constructor(state, canvas, renderer, propertyEditor, updateCode, redraw, textEditor) {
        super(state, canvas, renderer, propertyEditor, updateCode, redraw);
        this.textEditor = textEditor;
    }

    onMouseDown(e, coords) {
        const textShape = {
            type: 'text',
            x: coords.x,
            y: coords.y,
            text: 'Texto',
            fontSize: 20,
            fontFamily: 'Arial',
            fillColor: '#000000',
            useFill: true,
            useStroke: false
        };
        this.state.addShape(textShape);
        this.state.selectedShapes = [textShape];
        this.propertyEditor.update(textShape);
        
        // Auto-show editor
        this.textEditor.show(textShape, this.canvas, this.state, (newText) => {
            this.state.saveState();
            textShape.text = newText;
            this.updateCode();
            this.redraw();
        });
        
        this.updateCode();
        this.redraw();
    }

    onDoubleClick(e, coords) {
        const hit = this.state.findShapeAt(coords.x, coords.y, this.state.shapes);
        if (hit && hit.type === 'text') {
            this.textEditor.show(hit, this.canvas, this.state, (newText) => {
                this.state.saveState();
                hit.text = newText;
                this.updateCode();
                this.redraw();
            });
        }
    }
}
