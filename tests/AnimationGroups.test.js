import { AnimationEngine } from '../js/core/AnimationEngine.js';

export async function runAnimationGroupsTests(assert) {
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

    test('animateShape - Should preserve children references in groups', () => {
        const child = { id: 'child', type: 'rect', x: 0 };
        const group = { 
            id: 'parent', 
            type: 'group', 
            x: 10, 
            children: [child],
            keyframes: {
                x: [{ time: 0, value: 0 }, { time: 100, value: 100 }]
            }
        };
        
        const animated = AnimationEngine.animateShape(group, 50);
        assert(animated.x === 50, 'Group x should be animated');
        assert(animated.children !== undefined, 'Group should still have children');
        assert(animated.children[0].id === 'child', 'Child should be preserved');
        assert(animated.children[0] === child, 'Child reference should ideally be the same if not animated');
    });

    test('animateShape - Recursive animation (Conceptual Check)', () => {
        // Current implementation is NOT recursive. 
        // This test will prove that child keyframes are currently ignored if we only animate the parent.
        const child = { 
            id: 'child', 
            type: 'rect', 
            x: 0,
            keyframes: { x: [{ time: 0, value: 0 }, { time: 100, value: 100 }] }
        };
        const group = { 
            id: 'parent', 
            type: 'group', 
            children: [child]
        };

        const animatedGroup = AnimationEngine.animateShape(group, 50);
        // If it's not recursive, the child's property inside animatedGroup remains unchanged (it's not even processed)
        assert(animatedGroup.children[0].x === 0, 'Current implementation: child within group is NOT animated by parent animateShape call');
    });

    return results;
}
