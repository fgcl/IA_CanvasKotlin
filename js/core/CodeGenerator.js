export class CodeGenerator {
    static hexToComposeColor(hex, opacity) {
        if (!hex) return 'Color.Transparent';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const a = Math.round((opacity || 1) * 255).toString(16).padStart(2, '0').toUpperCase();
        return `Color(0x${a}${hex.slice(1).toUpperCase()})`;
    }

    static generate(shapes, canvasSize, codeMode = 'absolute') {
        let code = `import androidx.compose.animation.core.*\n`;
        code += `import androidx.compose.foundation.Canvas\n`;
        code += `import androidx.compose.foundation.layout.*\n`;
        code += `import androidx.compose.foundation.shape.RoundedCornerShape\n`;
        code += `import androidx.compose.material.icons.Icons\n`;
        code += `import androidx.compose.material.icons.filled.*\n`;
        code += `import androidx.compose.material3.*\n`; 
        code += `import androidx.compose.runtime.*\n`;
        code += `import androidx.compose.ui.Alignment\n`;
        code += `import androidx.compose.ui.Modifier\n`;
        code += `import androidx.compose.ui.geometry.*\n`;
        code += `import androidx.compose.ui.graphics.*\n`;
        code += `import androidx.compose.ui.graphics.drawscope.*\n`;
        code += `import androidx.compose.ui.unit.dp\n`;
        code += `import androidx.compose.ui.unit.sp\n`;
        code += `import androidx.compose.ui.text.*\n\n`;

        code += `@Composable\n`;
        code += `fun MyCanvasDrawing(modifier: Modifier = Modifier) {\n`;
        code += `    val transition = rememberInfiniteTransition(label = "canvas_anim")\n`;
        
        const isResp = codeMode === 'responsive';
        const mainModifier = isResp ? `modifier.fillMaxSize()` : `modifier.size(${canvasSize.width}.dp, ${canvasSize.height}.dp)`;
        
        code += `    Box(modifier = ${mainModifier}) {\n`;
        
        const topLevelShapes = shapes.filter(s => !s.parentId);
        topLevelShapes.forEach(shape => {
            code += this.generateAnimationVariables(shape, 'transition', 8);
        });

        // Use the new sequence-aware generation
        code += this.generateSequenceCode(topLevelShapes, 'box', 8, canvasSize, isResp);

        code += `    }\n`;
        code += `}`;
        return code;
    }

    static isDrawable(shape) {
        const drawables = ['rect', 'circle', 'line', 'pencil', 'bezier', 'path'];
        return drawables.includes(shape.type);
    }

    static generateSequenceCode(shapes, parentLayout, indent, canvasSize, isResp) {
        let code = "";
        let currentBatch = [];

        const flushBatch = () => {
            if (currentBatch.length > 0) {
                code += this.generateConsolidatedCanvas(currentBatch, indent, isResp, canvasSize);
                currentBatch = [];
            }
        };

        shapes.forEach(shape => {
            if (this.isDrawable(shape)) {
                currentBatch.push(shape);
            } else {
                flushBatch();
                code += this.generateShapeCode(shape, parentLayout, indent, canvasSize, isResp);
            }
        });

        flushBatch();
        return code;
    }

    static generateConsolidatedCanvas(batch, indent, isResp, canvasSize) {
        const space = ' '.repeat(indent);
        let code = `${space}Canvas(modifier = Modifier.fillMaxSize()) {\n`;
        batch.forEach(shape => {
            code += this.generateDrawScopeCode(shape, indent + 4, isResp, canvasSize);
        });
        code += `${space}}\n`;
        return code;
    }

    static generateShapeCode(shape, parentLayout, indent, canvasSize, isResp) {
        const space = ' '.repeat(indent);
        let code = "";

        const modifier = this.getModifier(shape, parentLayout, isResp, canvasSize);
        const color = this.hexToComposeColor(shape.fillColor, shape.opacity);

        if (shape.type === 'group') {
            const layoutType = shape.layout?.type || 'none';
            const comp = layoutType === 'row' ? 'Row' : (layoutType === 'column' ? 'Column' : 'Box');
            const gap = shape.layout?.gap || 0;
            const padding = shape.layout?.padding || 0;
            
            let params = `modifier = ${modifier}`;
            if (padding > 0) params += `.padding(${padding}.dp)`;
            if (layoutType !== 'none' && gap > 0) {
                params += `, horizontalArrangement = Arrangement.spacedBy(${gap}.dp)`;
                if (layoutType === 'column') params = params.replace('horizontalArrangement', 'verticalArrangement');
            }

            code += `${space}${comp}(${params}) {\n`;
            if (shape.children) {
                code += this.generateSequenceCode(shape.children, layoutType, indent + 4, canvasSize, isResp);
            }
            code += `${space}}\n`;
        } else if (shape.type === 'icon') {
            const iconName = shape.iconName || 'Favorite';
            code += `${space}Icon(\n`;
            code += `${space}    imageVector = Icons.Default.${iconName},\n`;
            code += `${space}    contentDescription = null,\n`;
            code += `${space}    tint = ${color},\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'text') {
            code += `${space}Text(\n`;
            code += `${space}    text = "${shape.text || ''}",\n`;
            code += `${space}    color = ${color},\n`;
            code += `${space}    fontSize = ${(shape.fontSize || 16)}.sp,\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'button') {
            code += `${space}Button(\n`;
            code += `${space}    onClick = { /* TODO */ },\n`;
            code += `${space}    shape = RoundedCornerShape(${(shape.cornerRadius || 8)}.dp),\n`;
            code += `${space}    colors = ButtonDefaults.buttonColors(containerColor = ${color}),\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space}) {\n`;
            code += `${space}    Text("${shape.text || 'Button'}")\n`;
            code += `${space}}\n`;
        } else if (shape.type === 'input') {
            code += `${space}OutlinedTextField(\n`;
            code += `${space}    value = "",\n`;
            code += `${space}    onValueChange = {},\n`;
            code += `${space}    label = { Text("${shape.text || 'Hint...'}") },\n`;
            code += `${space}    shape = RoundedCornerShape(${(shape.cornerRadius || 8)}.dp),\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'checkbox') {
            code += `${space}Checkbox(\n`;
            code += `${space}    checked = ${shape.checked || false},\n`;
            code += `${space}    onCheckedChange = {},\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'switch') {
            code += `${space}Switch(\n`;
            code += `${space}    checked = ${shape.checked || false},\n`;
            code += `${space}    onCheckedChange = {},\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'slider') {
            code += `${space}Slider(\n`;
            code += `${space}    value = ${(shape.value || 50)}f / 100f,\n`;
            code += `${space}    onValueChange = {},\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'progress') {
            code += `${space}LinearProgressIndicator(\n`;
            code += `${space}    progress = ${(shape.value || 40)}f / 100f,\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else if (shape.type === 'image') {
            code += `${space}// TODO: Carregue seu Painter/Bitmap aqui: painterResource(id = R.drawable.my_image)\n`;
            code += `${space}Image(\n`;
            code += `${space}    painter = ColorPainter(Color.LightGray), // Substitua pelo seu recurso\n`;
            code += `${space}    contentDescription = null,\n`;
            code += `${space}    modifier = ${modifier}\n`;
            code += `${space})\n`;
        } else {
            // Unhandled drawable fallback (should not happen with generateSequenceCode)
            code += `${space}Canvas(modifier = ${modifier}) {\n`;
            code += this.generateDrawScopeCode(shape, indent + 4, isResp, canvasSize);
            code += `${space}}\n`;
        }

        return code;
    }

    static getModifier(shape, parentLayout, isResp, canvasSize) {
        let mod = "Modifier";
        const name = shape.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        const getVal = (prop, fallback) => {
            if (shape.keyframes && shape.keyframes[prop]) return `anima_${name}_${prop}`;
            return `${fallback}f`;
        };

        // Size
        if (shape.width !== undefined && shape.height !== undefined && shape.type !== 'circle') {
            const w = getVal('width', shape.width.toFixed(1));
            const h = getVal('height', shape.height.toFixed(1));
            mod += `.size(${w}.dp, ${h}.dp)`;
        } else if (shape.type === 'circle') {
            const r = Math.sqrt((shape.width||0)**2 + (shape.height||0)**2);
            mod += `.size(${(r * 2).toFixed(1)}.dp)`;
        }

        // Position/Alignment
        if (parentLayout === 'none' || parentLayout === 'box') {
            const x = getVal('x', shape.x.toFixed(1));
            const y = getVal('y', shape.y.toFixed(1));
            
            if (isResp && shape.constraints) {
                const alignMap = {
                    'topleft': 'Alignment.TopStart', 'topcenter': 'Alignment.TopCenter', 'topright': 'Alignment.TopEnd',
                    'centerleft': 'Alignment.CenterStart', 'centercenter': 'Alignment.Center', 'centerright': 'Alignment.CenterEnd',
                    'bottomleft': 'Alignment.BottomStart', 'bottomcenter': 'Alignment.BottomCenter', 'bottomright': 'Alignment.BottomEnd'
                };
                const key = `${shape.constraints.vertical}${shape.constraints.horizontal}`.toLowerCase();
                if (alignMap[key]) {
                     mod += `.align(${alignMap[key]})`;
                     // We would ideally calculate offset from the snapped edge here, 
                     // but for now, we just apply the same offset (which might be displaced if parent resizes).
                     mod += `.offset(${x}.dp, ${y}.dp)`;
                } else {
                     mod += `.offset(${x}.dp, ${y}.dp)`;
                }
            } else {
                mod += `.offset(${x}.dp, ${y}.dp)`;
            }
        }

        return mod;
    }

    static generateDrawScopeCode(shape, indent, isResp, canvasSize) {
        const space = ' '.repeat(indent);
        const name = shape.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        const getVal = (prop, fallback) => {
            if (shape.keyframes && shape.keyframes[prop]) return `anima_${name}_${prop}`;
            return `${fallback}f`;
        };

        const getColor = (prop) => {
            if (shape.keyframes && shape.keyframes[prop]) return `anima_${name}_${prop}`;
            return this.hexToComposeColor(shape[prop], shape.opacity);
        };

        const color = getColor('fillColor');
        const strokeColor = getColor('strokeColor');
        const x = getVal('x', shape.x.toFixed(1));
        const y = getVal('y', shape.y.toFixed(1));
        const w = getVal('width', (shape.width || 0).toFixed(1));
        const h = getVal('height', (shape.height || 0).toFixed(1));

        let code = "";

        if (shape.type === 'rect') {
            const r = shape.cornerRadius || 0;
            const params = `color = ${color}, topLeft = Offset(${x}.dp.toPx(), ${y}.dp.toPx()), size = Size(${w}.dp.toPx(), ${h}.dp.toPx()), cornerRadius = CornerRadius(${r}.dp.toPx())`;
            if (shape.useFill !== false) {
                code += `${space}drawRoundRect(${params})\n`;
            }
            if (shape.useStroke !== false && shape.strokeWidth > 0) {
                code += `${space}drawRoundRect(${params}, style = Stroke(width = ${shape.strokeWidth}f))\n`;
            }
        } else if (shape.type === 'circle') {
            const radius = `Math.sqrt((${w}.dp.toPx() * ${w}.dp.toPx() + ${h}.dp.toPx() * ${h}.dp.toPx())) / 2f`;
            const center = `Offset(${x}.dp.toPx() + ${w}.dp.toPx()/2f, ${y}.dp.toPx() + ${h}.dp.toPx()/2f)`;
            
            if (shape.useFill !== false) {
                code += `${space}drawCircle(color = ${color}, radius = ${radius}, center = ${center})\n`;
            }
            if (shape.useStroke !== false && (shape.strokeWidth || 0) > 0) {
                code += `${space}drawCircle(color = ${strokeColor}, radius = ${radius}, center = ${center}, style = Stroke(width = ${shape.strokeWidth}f))\n`;
            }
        } else if (shape.type === 'line') {
            const startX = x;
            const startY = y;
            const endX = getVal('endX', (shape.endX || (shape.x + shape.width)).toFixed(1));
            const endY = getVal('endY', (shape.endY || (shape.y + shape.height)).toFixed(1));
            code += `${space}drawLine(color = ${strokeColor}, start = Offset(${startX}.dp.toPx(), ${startY}.dp.toPx()), end = Offset(${endX}.dp.toPx(), ${endY}.dp.toPx()), strokeWidth = ${shape.strokeWidth}f)\n`;
        } else if (shape.type === 'pencil' && shape.points?.length > 0) {
            code += `${space}drawPath(\n`;
            code += `${space}    path = Path().apply {\n`;
            code += `${space}        moveTo(${shape.points[0].x.toFixed(1)}.dp.toPx(), ${shape.points[0].y.toFixed(1)}.dp.toPx())\n`;
            for (let i = 1; i < shape.points.length; i++) {
                code += `${space}        lineTo(${shape.points[i].x.toFixed(1)}.dp.toPx(), ${shape.points[i].y.toFixed(1)}.dp.toPx())\n`;
            }
            code += `${space}    },\n`;
            code += `${space}    color = ${strokeColor},\n`; // Fixed: use strokeColor for paths
            code += `${space}    style = Stroke(width = ${shape.strokeWidth || 2}f, cap = StrokeCap.Round, join = StrokeJoin.Round)\n`;
            code += `${space})\n`;
        } else if (shape.type === 'bezier' && shape.points?.length > 0) {
            code += `${space}drawPath(\n`;
            code += `${space}    path = Path().apply {\n`;
            code += `${space}        moveTo(${shape.points[0].x.toFixed(1)}.dp.toPx(), ${shape.points[0].y.toFixed(1)}.dp.toPx())\n`;
            for (let i = 1; i < shape.points.length; i++) {
                const p = shape.points[i], prev = shape.points[i-1];
                code += `${space}        cubicTo(\n`;
                code += `${space}            ${prev.cp2x.toFixed(1)}.dp.toPx(), ${prev.cp2y.toFixed(1)}.dp.toPx(),\n`;
                code += `${space}            ${p.cp1x.toFixed(1)}.dp.toPx(), ${p.cp1y.toFixed(1)}.dp.toPx(),\n`;
                code += `${space}            ${p.x.toFixed(1)}.dp.toPx(), ${p.y.toFixed(1)}.dp.toPx()\n`;
                code += `${space}        )\n`;
            }
            code += `${space}    },\n`;
            code += `${space}    color = ${color},\n`;
            if (shape.useFill === false && shape.useStroke !== false) {
                code += `${space}    style = Stroke(width = ${shape.strokeWidth}f)\n`;
            }
            code += `${space})\n`;
        }

        return code;
    }

    static generateAnimationVariables(shape, transitionName, indent) {
        if (!shape.keyframes || Object.keys(shape.keyframes).length === 0) return "";
        let code = "";
        const space = ' '.repeat(indent);
        const name = shape.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const duration = 2000;

        Object.keys(shape.keyframes).forEach(prop => {
            const kfs = shape.keyframes[prop];
            const isColor = prop.includes('Color');
            const method = isColor ? 'animateColor' : 'animateFloat';

            code += `${space}val anima_${name}_${prop} by ${transitionName}.${method}(\n`;
            code += `${space}    initialValue = ${this.getComposeValue(kfs[0].value, isColor)},\n`;
            code += `${space}    targetValue = ${this.getComposeValue(kfs[kfs.length-1].value, isColor)},\n`;
            code += `${space}    animationSpec = infiniteRepeatable(\n`;
            code += `${space}        animation = keyframes {\n`;
            code += `${space}            durationMillis = ${duration}\n`;
            kfs.forEach(kf => {
                code += `${space}            ${this.getComposeValue(kf.value, isColor)} at ${kf.time}\n`;
            });
            code += `${space}        }\n`;
            code += `${space}    ),\n`;
            code += `${space}    label = "${name}_${prop}"\n`;
            code += `${space})\n`;
        });
        
        if (shape.children) {
            shape.children.forEach(child => {
                code += this.generateAnimationVariables(child, transitionName, indent);
            });
        }
        return code;
    }

    static getComposeValue(val, isColor) {
        if (isColor) return this.hexToComposeColor(val, 1);
        return `${val}f`;
    }
}
