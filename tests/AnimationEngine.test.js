import { AnimationEngine } from '../js/core/AnimationEngine.js';

export async function runAnimationEngineTests(assert) {
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

    test('getInterpolatedValue - Linear interpolation between numbers', () => {
        const keyframes = [
            { time: 0, value: 0 },
            { time: 100, value: 100 }
        ];
        // At time 50, with linear easing, value should be 50
        // Wait, AnimationEngine uses easeInOut by default.
        // Let's force linear or check easeInOut at mid-point (should also be 50)
        const result = AnimationEngine.getInterpolatedValue(keyframes, 50, 'linear');
        assert(result === 50, `Expected 50, got ${result}`);
    });

    test('getInterpolatedValue - Boundary conditions (before first)', () => {
        const keyframes = [{ time: 100, value: 10 }];
        const result = AnimationEngine.getInterpolatedValue(keyframes, 50);
        assert(result === 10, `Expected 10, got ${result}`);
    });

    test('getInterpolatedValue - Boundary conditions (after last)', () => {
        const keyframes = [{ time: 100, value: 10 }];
        const result = AnimationEngine.getInterpolatedValue(keyframes, 150);
        assert(result === 10, `Expected 10, got ${result}`);
    });

    test('getInterpolatedValue - Single keyframe returns the value', () => {
        const keyframes = [{ time: 100, value: 42 }];
        const result = AnimationEngine.getInterpolatedValue(keyframes, 100);
        assert(result === 42, `Expected 42, got ${result}`);
    });

    test('getInterpolatedValue - Interpolate Colors', () => {
        const keyframes = [
            { time: 0, value: '#000000' },
            { time: 100, value: '#FFFFFF' }
        ];
        const result = AnimationEngine.getInterpolatedValue(keyframes, 50, 'linear');
        // Midpoint should be approximately #808080 or #7F7F7F depending on rounding
        // r = 0 + (255-0)*0.5 = 127.5 -> 128 (80 in hex)
        assert(result === '#808080', `Expected #808080, got ${result}`);
    });

    test('getInterpolatedValue - EaseInOut progress check', () => {
        const keyframes = [
            { time: 0, value: 0 },
            { time: 100, value: 100 }
        ];
        // At 25% progress, easeInOutQuad should be 2 * 0.25 * 0.25 = 0.125
        const result = AnimationEngine.getInterpolatedValue(keyframes, 25, 'easeInOut');
        assert(result === 12.5, `Expected 12.5, got ${result}`);
    });

    test('hexToRgb - Correct conversion of 6-digit hex', () => {
        const rgb = AnimationEngine.hexToRgb('#FF00AA');
        assert(rgb.r === 255 && rgb.g === 0 && rgb.b === 170, `Expected {255, 0, 170}, got ${JSON.stringify(rgb)}`);
    });

    test('hexToRgb - Correct conversion of 3-digit hex', () => {
        const rgb = AnimationEngine.hexToRgb('#F0A');
        assert(rgb.r === 255 && rgb.g === 0 && rgb.b === 170, `Expected {255, 0, 170}, got ${JSON.stringify(rgb)}`);
    });

    test('animateShape - Property merge check', () => {
        const shape = {
            id: '1',
            type: 'rect',
            x: 10,
            y: 10,
            keyframes: {
                x: [{ time: 0, value: 0 }, { time: 100, value: 100 }]
            }
        };
        const animated = AnimationEngine.animateShape(shape, 50);
        assert(animated.x !== 10, 'X should be animated, not the base value');
        // Default easing is easeInOut, so at 50% it should be 50
        assert(animated.x === 50, `Expected animated.x to be 50, got ${animated.x}`);
        assert(animated.y === 10, 'Y should remain its base value');
    });

    return results;
}
