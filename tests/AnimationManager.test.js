import { AnimationManager } from '../js/core/state/AnimationManager.js';

export async function runAnimationManagerTests(assert) {
    const results = [];

    const test = (name, fn) => {
        try {
            fn();
            results.push({ name, ok: true });
        } catch (error) {
            results.push({ name, ok: false, error });
        }
    };

    // --- Mock State ---
    const mockState = {
        saveState: () => {}
    };

    // --- Tests ---

    test('addKeyframe - Should add and sort keyframes', () => {
        const mgr = new AnimationManager(mockState);
        const shape = { keyframes: {} };
        mgr.addKeyframe(shape, 'x', 100, 100);
        mgr.addKeyframe(shape, 'x', 0, 0);
        
        assert(shape.keyframes.x.length === 2, 'Should have 2 keyframes');
        assert(shape.keyframes.x[0].time === 0, 'First keyframe should be at time 0');
        assert(shape.keyframes.x[1].time === 100, 'Second keyframe should be at time 100');
    });

    test('addKeyframe - Should overwrite value if time matches', () => {
        const mgr = new AnimationManager(mockState);
        const shape = { keyframes: {} };
        mgr.addKeyframe(shape, 'x', 50, 10);
        mgr.addKeyframe(shape, 'x', 50, 20);
        
        assert(shape.keyframes.x.length === 1, 'Should still have 1 keyframe');
        assert(shape.keyframes.x[0].value === 20, 'Value should be updated to 20');
    });

    test('removeKeyframe - Should remove keyframe at specific time', () => {
        const mgr = new AnimationManager(mockState);
        const shape = { keyframes: { x: [{ time: 0, value: 0 }, { time: 50, value: 50 }] } };
        mgr.removeKeyframe(shape, 'x', 50);
        
        assert(shape.keyframes.x.length === 1, 'Should have 1 keyframe left');
        assert(shape.keyframes.x[0].time === 0, 'Remaining keyframe should be at time 0');
    });

    test('syncKeyframes - Should update existing keyframe within epsilon', () => {
        const mgr = new AnimationManager(mockState);
        mgr.currentTime = 52; // Inside 50ms epsilon of time 50
        const shape = { x: 100, keyframes: { x: [{ time: 50, value: 50 }] } };
        
        mgr.syncKeyframes(shape, ['x']);
        
        assert(shape.keyframes.x.length === 1, 'Should not add new keyframe');
        assert(shape.keyframes.x[0].value === 100, 'Value should be updated to 100');
        assert(shape.keyframes.x[0].time === 52, `Time should be snapped/updated to 52, got ${shape.keyframes.x[0].time}`);
    });

    test('syncKeyframes - Should create base keyframe at time 0 if missing', () => {
        const mgr = new AnimationManager(mockState);
        mgr.currentTime = 200;
        const shape = { x: 100, keyframes: {} };
        
        // Old value was 0
        mgr.syncKeyframes(shape, ['x'], { x: 0 });
        
        assert(shape.keyframes.x.length === 2, 'Should create 2 keyframes (one at 0, one at currentTime)');
        assert(shape.keyframes.x[0].time === 0, 'First keyframe should be at 0');
        assert(shape.keyframes.x[0].value === 0, 'First keyframe should have old balance value');
        assert(shape.keyframes.x[1].time === 200, 'Second keyframe should be at 200');
    });

    return results;
}
