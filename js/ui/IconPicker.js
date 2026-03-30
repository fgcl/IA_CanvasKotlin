import { IconLibrary } from '../core/IconLibrary.js';

export class IconPicker {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.modal = document.getElementById('icon-picker-modal');
        this.grid = document.getElementById('icon-grid');
        this.searchInput = document.getElementById('icon-search-input');
        this.closeBtn = document.getElementById('close-icon-picker');
        this.selectedIcon = null;
        
        this.init();
    }

    init() {
        this.closeBtn.onclick = () => this.hide();
        this.modal.onclick = (e) => { if (e.target === this.modal) this.hide(); };
        this.searchInput.oninput = (e) => this.filterIcons(e.target.value);
        this.renderIcons(IconLibrary);
    }

    renderIcons(icons) {
        this.grid.innerHTML = '';
        Object.entries(icons).forEach(([name, path]) => {
            const item = document.createElement('div');
            item.className = 'icon-item';
            item.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="${path}" fill="currentColor" />
                </svg>
                <span class="icon-item-name">${name}</span>
            `;
            item.onclick = () => {
                this.selectedIcon = name;
                this.onSelect(name);
                this.hide();
            };
            this.grid.appendChild(item);
        });
    }

    filterIcons(query) {
        const filtered = {};
        const q = query.toLowerCase();
        Object.entries(IconLibrary).forEach(([name, path]) => {
            if (name.toLowerCase().includes(q)) filtered[name] = path;
        });
        this.renderIcons(filtered);
    }

    show(currentIcon = null) {
        this.selectedIcon = currentIcon;
        this.modal.classList.remove('hidden');
        this.searchInput.value = '';
        this.searchInput.focus();
        this.renderIcons(IconLibrary);
    }

    hide() {
        this.modal.classList.add('hidden');
    }
}
