import { CAMPUS_BOUNDS, MAP_CONFIG } from './config.js';

class MapManager {
    constructor() {
        this.map = null;
        this.markersLayer = null;
    }

    initMap() {
        const campusBounds = [
            [CAMPUS_BOUNDS.south, CAMPUS_BOUNDS.west],
            [CAMPUS_BOUNDS.north, CAMPUS_BOUNDS.east]
        ];

        this.map = L.map('map', {
            zoomControl: false,
            maxBounds: campusBounds,
            maxBoundsViscosity: MAP_CONFIG.maxBoundsViscosity,
            minZoom: MAP_CONFIG.minZoom,
            maxZoom: MAP_CONFIG.maxZoom
        }).setView(CAMPUS_BOUNDS.center, MAP_CONFIG.initialZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: MAP_CONFIG.maxZoom
        }).addTo(this.map);

        L.control.zoom({
            position: 'bottomleft'
        }).addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);

        L.rectangle(campusBounds, {
            color: "#FF0000",
            weight: 2,
            opacity: 0.5,
            fillOpacity: 0.02,
            interactive: false,
            dashArray: "5, 5"
        }).addTo(this.map);
    }

    getMap() {
        return this.map;
    }

    getMarkersLayer() {
        return this.markersLayer;
    }

    centerOnLocation(lat, lng, zoom = null) {
        const targetZoom = zoom || Math.max(this.map.getZoom(), 17);
        this.map.setView([lat, lng], targetZoom);
    }

    resetView() {
        this.map.setView(CAMPUS_BOUNDS.center, MAP_CONFIG.initialZoom);
    }

    fitBounds(bounds, options = {}) {
        const defaultOptions = { 
            padding: [20, 20],
            maxZoom: 18
        };
        this.map.fitBounds(bounds, { ...defaultOptions, ...options });
    }

    closePopup() {
        this.map.closePopup();
    }

    isWithinCampusBounds(lat, lng) {
        return lat >= CAMPUS_BOUNDS.south && lat <= CAMPUS_BOUNDS.north &&
               lng >= CAMPUS_BOUNDS.west && lng <= CAMPUS_BOUNDS.east;
    }
}

export default MapManager;