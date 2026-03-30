export class CodeViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.collapsedRegions = new Set(['imports']);
        this.onLanguageChange = null;
        this.onToggle = null; // Region toggle callback
    }

    update(code, language = 'kotlin') {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // 1. Render Language Toggle
        this.renderLanguageToggle(language);

        if (language === 'kotlin') {
            this.renderKotlin(code);
        } else {
            this.renderHtml(code);
        }

        if (window.Prism) {
            Prism.highlightAllUnder(this.container);
        }
    }

    renderLanguageToggle(currentLang) {
        const host = document.getElementById('language-toggle-host');
        if (!host) return;
        host.innerHTML = '';
        
        const toggle = document.createElement('div');
        toggle.className = 'language-toggle';
        
        const options = [
            { id: 'kotlin', label: 'Kotlin' },
            { id: 'html', label: 'HTML/CSS' }
        ];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `lang-btn ${currentLang === opt.id ? 'active' : ''}`;
            btn.textContent = opt.label;
            btn.onclick = () => {
                if (currentLang !== opt.id && this.onLanguageChange) {
                    this.onLanguageChange(opt.id);
                }
            };
            toggle.appendChild(btn);
        });

        host.appendChild(toggle);
    }

    renderKotlin(code) {
        const lines = code.split('\n');
        
        // 1. Extract Imports
        let i = 0;
        let importLines = [];
        while (i < lines.length && (lines[i].trim().startsWith('import ') || lines[i].trim() === '')) {
            if (lines[i].trim().startsWith('import ')) {
                importLines.push(lines[i]);
            }
            i++;
        }

        if (importLines.length > 0) {
            this.renderRegion('imports', 'imports', importLines.join('\n'), 'kotlin');
        }

        // 2. The Rest (Main Function)
        let mainCodeLines = lines.slice(i);
        if (mainCodeLines.length > 0) {
            let header = 'Componente';
            for(let j=0; j < mainCodeLines.length; j++) {
                if (mainCodeLines[j].includes('fun ')) {
                    header = mainCodeLines[j].split('(')[0].replace('fun ', '').trim();
                    break;
                }
            }
            this.renderRegion('main', header, mainCodeLines.join('\n'), 'kotlin');
        }
    }

    renderHtml(code) {
        // For HTML, we'll split into Head and Body for easier navigation
        const parts = code.split('</style>');
        if (parts.length > 1) {
            const headPart = parts[0] + '</style>';
            const bodyPart = parts[1];
            
            this.renderRegion('html-head', 'Cabeçalho (HTML/CSS)', headPart, 'html');
            this.renderRegion('html-body', 'Corpo (Body)', bodyPart, 'html');
        } else {
            this.renderRegion('html-all', 'HTML Completo', code, 'html');
        }
    }

    renderRegion(id, label, content, lang = 'kotlin') {
        const isCollapsed = this.collapsedRegions.has(id);
        const regionDiv = document.createElement('div');
        regionDiv.className = 'code-region';
        
        const header = document.createElement('div');
        header.className = `region-header ${isCollapsed ? 'collapsed' : ''}`;
        header.innerHTML = `
            <span class="fold-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
            <span class="region-label">${label}</span>
            ${isCollapsed ? '<span class="region-placeholder">{...}</span>' : ''}
        `;
        header.onclick = () => this.toggleRegion(id);
        regionDiv.appendChild(header);

        if (!isCollapsed) {
            const pre = document.createElement('pre');
            pre.className = `language-${lang}`;
            const code = document.createElement('code');
            code.className = `language-${lang}`;
            code.textContent = content;
            pre.appendChild(code);
            regionDiv.appendChild(pre);
        }

        this.container.appendChild(regionDiv);
    }

    toggleRegion(id) {
        if (this.collapsedRegions.has(id)) {
            this.collapsedRegions.delete(id);
        } else {
            this.collapsedRegions.add(id);
        }
        if (this.onToggle) this.onToggle();
    }
}
