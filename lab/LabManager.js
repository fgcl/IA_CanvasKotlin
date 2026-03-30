import { State } from '../js/core/State.js';
import { Renderer } from '../js/core/Renderer.js';
import { LayoutEngine } from '../js/core/LayoutEngine.js';
import { TestSuites } from './TestSuites.js';
import { DiagnosticRenderer } from './DiagnosticRenderer.js';
import { LabInputHandler } from './LabInputHandler.js';

class LabManager {
    constructor() {
        this.canvas = document.getElementById('lab-canvas');
        this.state = new State();
        this.renderer = new Renderer(this.canvas, this.state);
        this.activeSuite = null;
        window.lab = this;
        this.options = {
            showBounds: true,
            showPadding: true,
            showGaps: true,
            showGuides: false
        };

        this.inputHandler = new LabInputHandler(this.canvas, this);
        this.initUI();
        this.loadSuiteList();
        
        // Auto-select first suite if available
        if (TestSuites.length > 0) {
            this.selectSuite(TestSuites[0]);
        }
        
        this.log("Lab v2.0 READY.", "info");
    }

    initUI() {
        if (!this.canvas) {
            console.error("Canvas element not found!");
            return;
        }

        document.getElementById('run-test').addEventListener('click', () => this.runActiveTest());
        document.getElementById('reset-suite').addEventListener('click', () => this.resetActiveSuite());
        document.getElementById('clear-log').addEventListener('click', () => { 
            const log = document.getElementById('lab-log');
            if (log) log.innerHTML = ''; 
        });

        // Diagnostic Overlays
        ['bounds', 'padding', 'gaps', 'guides'].forEach(t => {
            const el = document.getElementById(`toggle-${t}`);
            if (el) {
                el.addEventListener('change', (e) => {
                    this.options[`show${t.charAt(0).toUpperCase() + t.slice(1)}`] = e.target.checked;
                    this.draw();
                });
            }
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                document.getElementById('assertions-container').classList.toggle('hidden', tab !== 'assertions');
                document.getElementById('properties-container').classList.toggle('hidden', tab !== 'properties');
            });
        });

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        if (!wrapper) return;
        
        const size = this.state.canvasSize || { width: 800, height: 600 };
        const dpr = window.devicePixelRatio || 1;
        
        // Force wrapper to have the Artboard size
        wrapper.style.width = size.width + 'px';
        wrapper.style.height = size.height + 'px';
        
        this.canvas.width = size.width * dpr;
        this.canvas.height = size.height * dpr;
        this.canvas.style.width = size.width + 'px';
        this.canvas.style.height = size.height + 'px';
        this.draw();
    }

    loadSuiteList() {
        const list = document.getElementById('test-suites-list');
        if (!list) return;
        list.innerHTML = '';
        TestSuites.forEach(suite => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${suite.name}</span>`;
            li.addEventListener('click', () => this.selectSuite(suite));
            list.appendChild(li);
        });
    }

    selectSuite(suite) {
        this.activeSuite = suite;
        
        // UI Navigation Update
        document.querySelectorAll('#test-suites-list li').forEach(li => li.classList.remove('active'));
        const listItems = document.querySelectorAll('#test-suites-list li');
        for (const li of listItems) {
            if (li.textContent === suite.name) li.classList.add('active');
        }

        document.getElementById('active-suite-title').textContent = suite.name;
        document.getElementById('active-suite-desc').textContent = suite.description;
        
        this.resetActiveSuite();
    }

    resetActiveSuite() {
        if (!this.activeSuite) return;
        this.state.shapes = [];
        this.activeSuite.setup(this.state);
        this.applyLogic();
        this.draw();
        this.log(`Suíte carregada: ${this.activeSuite.name}`, "success");
    }

    runActiveTest() {
        if (!this.activeSuite || !this.activeSuite.run) return;
        const msg = this.activeSuite.run(this.state);
        this.applyLogic();
        this.draw();
        if (msg) this.log(msg, "success");
    }

    applyLogic() {
        // Run recursive layout application for all groups
        const applyRecursive = (shapes) => {
            if (!shapes) return;
            shapes.forEach(shape => {
                if (!shape) return;
                if (shape.children) applyRecursive(shape.children);
                if (shape.layout && shape.type === 'group') {
                    LayoutEngine.applyLayout(shape);
                }
            });
        };
        applyRecursive(this.state.shapes);
    }

    draw() {
        if (!this.renderer) return;
        this.renderer.drawAll(this.state);
        
        // Final overlays
        const ctx = this.canvas.getContext('2d');
        DiagnosticRenderer.drawOverlays(ctx, this.state, this.options);
        
        const assertions = (this.activeSuite && this.activeSuite.assertions) ? this.activeSuite.assertions(this.state) : [];
        DiagnosticRenderer.drawAssertions(ctx, assertions, this.state);

        this.updateInspector(assertions);
    }

    updateInspector(assertions) {
        const container = document.getElementById('assertions-container');
        const properties = document.getElementById('properties-container');
        const badge = document.getElementById('suite-status-badge');
        if (!container || !badge || !properties) return;

        // 1. Assertions Tab
        if (!assertions || assertions.length === 0) {
            container.innerHTML = '<p class="empty-msg">Nenhuma asserção disponível.</p>';
            badge.className = 'badge-suite';
            badge.textContent = 'READY';
        } else {
            const allPass = assertions.every(a => a.pass);
            badge.className = `badge-suite ${allPass ? 'pass' : 'fail'}`;
            badge.textContent = allPass ? 'PASSED' : 'FAILED';

            container.innerHTML = assertions.map(a => `
                <div class="assertion-card ${a.pass ? 'pass' : 'fail'}">
                    <div class="asrt-info">
                       <div class="asrt-label">${a.label}</div>
                       <div class="asrt-details">Expected: ${a.expected} | Got: ${Math.round(a.value)}</div>
                    </div>
                    <div class="asrt-status">${a.pass ? '✅' : '❌'}</div>
                </div>
            `).join('');
        }

        // 2. Properties Tab
        const selected = this.state.selectedShapes[0];
        if (selected) {
            const c = selected.constraints || { horizontal: 'left', vertical: 'top' };
            properties.innerHTML = `
                <div class="prop-group">
                    <h4>ELEMENT</h4>
                    <div class="prop-row"><span>Type:</span> <span class="val">${selected.type}</span></div>
                    <div class="prop-row"><span>ID:</span> <span class="val">${selected.id}</span></div>
                </div>
                <div class="prop-group">
                    <h4>CONSTRAINTS</h4>
                    <div class="prop-row">
                        <span>Horizontal:</span>
                        <select class="prop-select" onchange="window.lab.updateConstraint('horizontal', this.value)">
                            <option value="left" ${c.horizontal === 'left' ? 'selected' : ''}>Left</option>
                            <option value="right" ${c.horizontal === 'right' ? 'selected' : ''}>Right</option>
                            <option value="center" ${c.horizontal === 'center' ? 'selected' : ''}>Center</option>
                            <option value="scale" ${c.horizontal === 'scale' ? 'selected' : ''}>Scale</option>
                            <option value="both" ${c.horizontal === 'both' ? 'selected' : ''}>Both (Stretch)</option>
                        </select>
                    </div>
                    <div class="prop-row">
                        <span>Vertical:</span>
                        <select class="prop-select" onchange="window.lab.updateConstraint('vertical', this.value)">
                            <option value="top" ${c.vertical === 'top' ? 'selected' : ''}>Top</option>
                            <option value="bottom" ${c.vertical === 'bottom' ? 'selected' : ''}>Bottom</option>
                            <option value="center" ${c.vertical === 'center' ? 'selected' : ''}>Center</option>
                            <option value="scale" ${c.vertical === 'scale' ? 'selected' : ''}>Scale</option>
                            <option value="both" ${c.vertical === 'both' ? 'selected' : ''}>Both (Stretch)</option>
                        </select>
                    </div>
                </div>
            `;
        } else {
            properties.innerHTML = '<p class="empty-msg">Nenhum elemento selecionado.</p>';
        }
    }

    updateConstraint(axis, value) {
        const selected = this.state.selectedShapes[0];
        if (!selected) return;
        if (!selected.constraints) selected.constraints = { horizontal: 'left', vertical: 'top' };
        selected.constraints[axis] = value;
        this.draw();
    }

    log(msg, type = "info") {
        const logContainer = document.getElementById('lab-log');
        if (!logContainer) return;
        const div = document.createElement('div');
        div.className = `log-msg log-${type}`;
        const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        div.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
        logContainer.prepend(div);
    }
}

// Instantiate and catch errors
const manager = new LabManager();
window.addEventListener('error', (e) => manager.log(`SCRIPT ERROR: ${e.message}`, "error"));
