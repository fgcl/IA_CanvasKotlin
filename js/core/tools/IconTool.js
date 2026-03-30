import { BaseTool } from './BaseTool.js';

export class IconTool extends BaseTool {
    onMouseDown(e, coords) {
        const iconShape = {
            type: 'icon',
            name: 'Home',
            x: coords.x,
            y: coords.y,
            width: 24,
            height: 24,
            fillColor: '#000000',
            useFill: true,
            useStroke: false
        };
        this.state.addShape(iconShape);
        this.state.selectedShapes = [iconShape];
        this.propertyEditor.update(iconShape);
        this.updateCode();
        this.redraw();
    }
}
