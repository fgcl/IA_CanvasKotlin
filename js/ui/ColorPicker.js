export class ColorPicker {
    static presets = [
        '#ffffff', '#000000', '#3b82f6', '#ef4444', '#22c55e',
        '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
    ];

    constructor(containerId, initialColor, onColorChange) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.color = initialColor || '#ffffff';
        this.onColorChange = onColorChange;
        this.isOpen = false;
        this.isSubOpen = false;
        
        // Color history
        this.history = JSON.parse(localStorage.getItem(`color-history-${containerId}`)) || [];
        
        // HSV state for custom palette
        this.h = 0; this.s = 100; this.v = 100;
        this.updateHSVFromColor(this.color);

        this.renderStructure();
        this.bindElements();
        this.setupEventListeners();
        this.setupCustomPalette();
        this.updateColor(this.color, false);
    }

    renderStructure() {
        this.container.innerHTML = `<div class="color-picker-wrapper"><div class="color-trigger"><div class="color-preview"></div><span class="color-hex"></span></div></div>`;
        
        // Small Main Popover
        this.popover = document.createElement('div');
        this.popover.className = `color-popover glass hidden cp-main-${this.containerId}`;
        this.popover.innerHTML = `
            <div class="popover-content">
                <h4 class="color-section-title">Base</h4>
                <div class="color-grid presets-grid">
                    <div class="color-swatch transparent-swatch" data-color="transparent" title="Nenhuma"></div>
                    ${ColorPicker.presets.map(c => `<div class="color-swatch" style="background-color: ${c}" data-color="${c}"></div>`).join('')}
                </div>
                
                <h4 class="color-section-title history-title ${this.history.length === 0 ? 'hidden' : ''}">Recentes</h4>
                <div class="color-grid history-grid"></div>

                <h4 class="color-section-title">Tons</h4>
                <div class="color-grid shades-grid"></div>
                
                <div class="color-input-row" style="margin-top: 8px;">
                    <input type="text" class="color-hex-input" maxlength="7">
                    <div class="color-swatch custom-trigger" title="Painel Completo">+</div>
                </div>
            </div>
        `;
        document.body.appendChild(this.popover);

        // Nested/Lateral Sub Popover
        this.subPopover = document.createElement('div');
        this.subPopover.className = `color-popover sub-popover glass hidden cp-sub-${this.containerId}`;
        this.subPopover.innerHTML = `
            <div class="custom-palette-area">
                <div class="saturation-box">
                    <div class="saturation-cursor"></div>
                </div>
                <div class="hue-slider-container">
                    <div class="hue-slider"><div class="hue-cursor"></div></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.subPopover);
    }

    bindElements() {
        this.trigger = this.container.querySelector('.color-trigger');
        this.preview = this.container.querySelector('.color-preview');
        this.hexLabel = this.container.querySelector('.color-hex');
        
        this.hexInput = this.popover.querySelector('.color-hex-input');
        this.shadesGrid = this.popover.querySelector('.shades-grid');
        this.historyGrid = this.popover.querySelector('.history-grid');
        this.historyTitle = this.popover.querySelector('.history-title');
        this.customBtn = this.popover.querySelector('.custom-trigger');
        
        this.satBox = this.subPopover.querySelector('.saturation-box');
        this.satCursor = this.satBox.querySelector('.saturation-cursor');
        this.hueSlider = this.subPopover.querySelector('.hue-slider');
        this.hueCursor = this.hueSlider.querySelector('.hue-cursor');
    }

    setupEventListeners() {
        this.trigger.onclick = (e) => { e.stopPropagation(); this.toggle(); };
        
        this.customBtn.onclick = (e) => {
            e.stopPropagation();
            this.isSubOpen = !this.isSubOpen;
            this.subPopover.classList.toggle('hidden', !this.isSubOpen);
            if (this.isSubOpen) this.updatePosition();
        };

        this.popover.onclick = (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch && !swatch.classList.contains('custom-trigger')) {
                this.updateColor(swatch.dataset.color, true, true, true);
                this.close();
            }
            e.stopPropagation();
        };

        this.subPopover.onclick = (e) => e.stopPropagation();

        this.hexInput.onchange = (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val)) this.updateColor(val, true, true, true);
        };

        document.addEventListener('mousedown', (e) => {
            if (this.isOpen && !this.container.contains(e.target) && !this.popover.contains(e.target) && !this.subPopover.contains(e.target)) {
                this.close();
            }
        });
    }

    setupCustomPalette() {
        const handleDrag = (el, fn, onEnd) => {
            const onMove = (e) => { if (this.isSubOpen) fn(e); };
            const onUp = () => { 
                window.removeEventListener('mousemove', onMove); 
                window.removeEventListener('mouseup', onUp);
                if (onEnd) onEnd();
            };
            el.onmousedown = (e) => { 
                fn(e); 
                window.addEventListener('mousemove', onMove); 
                window.addEventListener('mouseup', onUp); 
            };
        };

        handleDrag(this.satBox, (e) => {
            const rect = this.satBox.getBoundingClientRect();
            this.s = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            this.v = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
            this.updateFromHSV(true, false);
        }, () => this.saveToHistory(this.color));

        handleDrag(this.hueSlider, (e) => {
            const rect = this.hueSlider.getBoundingClientRect();
            this.h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
            this.updateFromHSV(true, false);
        }, () => this.saveToHistory(this.color));
    }

    updateFromHSV(triggerChange = false, saveHistory = false) {
        const rgb = this.hsvToRgb(this.h / 360, this.s / 100, this.v / 100);
        const hex = this.rgbToHex(rgb[0], rgb[1], rgb[2]);
        this.updateColor(hex, triggerChange, false, saveHistory);
    }

    updateHSVFromColor(hex) {
        if (hex === 'transparent') return;
        const rgb = this.hexToRgb(hex); if (!rgb) return;
        const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
        this.h = hsv.h * 360; this.s = hsv.s * 100; this.v = hsv.v * 100;
    }

    saveToHistory(color) {
        if (color === 'transparent' || this.history.includes(color)) return;
        this.history.unshift(color);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem(`color-history-${this.containerId}`, JSON.stringify(this.history));
        this.updateHistoryUI();
    }

    updateHistoryUI() {
        if (this.history.length > 0) {
            this.historyTitle.classList.remove('hidden');
            this.historyGrid.innerHTML = this.history.map(c => `<div class="color-swatch" style="background-color: ${c}" data-color="${c}"></div>`).join('');
        }
    }

    setColor(color) {
        this.updateColor(color, false);
    }

    updateColor(color, triggerChange = true, updateHSV = true, saveHistory = false) {
        if (this.color === color) return;
        
        this.color = color;
        if (updateHSV && color !== 'transparent') this.updateHSVFromColor(color);
        
        const isNone = color === 'transparent';
        this.preview.style.backgroundColor = isNone ? 'transparent' : color;
        this.preview.classList.toggle('transparent-preview', isNone);
        this.hexLabel.textContent = isNone ? 'Nenhum' : color.toUpperCase();
        this.hexInput.value = isNone ? '' : color.toUpperCase();

        if (this.isOpen) {
            this.updateShadesUI();
            this.updateCursors();
            if (saveHistory) this.saveToHistory(color);
        }

        if (triggerChange && this.onColorChange) this.onColorChange(color);
    }

    updateCursors() {
        this.satCursor.style.left = `${this.s}%`;
        this.satCursor.style.top = `${100 - this.v}%`;
        this.hueCursor.style.left = `${(this.h / 360) * 100}%`;
        const baseRgb = this.hsvToRgb(this.h / 360, 1, 1);
        this.satBox.style.backgroundColor = this.rgbToHex(baseRgb[0], baseRgb[1], baseRgb[2]);
    }

    updateShadesUI() {
        if (this.color === 'transparent') { this.shadesGrid.innerHTML = ''; return; }
        const rgb = this.hexToRgb(this.color);
        const shades = [0.4, 0.6, 0.8, 1, 1.2, 1.4].map(m => {
            return this.rgbToHex(Math.max(0, Math.min(255, rgb.r * m)), Math.max(0, Math.min(255, rgb.g * m)), Math.max(0, Math.min(255, rgb.b * m)));
        });
        this.shadesGrid.innerHTML = shades.map(s => `<div class="color-swatch" style="background-color: ${s}" data-color="${s}"></div>`).join('');
    }

    hsvToRgb(h, s, v) {
        let r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break; case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break; case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break; case 5: r = v, g = p, b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    rgbToHsv(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b), h, s, v = max, d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) h = 0; else {
            switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
            h /= 6;
        }
        return { h, s, v };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    }

    rgbToHex(r, g, b) { return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase(); }

    toggle() { if (this.isOpen) this.close(); else this.open(); }
    openAt(rect) { if (this.isOpen) this.close(); this.externalRect = rect; this.open(); }
    open() { 
        this.popover.classList.remove('hidden'); this.isOpen = true; this.isSubOpen = false; this.subPopover.classList.add('hidden');
        this.updatePosition(); this.updateShadesUI(); this.updateHistoryUI(); this.updateCursors();
        this._onScroll = () => this.updatePosition();
        window.addEventListener('scroll', this._onScroll, true); window.addEventListener('resize', this._onScroll);
    }
    close() { 
        this.popover.classList.add('hidden'); this.subPopover.classList.add('hidden'); this.isOpen = false; this.isSubOpen = false; this.externalRect = null;
        window.removeEventListener('scroll', this._onScroll, true); window.removeEventListener('resize', this._onScroll);
    }

    updatePosition() {
        if (!this.isOpen) return;
        const rect = this.externalRect || this.trigger.getBoundingClientRect();
        const pW = 220; const pH = 350; const sW = 260; const gap = 12;

        let left = rect.right + gap; let top = rect.top;
        if (left + pW > window.innerWidth) left = rect.left - pW - gap;
        if (top + pH > window.innerHeight) top = window.innerHeight - pH - 16;
        this.popover.style.top = `${Math.max(16, top)}px`; this.popover.style.left = `${Math.max(16, left)}px`;

        if (this.isSubOpen) {
            const m = this.popover.getBoundingClientRect();
            let sL = m.right + gap; if (sL + sW > window.innerWidth) sL = m.left - sW - gap;
            this.subPopover.style.top = `${m.top}px`; this.subPopover.style.left = `${sL}px`;
        }
    }
}
