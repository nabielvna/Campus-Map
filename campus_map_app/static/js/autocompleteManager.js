class AutocompleteManager {
    constructor(locationManager, uiManager) {
        this.locationManager = locationManager;
        this.uiManager = uiManager;
    }

    initAutocomplete() {
        const startInput = document.getElementById('start-search');
        const endInput = document.getElementById('end-search');
        
        this.setupAutocomplete(startInput, 'start');
        this.setupAutocomplete(endInput, 'end');
    }

    setupAutocomplete(input, type) {
        const dropdown = document.getElementById(`${type}-dropdown`);
        let highlightedIndex = -1;
        let filteredLocations = [];

        input.addEventListener('input', (e) => {
            if (this.uiManager.isPanelMinimized && e.target.value.length > 0) {
                this.uiManager.restorePanel();
            }
            
            const query = e.target.value.trim();
            highlightedIndex = -1;
            
            if (query.length === 0) {
                filteredLocations = this.locationManager.locations.slice(0, 10);
                this.showDropdown(dropdown, filteredLocations, query, type);
                this.locationManager.clearSelection(type);
                return;
            }

            filteredLocations = this.locationManager.filterLocations(query);
            this.showDropdown(dropdown, filteredLocations, query, type);
            
            if (this.uiManager) {
                const selections = this.locationManager.getSelections();
                this.uiManager.updateRouteButton(selections.selectedStart, selections.selectedEnd);
            }
        });

        input.addEventListener('focus', (e) => {
            if (this.uiManager.isPanelMinimized) {
                this.uiManager.restorePanel();
            }
            
            const query = e.target.value.trim();
            if (query.length === 0) {
                filteredLocations = this.locationManager.locations.slice(0, 10);
            } else {
                filteredLocations = this.locationManager.filterLocations(query);
            }
            this.showDropdown(dropdown, filteredLocations, query, type);
        });

        input.addEventListener('keydown', (e) => {
            const validItems = dropdown.querySelectorAll('.dropdown-item[data-id]');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    highlightedIndex = Math.min(highlightedIndex + 1, validItems.length - 1);
                    this.updateHighlight(dropdown, highlightedIndex);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    highlightedIndex = Math.max(highlightedIndex - 1, -1);
                    this.updateHighlight(dropdown, highlightedIndex);
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && validItems[highlightedIndex]) {
                        this.selectLocationFromDropdown(validItems[highlightedIndex], type);
                    }
                    break;
                    
                case 'Escape':
                    this.hideDropdown(dropdown);
                    input.blur();
                    break;
            }
        });

        input.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!dropdown.contains(document.activeElement)) {
                    this.hideDropdown(dropdown);
                }
            }, 150);
        });
    }

    showDropdown(dropdown, filteredLocations, query, type) {
        if (filteredLocations.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-item" style="color: #9ca3af; cursor: default;">No locations found</div>';
        } else {
            dropdown.innerHTML = filteredLocations.map(location => {
                const highlightedName = query ? this.highlightMatch(location.name, query) : location.name;
                return `
                    <div class="dropdown-item" data-id="${location.id}" data-type="${type}">
                        <div class="item-name">${highlightedName}</div>
                        <div class="item-id">ID: ${location.id}</div>
                    </div>
                `;
            }).join('');

            dropdown.querySelectorAll('.dropdown-item[data-id]').forEach(item => {
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.selectLocationFromDropdown(item, type);
                });
            });
        }
        
        dropdown.classList.add('show');
    }

    hideDropdown(dropdown) {
        dropdown.classList.remove('show');
    }

    highlightMatch(text, query) {
        if (!query) return text;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        let highlightedText = text;
        
        searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
        });
        
        return highlightedText;
    }

    updateHighlight(dropdown, index) {
        const validItems = dropdown.querySelectorAll('.dropdown-item[data-id]');
        validItems.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });
    }

    selectLocationFromDropdown(item, type) {
        const locationId = parseInt(item.dataset.id);
        const selections = this.locationManager.selectLocation(locationId, type, this.uiManager);
        
        if (this.uiManager && selections) {
            this.uiManager.updateRouteButton(selections.selectedStart, selections.selectedEnd);
        }
    }
}

export default AutocompleteManager;