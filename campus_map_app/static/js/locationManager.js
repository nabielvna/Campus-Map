import { MARKER_COLORS } from './config.js';

class LocationManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.locations = [];
        this.selectedStart = null;
        this.selectedEnd = null;
        this.startMarker = null;
        this.endMarker = null;
        this.isMarkersVisible = true;
    }

    loadLocations() {
        this.locations = window.locationsData.filter(loc => !loc.name.startsWith('Node'));
        this.showLocationMarkers();
    }

    showLocationMarkers() {
        if (!this.isMarkersVisible) return;
        
        const markersLayer = this.mapManager.getMarkersLayer();
        markersLayer.clearLayers();
        
        this.locations.forEach(location => {
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 4,
                fillColor: MARKER_COLORS.location,
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`
                <div style="text-align: center; min-width: 150px;">
                    <strong>${location.name}</strong><br>
                    <div style="margin-top: 8px;">
                        <button onclick="window.locationManager.selectLocation(${location.id}, 'start')" 
                                style="background: ${MARKER_COLORS.start}; color: white; border: none; 
                                       padding: 4px 8px; margin: 2px; border-radius: 4px; 
                                       cursor: pointer; font-size: 11px;">
                            Set as Start
                        </button>
                        <button onclick="window.locationManager.selectLocation(${location.id}, 'end')" 
                                style="background: ${MARKER_COLORS.end}; color: white; border: none; 
                                       padding: 4px 8px; margin: 2px; border-radius: 4px; 
                                       cursor: pointer; font-size: 11px;">
                            Set as End
                        </button>
                    </div>
                </div>
            `);
            
            markersLayer.addLayer(marker);
        });
    }

    selectLocation(locationId, type, uiManager) {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) return;

        // Auto-restore panel if minimized
        if (uiManager && uiManager.isPanelMinimized) {
            uiManager.restorePanel();
        }

        const input = document.getElementById(`${type}-search`);
        const dropdown = document.getElementById(`${type}-dropdown`);
        
        input.value = location.name;
        this.hideDropdown(dropdown);
        
        if (type === 'start') {
            this.selectedStart = location;
            this.updateMarker(location, 'start');
        } else {
            this.selectedEnd = location;
            this.updateMarker(location, 'end');
        }
        
        this.mapManager.closePopup();
        this.mapManager.centerOnLocation(location.lat, location.lng);
        
        if (uiManager) {
            uiManager.showToast(`${type === 'start' ? 'Starting point' : 'Destination'} selected`, 'success');
        }

        return { selectedStart: this.selectedStart, selectedEnd: this.selectedEnd };
    }

    updateMarker(location, type) {
        const color = MARKER_COLORS[type];
        
        const pulsingIcon = L.divIcon({
            className: 'pulsing-marker',
            html: `
                <div class="marker-container">
                    <div class="pulse-ring" style="border-color: ${color};"></div>
                    <div class="pulse-ring-2" style="border-color: ${color};"></div>
                    <div class="marker-dot" style="background: ${color};"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const map = this.mapManager.getMap();

        if (type === 'start' && this.startMarker) {
            map.removeLayer(this.startMarker);
        } else if (type === 'end' && this.endMarker) {
            map.removeLayer(this.endMarker);
        }

        const marker = L.marker([location.lat, location.lng], {
            icon: pulsingIcon,
            zIndexOffset: 1000
        }).addTo(map);

        marker.bindPopup(`
            <div style="text-align: center;">
                <strong>${type === 'start' ? '🚀 Start' : '🎯 Destination'}</strong><br>
                ${location.name}
            </div>
        `);

        if (type === 'start') {
            this.startMarker = marker;
        } else {
            this.endMarker = marker;
        }
    }

    clearSelection(type) {
        const map = this.mapManager.getMap();
        
        if (type === 'start') {
            this.selectedStart = null;
            if (this.startMarker) {
                map.removeLayer(this.startMarker);
                this.startMarker = null;
            }
        } else {
            this.selectedEnd = null;
            if (this.endMarker) {
                map.removeLayer(this.endMarker);
                this.endMarker = null;
            }
        }
    }

    swapLocations() {
        if (!this.selectedStart && !this.selectedEnd) return;

        const tempStart = this.selectedStart;
        const tempEnd = this.selectedEnd;
        
        this.selectedStart = tempEnd;
        this.selectedEnd = tempStart;
        
        document.getElementById('start-search').value = this.selectedStart ? this.selectedStart.name : '';
        document.getElementById('end-search').value = this.selectedEnd ? this.selectedEnd.name : '';
        
        if (this.selectedStart) this.updateMarker(this.selectedStart, 'start');
        if (this.selectedEnd) this.updateMarker(this.selectedEnd, 'end');
        
        return { selectedStart: this.selectedStart, selectedEnd: this.selectedEnd };
    }

    toggleMarkers() {
        this.isMarkersVisible = !this.isMarkersVisible;
        
        if (this.isMarkersVisible) {
            this.showLocationMarkers();
        } else {
            this.mapManager.getMarkersLayer().clearLayers();
        }
        
        if (this.startMarker && this.selectedStart) {
            this.updateMarker(this.selectedStart, 'start');
        }
        if (this.endMarker && this.selectedEnd) {
            this.updateMarker(this.selectedEnd, 'end');
        }

        return this.isMarkersVisible;
    }

    filterLocations(query) {
        if (!query || query.trim().length === 0) {
            return this.locations.slice(0, 10);
        }
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return this.locations.filter(location => {
            const name = location.name.toLowerCase();
            return searchTerms.every(term => name.includes(term));
        }).slice(0, 10);
    }

    clearAll() {
        this.clearSelection('start');
        this.clearSelection('end');
        document.getElementById('start-search').value = '';
        document.getElementById('end-search').value = '';
        this.showLocationMarkers();
    }

    hideDropdown(dropdown) {
        dropdown.classList.remove('show');
    }

    getSelections() {
        return {
            selectedStart: this.selectedStart,
            selectedEnd: this.selectedEnd
        };
    }
}

export default LocationManager;