class EventHandlers {
    constructor(locationManager, routeManager, uiManager) {
        this.locationManager = locationManager;
        this.routeManager = routeManager;
        this.uiManager = uiManager;
    }

    bindEvents() {
        document.getElementById('find-route').addEventListener('click', () => {
            const selections = this.locationManager.getSelections();
            this.routeManager.findRoute(selections.selectedStart, selections.selectedEnd, this.uiManager);
        });

        document.getElementById('clear-route').addEventListener('click', () => {
            this.clearRoute();
        });

        document.getElementById('swap-btn').addEventListener('click', () => {
            const swappedSelections = this.locationManager.swapLocations();
            
            // Clear existing route
            if (this.routeManager.hasActiveRoute()) {
                this.routeManager.clearRoute();
            }
            
            this.uiManager.updateRouteButton(swappedSelections.selectedStart, swappedSelections.selectedEnd);
            this.uiManager.showToast('Locations swapped', 'info');
        });

        document.getElementById('locate-btn').addEventListener('click', () => {
            this.uiManager.locateUser();
        });

        document.getElementById('layers-btn').addEventListener('click', () => {
            const isVisible = this.locationManager.toggleMarkers();
            const button = document.getElementById('layers-btn');
            
            if (isVisible) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        document.getElementById('toggle-panel').addEventListener('click', () => {
            this.uiManager.togglePanel();
        });

        document.getElementById('restore-panel').addEventListener('click', () => {
            this.uiManager.restorePanel();
        });

        this.bindKeyboardShortcuts();
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (!document.getElementById('find-route').disabled) {
                            const selections = this.locationManager.getSelections();
                            this.routeManager.findRoute(selections.selectedStart, selections.selectedEnd, this.uiManager);
                        }
                        break;
                    case 'Backspace':
                        e.preventDefault();
                        this.clearRoute();
                        break;
                }
            } else {
                switch(e.key.toLowerCase()) {
                    case 'h':
                        e.preventDefault();
                        this.uiManager.togglePanel();
                        break;
                    case 'escape':
                        document.querySelectorAll('.search-dropdown.show').forEach(dropdown => {
                            dropdown.classList.remove('show');
                        });
                        break;
                }
            }
        });
    }

    clearRoute() {
        // Clear route line
        this.routeManager.clearRoute();

        // Clear markers and selections
        this.locationManager.clearAll();

        // Update UI
        const selections = this.locationManager.getSelections();
        this.uiManager.updateRouteButton(selections.selectedStart, selections.selectedEnd);
        
        // Reset map view
        this.locationManager.mapManager.resetView();
        
        this.uiManager.showToast('Route cleared', 'info');
    }
}

export default EventHandlers;