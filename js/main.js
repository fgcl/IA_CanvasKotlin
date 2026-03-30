import { State } from './core/State.js';
import { Renderer } from './core/Renderer.js';
import { CodeGenerator } from './core/CodeGenerator.js';
import { HtmlGenerator } from './core/HtmlGenerator.js';
import { Toolbar } from './ui/Toolbar.js';
import { PropertyEditor } from './ui/PropertyEditor.js';
import { LayersPanel } from './ui/LayersPanel.js';
import { InputHandler } from './core/InputHandler.js';
import { IconPicker } from './ui/IconPicker.js';
import { ColorPicker } from './ui/ColorPicker.js';
import { TextEditorController } from './ui/TextEditorController.js';
import { StorageManager } from './core/StorageManager.js';
import { IconLibrary } from './core/IconLibrary.js';
import { ContextToolbar } from './ui/ContextToolbar.js';
import { Timeline } from './ui/Timeline.js';
import { LayoutEngine } from './core/LayoutEngine.js';
import { UIManager } from './ui/UIManager.js';

import { CodeViewer } from './ui/CodeViewer.js';
import { AddComponentMenu } from './ui/AddComponentMenu.js';

const storage = new StorageManager();

const canvas = document.getElementById('main-canvas');
const generatedCode = document.getElementById('generated-code');
const codeViewer = new CodeViewer('code-container-wrapper');
codeViewer.onToggle = () => updateCode();
codeViewer.onLanguageChange = (lang) => {
    state.selectedLanguage = lang;
    updateCode();
};
const toolBtns = document.querySelectorAll('.tool-btn');
const clearBtn = document.getElementById('clear-canvas');
const copyBtn = document.getElementById('copy-code');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const alignBtns = document.querySelectorAll('.align-btn');

const canvasWidthInput = document.getElementById('canvas-width');
const canvasHeightInput = document.getElementById('canvas-height');
const canvasPresets = document.getElementById('canvas-presets');
const responsiveCodeToggle = document.getElementById('responsive-code');

const leftSidebar = document.getElementById('left-sidebar');
const rightSidebar = document.getElementById('right-sidebar');
const toggleLeftBtn = document.getElementById('toggle-left-sidebar');
const toggleRightBtn = document.getElementById('toggle-right-sidebar');
const settingsToggle = document.getElementById('canvas-settings-toggle');
const settingsPopup = document.getElementById('canvas-settings-popup');
const leftPullBtn = document.getElementById('left-sidebar-pull');
const rightPullBtn = document.getElementById('right-sidebar-pull');

// Initialization
const state = new State();
const renderer = new Renderer(canvas, state);

// Load state from Storage
const savedData = storage.load();
if (savedData) {
    state.shapes = savedData.shapes || [];
    state.canvasSize = savedData.canvasSize || state.canvasSize;
    state.codeMode = savedData.codeMode || 'absolute';
    state.selectedLanguage = savedData.selectedLanguage || 'kotlin';
    state.zoom = savedData.zoom || 1;
    state.panX = savedData.panX || 0;
    state.panY = savedData.panY || 0;
    
    // Update UI inputs from saved state
    if (canvasWidthInput) canvasWidthInput.value = state.canvasSize.width;
    if (canvasHeightInput) canvasHeightInput.value = state.canvasSize.height;
    if (responsiveCodeToggle) responsiveCodeToggle.checked = state.codeMode === 'responsive';
}

// Components Initialization
const fillColorPicker = new ColorPicker('fill-color-picker', '#6200EE', (color) => {
    handleColorChange('fillColor')(color);
});
const strokeColorPicker = new ColorPicker('stroke-color-picker', '#03DAC6', (color) => {
    handleColorChange('strokeColor')(color);
});

const iconPicker = new IconPicker((iconName) => {
    if (state.selectedShapes.length === 1 && state.selectedShapes[0].type === 'icon') {
        state.saveState();
        state.selectedShapes[0].iconName = iconName;
        updateCode(); redraw();
    }
    state.lastSelectedIcon = iconName;
});

