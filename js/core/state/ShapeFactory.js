/**
 * ShapeFactory.js
 * Centralizes the creation of elements to ensure all mandatory properties
 * (transformations, constraints, keyframes) are always present.
 */

export class ShapeFactory {
    static create(type, overrides = {}, state = null) {
        const id = overrides.id || `shape-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const namePrefix = type.charAt(0).toUpperCase() + type.slice(1);
        const nameCount = state ? (state.shapes.filter(s => s.type === type).length + 1) : 1;

        const base = {
            id: id,
            name: overrides.name || `${namePrefix} ${nameCount}`,
            type: type,
            x: overrides.x !== undefined ? overrides.x : 0,
            y: overrides.y !== undefined ? overrides.y : 0,
            width: overrides.width !== undefined ? overrides.width : 100,
            height: overrides.height !== undefined ? overrides.height : 100,
            visible: overrides.visible !== undefined ? overrides.visible : true,
            locked: overrides.locked !== undefined ? overrides.locked : false,
            opacity: overrides.opacity !== undefined ? overrides.opacity : 1.0,
            fillColor: overrides.fillColor || '#4f46e5',
            strokeColor: overrides.strokeColor || '#ffffff',
            strokeWidth: overrides.strokeWidth !== undefined ? overrides.strokeWidth : 0,
            parentId: overrides.parentId || null,
            children: overrides.children || [],
            keyframes: overrides.keyframes || {},
            constraints: overrides.constraints || { horizontal: 'left', vertical: 'top' },
            layout: overrides.layout || { type: 'none', gap: 0, padding: 0 }
        };

        // Type-specific adjustments
        this.applyTypeSpecificDefaults(base);

        // Merge remaining overrides
        return { ...base, ...overrides };
    }

    static applyTypeSpecificDefaults(shape) {
        switch (shape.type) {
            case 'rect':
                shape.cornerRadius = shape.cornerRadius || 0;
                break;
            case 'circle':
                shape.fillColor = shape.fillColor || '#ef4444';
                break;
            case 'text':
                shape.text = shape.text || 'Texto';
                shape.fontSize = shape.fontSize || 16;
                shape.fillColor = shape.fillColor || '#000000';
                break;
            case 'icon':
                shape.iconName = shape.iconName || 'Favorite';
                shape.width = shape.width || 48;
                shape.height = shape.height || 48;
                break;
            case 'line':
                shape.endX = shape.endX || (shape.x + 100);
                shape.endY = shape.endY || (shape.y + 100);
                shape.strokeWidth = shape.strokeWidth || 2;
                shape.useStroke = true;
                break;
            case 'pencil':
                shape.points = shape.points || [];
                shape.strokeWidth = shape.strokeWidth || 2;
                shape.useStroke = true;
                shape.useFill = false;
                break;
            case 'input':
                shape.isComponent = true;
                shape.text = shape.text || 'Hint...';
                shape.width = shape.width || 200;
                shape.height = shape.height || 44;
                shape.cornerRadius = shape.cornerRadius || 8;
                shape.fillColor = shape.fillColor || '#f8fafc';
                shape.strokeColor = shape.strokeColor || '#cbd5e1';
                shape.strokeWidth = 1;
                break;
            case 'button':
                shape.isComponent = true;
                shape.text = shape.text || 'Botão';
                shape.width = shape.width || 120;
                shape.height = shape.height || 40;
                shape.cornerRadius = 4;
                shape.fillColor = '#4f46e5';
                shape.strokeColor = '#ffffff';
                break;
            case 'checkbox':
                shape.isComponent = true;
                shape.width = 24; shape.height = 24;
                shape.checked = shape.checked || false;
                break;
            case 'switch':
                shape.isComponent = true;
                shape.width = 44; shape.height = 24;
                shape.checked = shape.checked || true;
                break;
            case 'slider':
                shape.isComponent = true;
                shape.width = 160; shape.height = 20;
                shape.value = shape.value || 50;
                break;
            case 'progress':
                shape.isComponent = true;
                shape.width = 160; shape.height = 8;
                shape.value = shape.value || 40;
                break;
            case 'group':
                shape.fillColor = 'transparent';
                shape.strokeColor = 'transparent';
                shape.strokeWidth = 0;
                break;
        }
    }
}
