import { LayoutEngine } from '../core/LayoutEngine.js';

export class PropertyEditor {
    constructor(elements, fillColorPicker, strokeColorPicker, state, onChange) {
        this.elements = elements;
        this.fillColorPicker = fillColorPicker;
        this.strokeColorPicker = strokeColorPicker;
        this.state = state;
        this.onChange = onChange;
        this.init();
    }

    init() {
        const { strokeWidth, strokeWidthInput, opacity, opacityInput, 
                textContent, fontSize, cornerRadius, cornerRadiusInput,
                geoX, geoY, geoW, geoH, iconName } = this.elements;

        const watch = (el, prop, mapper = (v) => v) => {
            if (!el) return;
            


            el.addEventListener('input', (e) => {
                const val = mapper(e.target.value);
                if (prop !== 'text' && isNaN(val)) return;
                
                // Sync numeric input if exists
                if (prop === 'strokeWidth' && strokeWidthInput) strokeWidthInput.value = val;
                if (prop === 'opacity' && opacityInput) opacityInput.value = Math.round(val * 100);
                if (prop === 'cornerRadius' && cornerRadiusInput) cornerRadiusInput.value = val;
                
                this.onChange({ [prop]: val });
            });

            // Add listener to numeric input for bi-directional sync
            let linkedInput = null;
            if (prop === 'strokeWidth') linkedInput = strokeWidthInput;
            if (prop === 'opacity') linkedInput = opacityInput;
            if (prop === 'cornerRadius') linkedInput = cornerRadiusInput;

            if (linkedInput) {
                linkedInput.addEventListener('input', (e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) return;
                    
                    // Clamp values
                    if (prop === 'strokeWidth') val = Math.max(0, Math.min(20, val));
                    if (prop === 'opacity') val = Math.max(0, Math.min(100, val));
                    if (prop === 'cornerRadius') val = Math.max(0, Math.min(100, val));

                    // Sync slider
                    if (prop === 'opacity') {
                        el.value = val;
                        this.onChange({ [prop]: val / 100 });
                    } else {
                        el.value = val;
                        this.onChange({ [prop]: val });
                    }
                });
            }
        };

