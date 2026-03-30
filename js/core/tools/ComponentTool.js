import { BaseTool } from './BaseTool.js';

export class ComponentTool extends BaseTool {
    onMouseDown(e, coords) {
        const componentShape = {
            type: 'component',
            componentType: 'button',
            x: coords.x,
            y: coords.y,
            width: 120,
            height: 48,
            label: 'Button',
            alpha: 1,
            visible: true
        };
        this.state.addShape(componentShape);
        this.state.selectedShapes = [componentShape];
        this.propertyEditor.update(componentShape);
        this.updateCode();
        this.redraw();
    }
}
