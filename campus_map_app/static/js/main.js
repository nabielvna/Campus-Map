import MapManager from './mapManager.js';
import LocationManager from './locationManager.js';
import RouteManager from './routeManager.js';
import UIManager from './uiManager.js';
import AutocompleteManager from './autocompleteManager.js';
import EventHandlers from './eventHandlers.js';
import ValueDetector from './valueDetector.js';

class CampusMapApp {
    constructor() {
        this.mapManager = null;
        this.locationManager = null;
        this.routeManager = null;
        this.uiManager = null;
        this.autocompleteManager = null;
        this.eventHandlers = null;
        this.valueDetector = null;
    }

    init() {
        try {
            // Initialize core managers
            this.mapManager = new MapManager();
            this.uiManager = new UIManager(this.mapManager);
            this.locationManager = new LocationManager(this.mapManager);
            this.routeManager = new RouteManager(this.mapManager);
            
            // Initialize UI components
            this.autocompleteManager = new AutocompleteManager(this.locationManager, this.uiManager);
            this.eventHandlers = new EventHandlers(this.locationManager, this.routeManager, this.uiManager);
            
            // Initialize ValueDetector 
            this.valueDetector = new ValueDetector(this.locationManager, this.uiManager);

            this.mapManager.initMap();
            this.locationManager.loadLocations();
            this.autocompleteManager.initAutocomplete();
            this.eventHandlers.bindEvents();
            this.valueDetector.init();

            this.setupGlobalReferences();

            setTimeout(() => {
                this.valueDetector.forceValidation();
            }, 100);

            console.log('Campus Map App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Campus Map App:', error);
        }
    }

    setupGlobalReferences() {
        window.locationManager = this.locationManager;
        
        window.selectLocation = (locationId, type) => {
            try {
                const selections = this.locationManager.selectLocation(locationId, type, this.uiManager);
                if (selections) {
                    this.uiManager.updateRouteButton(selections.selectedStart, selections.selectedEnd);
                }
                
                if (this.valueDetector) {
                    setTimeout(() => {
                        this.valueDetector.forceValidation();
                    }, 50);
                }
            } catch (error) {
                console.error('Error in selectLocation:', error);
            }
        };
        
        window.valueDetector = this.valueDetector;
    }

    getManagers() {
        return {
            mapManager: this.mapManager,
            locationManager: this.locationManager,
            routeManager: this.routeManager,
            uiManager: this.uiManager,
            autocompleteManager: this.autocompleteManager,
            eventHandlers: this.eventHandlers,
            valueDetector: this.valueDetector
        };
    }

    validateInputs() {
        if (this.valueDetector) {
            this.valueDetector.forceValidation();
        }
    }

    destroy() {
        if (this.valueDetector) {
            this.valueDetector.destroy();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new CampusMapApp();
        app.init();
        
        window.campusMapApp = app;
        
        window.addEventListener('focus', () => {
            if (window.campusMapApp && window.campusMapApp.valueDetector) {
                window.campusMapApp.valueDetector.forceValidation();
            }
        });
        
    } catch (error) {
        console.error('Failed to start Campus Map App:', error);
    }
});

export default CampusMapApp;