const propertyEditor = new PropertyEditor({
    strokeWidth: document.getElementById('stroke-width'),
    strokeWidthInput: document.getElementById('stroke-width-input'),
    opacity: document.getElementById('opacity'),
    opacityInput: document.getElementById('opacity-input'),
    useFill: document.getElementById('use-fill'),
    useStroke: document.getElementById('use-stroke'),
    textContent: document.getElementById('text-content'),
    fontSize: document.getElementById('font-size'),
    textProps: document.getElementById('text-props'),
    cornerRadius: document.getElementById('corner-radius'),
    cornerRadiusInput: document.getElementById('corner-radius-input'),
    rectProps: document.getElementById('rect-props'),
    iconProps: document.getElementById('icon-props'),
    geoX: document.getElementById('geo-x'),
    geoY: document.getElementById('geo-y'),
    geoW: document.getElementById('geo-w'),
    geoH: document.getElementById('geo-h'),
    geometryProps: document.getElementById('geometry-props'),
    layoutType: document.getElementById('layout-toggle-group'),
    layoutGap: document.getElementById('layout-gap'),
    layoutPadding: document.getElementById('layout-padding'),
    layoutProps: document.getElementById('layout-props'),
    constraintH: document.getElementById('constraint-h-group'),
    constraintV: document.getElementById('constraint-v-group'),
    constraintsProps: document.getElementById('constraints-props')
}, fillColorPicker, strokeColorPicker, state, (props) => {
    if (state.selectedShapes.length > 0) {
        state.saveState();
        state.selectedShapes.forEach(shape => {
            const oldVals = {};
            Object.keys(props).forEach(p => oldVals[p] = shape[p]);
            
            if (props.isGeometry) {
                const { x, y, width, height } = props;
                const oldW = shape.width, oldH = shape.height;
                if (x !== undefined) {
                    const dx = x - shape.x;
                    state.moveShape(shape, dx, 0);
                }
                if (y !== undefined) {
                    const dy = y - shape.y;
                    state.moveShape(shape, 0, dy);
                }
                if (width !== undefined && shape.type !== 'text') {
                    if (shape.type === 'line') shape.endX = shape.x + width;
                    else shape.width = width;
                }
                if (height !== undefined && shape.type !== 'text') {
                    if (shape.type === 'line') shape.endY = shape.y + height;
                    else shape.height = height;
                }
                // Trigger constraints if size changed
                if ((width !== undefined || height !== undefined) && shape.children) {
                    LayoutEngine.applyConstraints(shape, oldW, oldH, state.transformManager);
                }
            } else {
                Object.assign(shape, props);
                // Trigger layout if layout properties changed
                if (props.layout && shape.type === 'group') {
                    LayoutEngine.applyLayout(shape);
                }
            }
            state.syncKeyframes(shape, Object.keys(props), oldVals);
        });
        updateCode(); redraw();
    }
});

const layersPanel = new LayersPanel('layers-panel', state, () => {
    redraw(); updateCode();
});

const toolbar = new Toolbar(toolBtns, (tool) => {
    if (state.isBezierDrawing && state.currentShape && state.currentShape.points.length > 1) {
        state.addShape(state.currentShape);
        updateCode();
    }
    state.isBezierDrawing = false; state.currentShape = null;
    state.setTool(tool);
    
    if (tool === 'icon') {
        iconPicker.show(state.lastSelectedIcon || 'Favorite');
    }
    
    redraw();
});

const textEditor = new TextEditorController();
const contextToolbar = new ContextToolbar(state, () => {
    redraw(); updateCode();
});

const timeline = new Timeline({
    playPauseBtn: document.getElementById('play-pause-btn'),
    stopBtn: document.getElementById('stop-btn'),
    timeDisplay: document.getElementById('current-time-display'),
    durationInput: document.getElementById('duration-input'),
    loopBtn: document.getElementById('loop-btn'),
    addKfBtn: document.getElementById('timeline-add-kf'),
    labelsContainer: document.getElementById('timeline-labels'),
    tracksContainer: document.getElementById('timeline-tracks'),
    ruler: document.getElementById('timeline-ruler'),
    cursor: document.getElementById('timeline-cursor'),
    scrollContainer: document.getElementById('timeline-scroll')
}, state, () => {
    redraw();
});

const addComponentMenu = new AddComponentMenu(state, (componentType) => {
    state.setTool('add-component');
    state.currentComponentType = componentType;
    // Visually indicate tool change
    toolBtns.forEach(btn => btn.classList.remove('active'));
});

// Cross-component links
propertyEditor.onOpenPicker = (current) => iconPicker.show(current);

// UI Logic Functions
function updateCode() {
    if (!codeViewer) return;
    
    let code = "";
    if (state.selectedLanguage === 'html') {
        code = HtmlGenerator.generate(state.shapes, state.canvasSize);
    } else {
        code = CodeGenerator.generate(state.shapes, state.canvasSize, state.codeMode);
    }
    
    codeViewer.update(code, state.selectedLanguage);
    state.lastGeneratedCode = code; // Cache for copying
    if (storage) storage.save(state);
}

function redraw() {
    if (renderer) renderer.drawAll(state);
    if (layersPanel) layersPanel.render();
    if (contextToolbar) contextToolbar.update(canvas);
    if (timeline) timeline.render();
    if (uiManager) uiManager.updateSidebarVisibility();
    updateZoomUI();
    if (storage) storage.save(state);
}

function updateZoomUI() {
    const zoomLevelEl = document.getElementById('zoom-level');
    if (zoomLevelEl) zoomLevelEl.textContent = Math.round(state.zoom * 100) + '%';
}

function handleColorChange(prop) {
    return (color) => {
        if (state.selectedShapes.length > 0) {
            state.saveState();
            const isNone = color === 'transparent';
            const useProp = prop === 'fillColor' ? 'useFill' : 'useStroke';
            state.selectedShapes.forEach(s => {
                const oldVal = s[prop];
                const oldUse = s[useProp];
                s[prop] = color;
                s[useProp] = !isNone;
                state.syncKeyframes(s, [prop, useProp], { [prop]: oldVal, [useProp]: oldUse });
            });
            updateCode(); redraw();
        }
    };
}

// Input Handling Delegation
// Input Handling Delegation
const inputHandler = new InputHandler(canvas, state, renderer, propertyEditor, toolbar, layersPanel, updateCode, redraw, textEditor);

const uiManager = new UIManager({
    state,
    canvas,
    renderer,
    timeline,
    updateCode,
    redraw
});

export { state, renderer, updateCode, redraw };

window.addEventListener('resize', () => { uiManager.resizeCanvas(); uiManager.updateSidebarWidthVar(); });
uiManager.resizeCanvas(true);
uiManager.updateSidebarWidthVar();
updateCode();
