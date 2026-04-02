import { ShapeFactory } from './ShapeFactory.js';
import { ShapeNormalizer } from './ShapeNormalizer.js';

export class ShapeManager {
    constructor(state) {
        this.state = state;
        this.clipboard = null;
    }

    addShape(shape, parentId = null) {
        this.state.saveState();
        
        // Ensure shape is fully formed via Factory if it's a new or partial object
        let finalShape = ShapeFactory.create(shape.type, shape, this.state);
        // Normalize (Sanitize) after creation to ensure defaults and robustness
        finalShape = ShapeNormalizer.normalize(finalShape);
        finalShape.parentId = parentId || finalShape.parentId || null;
        
        if (parentId) {
            const parent = this.state.findShapeById(parentId);
            if (parent) {
                if (!parent.children) parent.children = [];
                parent.children.push(finalShape);
            }
        } else {
            this.state.shapes.push(finalShape);
        }
        return finalShape;
    }

    deleteSelected() {
        if (this.state.selectedShapes.length === 0) return;
        this.state.saveState();
        this.state.shapes = this.state.shapes.filter(s => !this.state.selectedShapes.includes(s));
        this.state.selectedShapes = [];
    }

    reorderShape(shape, direction) {
        const index = this.state.shapes.indexOf(shape);
        if (index === -1) return;
        this.state.saveState();
        if (direction === 'up' && index < this.state.shapes.length - 1) {
            [this.state.shapes[index], this.state.shapes[index + 1]] = [this.state.shapes[index + 1], this.state.shapes[index]];
        } else if (direction === 'down' && index > 0) {
            [this.state.shapes[index], this.state.shapes[index - 1]] = [this.state.shapes[index - 1], this.state.shapes[index]];
        }
    }

    groupSelected() {
        if (this.state.selectedShapes.length < 2) return;
        this.state.saveState();

        const bounds = this.state.getSelectionBounds();
        const group = ShapeFactory.create('group', {
            x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h,
            name: 'Grupo ' + (this.state.shapes.filter(s => s.type === 'group').length + 1)
        }, this.state);

        const sortedSelected = [...this.state.selectedShapes].sort((a, b) => this.state.shapes.indexOf(a) - this.state.shapes.indexOf(b));
        sortedSelected.forEach(child => {
            child.parentId = group.id;
            this.convertToRelative(child, group.x, group.y);
            child.constraints = { horizontal: 'scale', vertical: 'scale' };
            group.children.push(child);
            this.state.shapes = this.state.shapes.filter(s => s !== child);
        });

        this.state.shapes.push(group);
        this.state.selectedShapes = [group];
    }

    ungroupSelected() {
        const groups = this.state.selectedShapes.filter(s => s.type === 'group');
        if (groups.length === 0) return;
        this.state.saveState();

        groups.forEach(group => {
            const index = this.state.shapes.indexOf(group);
            const children = group.children || [];
            children.forEach(child => {
                child.parentId = null;
                this.convertToAbsolute(child, group.x, group.y);
            });
            this.state.shapes.splice(index, 1, ...children);
        });
        this.state.selectedShapes = [];
    }

    convertToRelative(child, gx, gy) {
        child.x -= gx; child.y -= gy;
        if (child.type === 'line') { child.endX -= gx; child.endY -= gy; }
        if (child.points) {
            child.points.forEach(p => {
                p.x -= gx; p.y -= gy;
                if (p.cp1x !== undefined) { p.cp1x -= gx; p.cp1y -= gy; p.cp2x -= gx; p.cp2y -= gy; }
            });
        }
    }

    convertToAbsolute(child, gx, gy) {
        child.x += gx; child.y += gy;
        if (child.type === 'line') { child.endX += gx; child.endY += gy; }
        if (child.points) {
            child.points.forEach(p => {
                p.x += gx; p.y += gy;
                if (p.cp1x !== undefined) { p.cp1x += gx; p.cp1y += gy; p.cp2x += gx; p.cp2y += gy; }
            });
        }
    }

    copySelected() {
        if (this.state.selectedShapes.length === 0) return;
        this.clipboard = JSON.parse(JSON.stringify(this.state.selectedShapes));
    }

    paste() {
        if (!this.clipboard || this.clipboard.length === 0) return;
        this.state.saveState();
        const copies = this.clipboard.map(s => {
            // Use factory to ensure copy has all current mandatory properties
            let copy = ShapeFactory.create(s.type, {
                ...JSON.parse(JSON.stringify(s)),
                id: null, // Force new ID
                name: s.name + ' copy'
            }, this.state);
            copy = ShapeNormalizer.normalize(copy);
            
            this.state.moveShapeSilent(copy, 20, 20);
            return copy;
        });
        this.state.shapes.push(...copies);
        this.state.selectedShapes = copies;
        this.clipboard = JSON.parse(JSON.stringify(copies));
    }

    duplicateSelected() {
        if (this.state.selectedShapes.length === 0) return;
        this.state.saveState();
        const copies = this.state.selectedShapes.map(s => {
            let copy = ShapeFactory.create(s.type, {
                ...JSON.parse(JSON.stringify(s)),
                id: null,
                name: s.name + ' copy'
            }, this.state);
            copy = ShapeNormalizer.normalize(copy);
            
            this.state.moveShapeSilent(copy, 10, 10);
            return copy;
        });
        this.state.shapes.push(...copies);
        this.state.selectedShapes = copies;
    }

    async addImage(fileOrUrl, x, y) {
        let src = fileOrUrl;
        if (fileOrUrl instanceof File) {
            src = await this._readFileAsDataURL(fileOrUrl);
        }

        const img = new Image();
        img.src = src;
        await new Promise(resolve => img.onload = resolve);

        const aspectRatio = img.width / img.height;
        let width = img.width;
        let height = img.height;

        // Limit size but keep aspect ratio
        if (width > 400 || height > 400) {
            if (aspectRatio > 1) {
                width = 400;
                height = 400 / aspectRatio;
            } else {
                height = 400;
                width = 400 * aspectRatio;
            }
        }

        const shape = ShapeFactory.create('image', {
            src, x, y, width, height, aspectRatio,
            name: 'Imagem ' + (this.state.shapes.filter(s => s.type === 'image').length + 1)
        }, this.state);

        this.addShape(shape);
        return shape;
    }

    _readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

