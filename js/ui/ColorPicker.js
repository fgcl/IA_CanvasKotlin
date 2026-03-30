export class ColorPicker {
    static presets = [
        '#000000', '#1e293b', '#475569', '#94a3b8', '#cbd5e1', '#f1f5f9', '#ffffff', '#d97706', '#059669', '#2563eb',
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
    ];

    constructor(containerId, initialColor, onColorChange) {
        this.container = document.getElementById(containerId);
        this.onColorChange = onColorChange;
        this.color = (initialColor || '#000000').toUpperCase();
        this.history = JSON.parse(localStorage.getItem('color-picker-history') || '[]');
        this.isOpen = false;
        this.init();
    }

    init() {
        this.renderStructure();
        this.bindElements();
        this.setupEventListeners();
        this.updateColor(this.color, false);
    }

    renderStructure() {
        this.container.innerHTML = `
            <div class="color-picker-wrapper">
                <div class="color-trigger">
                    <div class="color-preview"></div>
                    <span class="color-hex"></span>
                </div>
                <div class="color-popover hidden">
                    <h4 class="color-section-title">Cores Base</h4>
                    <div class="color-grid presets-grid">
                        <div class="color-swatch transparent-swatch" data-color="transparent" title="Nenhuma"></div>
                        ${ColorPicker.presets.map(c => `<div class="color-swatch" style="background-color: ${c}" data-color="${c}"></div>`).join('')}
                    </div>
                    
                    <h4 class="color-section-title">Tons da Cor Ativa</h4>
                    <div class="color-grid shades-grid"></div>
                    
                    <div class="history-section hidden">
                        <h4 class="color-section-title">Recentes</h4>
                        <div class="color-grid history-grid"></div>
                    </div>

                    <div class="color-input-row">
                        <input type="text" class="color-hex-input" maxlength="7">
                        <div class="color-swatch custom-trigger" title="Seletor Nativo">+</div>
                        <input type="color" class="native-color-input" style="display:none">
                    </div>
                </div>
            </div>
        `;
    }

    bindElements() {
        this.wrapper = this.container.querySelector('.color-picker-wrapper');
        this.trigger = this.container.querySelector('.color-trigger');
        this.popover = this.container.querySelector('.color-popover');
        this.preview = this.container.querySelector('.color-preview');
        this.hexLabel = this.container.querySelector('.color-hex');
        this.hexInput = this.container.querySelector('.color-hex-input');
        this.nativeInput = this.container.querySelector('.native-color-input');
        this.customBtn = this.container.querySelector('.custom-trigger');
        this.historySection = this.container.querySelector('.history-section');
        this.historyGrid = this.container.querySelector('.history-grid');
        this.shadesGrid = this.container.querySelector('.shades-grid');
    }

    setupEventListeners() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        this.container.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch && !swatch.classList.contains('custom-trigger')) {
                this.updateColor(swatch.dataset.color, true);
                if (swatch.closest('.shades-grid') || swatch.closest('.history-grid') || swatch.closest('.presets-grid')) {
                    this.close();
                }
            }
        });

        this.customBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nativeInput.click();
        });

        this.nativeInput.addEventListener('input', (e) => {
            this.updateColor(e.target.value, false);
        });

        this.nativeInput.addEventListener('change', (e) => {
            this.updateColor(e.target.value, true);
        });

        this.hexInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (val.length >= 6) {
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    this.updateColor(val, false);
                }
            }
        });

        this.hexInput.addEventListener('change', (e) => {
            let val = e.target.value;
            if (val.length >= 6) {
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    this.updateColor(val, true);
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });
    }

    updateColor(color, addToHistory = false) {
        if (!color) return;
        this.color = color.toLowerCase() === 'transparent' ? 'transparent' : color.toUpperCase();
        
        if (addToHistory && this.color !== 'transparent') this.addToHistory(this.color);
        
        if (this.color === 'transparent') {
            this.preview.style.backgroundColor = 'transparent';
            this.preview.classList.add('transparent-preview');
            this.hexLabel.textContent = 'Nenhum';
            this.hexInput.value = '';
        } else {
            this.preview.style.backgroundColor = this.color;
            this.preview.classList.remove('transparent-preview');
            this.hexLabel.textContent = this.color;
            this.hexInput.value = this.color;
        }
        
        this.updateShadesUI();
        this.updateHistoryUI();

        this.onColorChange(this.color);
    }

    setColor(color) {
        if (!color) return;
        this.color = color.toLowerCase() === 'transparent' ? 'transparent' : color.toUpperCase();
        
        if (this.color === 'transparent') {
            this.preview.style.backgroundColor = 'transparent';
            this.preview.classList.add('transparent-preview');
            this.hexLabel.textContent = 'Nenhum';
            this.hexInput.value = '';
        } else {
            this.preview.style.backgroundColor = this.color;
            this.preview.classList.remove('transparent-preview');
            this.hexLabel.textContent = this.color;
            this.hexInput.value = this.color;
        }
        this.updateShadesUI();
        this.updateHistoryUI();
    }

    addToHistory(color) {
        if (color === 'transparent') return;
        if (ColorPicker.presets.some(c => c.toUpperCase() === color.toUpperCase())) return;
        this.history = [color, ...this.history.filter(c => c !== color)].slice(0, 5);
        localStorage.setItem('color-picker-history', JSON.stringify(this.history));
    }

    updateShadesUI() {
        if (this.color === 'transparent') {
            if (this.shadesGrid) this.shadesGrid.innerHTML = '';
            return;
        }
        const shades = this.generateShades(this.color);
        if (this.shadesGrid) {
            this.shadesGrid.innerHTML = shades.map(c => `<div class="color-swatch" style="background-color: ${c}" data-color="${c}"></div>`).join('');
        }
    }

    updateHistoryUI() {
        if (this.history.length > 0 && this.historyGrid) {
            this.historySection.classList.remove('hidden');
            this.historyGrid.innerHTML = this.history.map(c => `<div class="color-swatch" style="background-color: ${c}" data-color="${c}"></div>`).join('');
        } else if (this.historySection) {
            this.historySection.classList.add('hidden');
        }
    }

    generateShades(hex) {
        const hsl = this.hexToHSL(hex);
        const steps = [-30, -15, 0, 15, 30]; 
        return steps.map(step => {
            const l = Math.max(0, Math.min(100, hsl.l + step));
            return this.hslToHex(hsl.h, hsl.s, l);
        });
    }

    hexToHSL(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;
        if (isNaN(r) || isNaN(g) || isNaN(b)) return { h: 0, s: 0, l: 0 };
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToHex(h, s, l) {
        l /= 100; s /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    toggle() { if (this.isOpen) this.close(); else this.open(); }
    open() { 
        this.popover.classList.remove('hidden'); 
        this.isOpen = true; 
        this.updateShadesUI();
        this.updateHistoryUI();
    }
    close() { if (this.popover) this.popover.classList.add('hidden'); this.isOpen = false; }
}
