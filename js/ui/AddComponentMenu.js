export class AddComponentMenu {
    constructor(state, onSelect) {
        this.state = state;
        this.onSelect = onSelect;
        this.container = document.getElementById('add-component-container');
        this.btn = document.getElementById('add-component-btn');
        this.menu = document.getElementById('add-component-menu');
        this.isOpen = false;

        this.init();
    }

    init() {
        if (!this.btn || !this.menu) return;

        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        const items = this.menu.querySelectorAll('.menu-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const componentType = item.dataset.component;
                this.onSelect(componentType);
                this.close();
                e.stopPropagation();
            });
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });

        // Add keyboard shortcut 'A' for Add
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                this.toggle();
                e.preventDefault();
            }
        });
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        this.menu.classList.remove('hidden');
        this.btn.classList.add('active');
    }

    close() {
        this.isOpen = false;
        this.menu.classList.add('hidden');
        this.btn.classList.remove('active');
    }
}