        const watchGeo = (el, prop) => {
            if (!el) return;
            el.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val)) return;
                this.onChange({ [prop]: val, isGeometry: true });
            });
        };

        watch(strokeWidth, 'strokeWidth', (v) => parseInt(v));
        watch(opacity, 'opacity', (v) => parseInt(v) / 100);
        watch(textContent, 'text');
        watch(fontSize, 'fontSize', (v) => parseInt(v));
        watch(cornerRadius, 'cornerRadius', (v) => parseInt(v));
        watch(iconName, 'iconName');

        watchGeo(geoX, 'x'); watchGeo(geoY, 'y');
        watchGeo(geoW, 'width'); watchGeo(geoH, 'height');

        // Layout Listeners (Toggle Groups)
        const { layoutType, layoutGap, layoutPadding, constraintH, constraintV } = this.elements;
        if (layoutType) {
            layoutType.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!this.currentShape) return;
                    const value = btn.dataset.value;
                    this.onChange({ layout: { ...(this.currentShape.layout || {}), type: value } });
                    this.updateToggleInternal(layoutType, value);
                });
            });
        }
        if (layoutGap) layoutGap.addEventListener('input', (e) => {
            if (!this.currentShape) return;
            this.onChange({ layout: { ...(this.currentShape.layout || {}), gap: parseInt(e.target.value) || 0 } });
        });
        if (layoutPadding) layoutPadding.addEventListener('input', (e) => {
            if (!this.currentShape) return;
            this.onChange({ layout: { ...(this.currentShape.layout || {}), padding: parseInt(e.target.value) || 0 } });
        });

        // Constraints Listeners (Toggle Groups)
        if (constraintH) {
            constraintH.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!this.currentShape) return;
                    const value = btn.dataset.value;
                    this.onChange({ constraints: { ...(this.currentShape.constraints || {}), horizontal: value } });
                    this.updateToggleInternal(constraintH, value);
                });
            });
        }
        if (constraintV) {
            constraintV.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!this.currentShape) return;
                    const value = btn.dataset.value;
                    this.onChange({ constraints: { ...(this.currentShape.constraints || {}), vertical: value } });
                    this.updateToggleInternal(constraintV, value);
                });
            });
        }

        // Keyframe Toggle Listeners
        document.querySelectorAll('.kf-toggle').forEach(kf => {
            kf.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const prop = kf.dataset.prop;
                if (prop) this.toggleKeyframe(prop);
            });
        });
    }

    updateToggleInternal(parent, value) {
        parent.querySelectorAll('.toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === value);
        });
    }

    update(shape) {
        if (!shape) return;
        const { strokeWidth, strokeWidthInput, opacity, opacityInput, 
                textContent, fontSize, textProps, cornerRadius, cornerRadiusInput, rectProps,
                geoX, geoY, geoW, geoH, geometryProps } = this.elements;
        
        if (this.fillColorPicker) {
            this.fillColorPicker.setColor(shape.useFill === false ? 'transparent' : (shape.fillColor || '#000000'));
        }
        if (this.strokeColorPicker) {
            this.strokeColorPicker.setColor(shape.useStroke === false ? 'transparent' : (shape.strokeColor || '#000000'));
        }
        
        if (strokeWidth) strokeWidth.value = shape.strokeWidth || 0;
        if (strokeWidthInput) strokeWidthInput.value = shape.strokeWidth || 0;
        if (opacity) opacity.value = (shape.opacity || 0) * 100;
        if (opacityInput) opacityInput.value = Math.round((shape.opacity || 0) * 100);

        if (geometryProps) {
            geometryProps.classList.remove('hidden');
            if (geoX) geoX.value = Math.round(shape.x);
            if (geoY) geoY.value = Math.round(shape.y);
            if (geoW) geoW.value = Math.round(shape.width || 0);
            if (geoH) geoH.value = Math.round(shape.height || 0);

            if (shape.type === 'line') {
                if (geoW) geoW.value = Math.round(Math.abs(shape.x - shape.endX));
                if (geoH) geoH.value = Math.round(Math.abs(shape.y - shape.endY));
            } else if (shape.type === 'text') {
                if (geoW) geoW.disabled = true; if (geoH) geoH.disabled = true;
            } else {
                if (geoW) geoW.disabled = false; if (geoH) geoH.disabled = false;
            }
        }

        if (textProps) {
            if (['text', 'button', 'input'].includes(shape.type)) {
                textProps.classList.remove('hidden');
                if (textContent) textContent.value = shape.text || '';
                if (fontSize) fontSize.value = shape.fontSize || 16;
            } else { textProps.classList.add('hidden'); }
        }

        if (rectProps) {
            if (['rect', 'button', 'input'].includes(shape.type)) {
                rectProps.classList.remove('hidden');
                if (cornerRadius) cornerRadius.value = shape.cornerRadius || 0;
                if (cornerRadiusInput) cornerRadiusInput.value = shape.cornerRadius || 0;
            } else { rectProps.classList.add('hidden'); }
        }

        if (this.elements.iconProps) {
            if (shape.type === 'icon') {
                this.elements.iconProps.classList.remove('hidden');
                
                let pickerBtn = this.elements.iconProps.querySelector('.btn-change-icon');
                if (!pickerBtn) {
                    pickerBtn = document.createElement('button');
                    pickerBtn.className = 'btn btn-sm btn-primary btn-change-icon';
                    pickerBtn.style.marginTop = '8px';
                    pickerBtn.style.width = '100%';
                    this.elements.iconProps.appendChild(pickerBtn);
                }
                pickerBtn.textContent = `Ícone: ${shape.iconName || 'Favorite'} (Alterar...)`;
                pickerBtn.onclick = () => {
                    if (this.onOpenPicker) this.onOpenPicker(shape.iconName);
                };
            } else { this.elements.iconProps.classList.add('hidden'); }
        }

        this.currentShape = shape;
        const { layoutType, layoutGap, layoutPadding, constraintH, constraintV, layoutProps, constraintsProps } = this.elements;
        
        if (layoutProps) {
            if (shape.type === 'group') {
                layoutProps.classList.remove('hidden');
                this.updateToggleInternal(layoutType, shape.layout?.type || 'none');
                if (layoutGap) layoutGap.value = shape.layout?.gap || 0;
                if (layoutPadding) layoutPadding.value = shape.layout?.padding || 0;
            } else {
                layoutProps.classList.add('hidden');
            }
        }

        if (constraintsProps) {
            // Show constraints if it has a parent OR if it's a top-level group
            // (Actually, in modern design tools, even top-level elements have constraints relative to the artboard)
            constraintsProps.classList.remove('hidden');
            this.updateToggleInternal(constraintH, shape.constraints?.horizontal || 'left');
            this.updateToggleInternal(constraintV, shape.constraints?.vertical || 'top');
        }

        this.updateKfStates(shape);
    }

    updateKfStates(shape) {
        if (!shape) return;
        const kfToggles = document.querySelectorAll('.kf-toggle');
        kfToggles.forEach(kf => {
            const prop = kf.dataset.prop;
            if (!prop) return;

            const hasKf = shape.keyframes && shape.keyframes[prop] && 
                          shape.keyframes[prop].some(k => Math.abs(k.time - this.state.currentTime) < 10);
            
            kf.classList.toggle('active', !!hasKf);
        });
    }

    toggleKeyframe(prop) {
        if (!this.currentShape) return;
        
        // Find current value for this property
        let val = this.currentShape[prop];
        // Special case for color which isn't in simple watch
        if (prop === 'fillColor') val = this.currentShape.fillColor;

        const existing = this.currentShape.keyframes[prop]?.find(k => Math.abs(k.time - this.state.currentTime) < 10);
        
        if (existing) {
            this.state.removeKeyframe(this.currentShape, prop, existing.time);
        } else {
            this.state.addKeyframe(this.currentShape, prop, this.state.currentTime, val);
        }
        
        this.onChange({}); // Force redraw
    }
}
