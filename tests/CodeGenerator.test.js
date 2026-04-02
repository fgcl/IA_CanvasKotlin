import { CodeGenerator } from '../js/core/CodeGenerator.js';

export async function runCodeGeneratorTests(assert) {
    const results = [];

    const test = (name, fn) => {
        try {
            fn();
            results.push({ name, ok: true });
        } catch (error) {
            results.push({ name, ok: false, error });
        }
    };

    // --- Tests ---

    test('hexToComposeColor - Correct Hex conversion', () => {
        const result = CodeGenerator.hexToComposeColor('#6200EE', 1);
        assert(result === 'Color(0xFF6200EE)', `Expected Color(0xFF6200EE), got ${result}`);
    });

    test('hexToComposeColor - Correct Opacity conversion', () => {
        const result = CodeGenerator.hexToComposeColor('#6200EE', 0.5);
        // 0.5 * 255 = 127.5 -> 128 (80 in hex)
        assert(result === 'Color(0x806200EE)', `Expected Color(0x806200EE), got ${result}`);
    });

    test('isDrawable - Correct identification of drawable shapes', () => {
        assert(CodeGenerator.isDrawable({ type: 'rect' }) === true, 'Rect should be drawable');
        assert(CodeGenerator.isDrawable({ type: 'circle' }) === true, 'Circle should be drawable');
        assert(CodeGenerator.isDrawable({ type: 'group' }) === false, 'Group should not be drawable');
        assert(CodeGenerator.isDrawable({ type: 'icon' }) === false, 'Icon should not be drawable');
    });

    test('generate - Basic Shape Generation Structure', () => {
        const shapes = [{ type: 'rect', x: 0, y: 0, width: 100, height: 100, name: 'MainRect', fillColor: '#FFFFFF', opacity: 1, strokeWidth: 0, useFill: true, useStroke: false }];
        const canvasSize = { width: 500, height: 500 };
        const code = CodeGenerator.generate(shapes, canvasSize, 'absolute');
        
        assert(code.includes('Canvas(modifier = Modifier.fillMaxSize())'), 'Code should include Canvas block');
        assert(code.includes('drawRoundRect('), 'Code should include drawRoundRect call');
        assert(code.includes('modifier.size(500.dp, 500.dp)'), 'Main modifier should have correct canvas size');
    });

    return results;
}
