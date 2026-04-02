import { BaseTool } from './BaseTool.js';
import { SnapEngine } from '../SnapEngine.js';

export class IconTool extends BaseTool {
    onMouseDown(e, coords) {
        const snapped = SnapEngine.snapCoords(coords.x, coords.y, this.state, this.state.transformManager);
        const iconShape = {
            type: 'icon',
            name: 'Home',
            x: snapped.x,
            y: snapped.y,
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
