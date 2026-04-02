export class ShapeNormalizer {
    /**
     * Normalizes a shape object to ensure it has all required properties.
     * Inspired by Excalidraw's 'restore' mechanism.
     */
    static normalize(shape) {
        if (!shape) return null;

        // Base defaults
        const normalized = {
            id: shape.id || `shape_${Math.random().toString(36).substr(2, 9)}`,
            type: shape.type || 'rect',
            x: Number(shape.x) || 0,
            y: Number(shape.y) || 0,
            width: Number(shape.width) || 0,
            height: Number(shape.height) || 0,
            opacity: shape.opacity !== undefined ? Number(shape.opacity) : 1,
            visible: shape.visible !== undefined ? !!shape.visible : true,
            locked: !!shape.locked,
            name: shape.name || `${shape.type}_${shape.id}`,
            parentId: shape.parentId || null,
            fillColor: shape.fillColor || '#58a6ff',
            strokeColor: shape.strokeColor || '#03DAC6',
            strokeWidth: shape.strokeWidth !== undefined ? Number(shape.strokeWidth) : 2,
            useFill: shape.useFill !== undefined ? !!shape.useFill : true,
            useStroke: shape.useStroke !== undefined ? !!shape.useStroke : false,
            keyframes: shape.keyframes || {},
            ...shape
        };

        // Type-specific normalization
        switch (normalized.type) {
            case 'pencil':
                normalized.points = Array.isArray(shape.points) ? shape.points : [];
                normalized.useFill = false; // Pencil never fills
                normalized.useStroke = true; // Pencil always strokes
                normalized.strokeWidth = normalized.strokeWidth || 2;
                break;
            case 'bezier':
                normalized.points = Array.isArray(shape.points) ? shape.points : [];
                break;
            case 'line':
                normalized.endX = shape.endX !== undefined ? Number(shape.endX) : normalized.x + 100;
                normalized.endY = shape.endY !== undefined ? Number(shape.endY) : normalized.y + 100;
                break;
            case 'text':
                normalized.text = shape.text || 'Text';
                normalized.fontSize = Number(shape.fontSize) || 24;
                break;
            case 'icon':
                normalized.iconName = shape.iconName || 'Favorite';
                break;
            case 'group':
                normalized.children = Array.isArray(shape.children) ? shape.children.map(c => this.normalize(c)) : [];
                break;
            case 'image':
                normalized.src = shape.src || '';
                normalized.aspectRatio = Number(shape.aspectRatio) || 1;
                break;
        }

        return normalized;
    }
}
