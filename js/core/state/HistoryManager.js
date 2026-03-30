export class HistoryManager {
    constructor(state) {
        this.state = state;
        this.undoStack = [];
        this.redoStack = [];
    }

    saveState() {
        // Deep copy of shapes to preserve history
        const snapshot = JSON.parse(JSON.stringify(this.state.shapes));
        this.undoStack.push(snapshot);
        this.redoStack = [];
        if (this.undoStack.length > 50) this.undoStack.shift();
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        this.redoStack.push(JSON.parse(JSON.stringify(this.state.shapes)));
        this.state.shapes = this.undoStack.pop();
        this.state.selectedShapes = [];
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        this.undoStack.push(JSON.parse(JSON.stringify(this.state.shapes)));
        this.state.shapes = this.redoStack.pop();
        this.state.selectedShapes = [];
        return true;
    }
}
