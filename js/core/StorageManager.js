export class StorageManager {
    constructor(storageKey = 'canvas-kotlin-editor-state') {
        this.storageKey = storageKey;
    }

    save(state) {
        try {
            const data = {
                shapes: state.shapes,
                canvasSize: state.canvasSize,
                codeMode: state.codeMode,
                zoom: state.zoom,
                panX: state.panX,
                panY: state.panY
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save state to localStorage:', e);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
            return null;
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }
}
