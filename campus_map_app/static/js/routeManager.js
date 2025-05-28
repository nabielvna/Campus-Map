import { WALKING_SPEED_MS } from './config.js';

class RouteManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.pathLayer = null;
    }

    async findRoute(selectedStart, selectedEnd, uiManager) {
        if (!selectedStart || !selectedEnd) return;

        const button = document.getElementById('find-route');
        const originalHtml = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
        button.classList.add('loading');

        try {
            const response = await fetch(`/route?start=${selectedStart.id}&end=${selectedEnd.id}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayRoute(data, uiManager);
            if (uiManager) {
                uiManager.showToast('Route found!', 'success');
            }
        } catch (err) {
            if (uiManager) {
                uiManager.showToast('Route not found', 'error');
            }
            console.error('Route error:', err);
        } finally {
            button.innerHTML = originalHtml;
            button.classList.remove('loading');
        }
    }

    displayRoute(routeData, uiManager) {
        this.clearRoute();

        if (routeData.coords && routeData.coords.length > 0) {
            this.pathLayer = L.polyline(routeData.coords, {
                color: '#6366f1',
                weight: 4,
                opacity: 0.8,
                smoothFactor: 1
            }).addTo(this.mapManager.getMap());

            const routeBounds = this.pathLayer.getBounds();
            this.mapManager.fitBounds(routeBounds);

            document.getElementById('route-distance').textContent = `${routeData.distance}m`;
            document.getElementById('route-time').textContent = routeData.walking_time || this.calculateWalkingTime(routeData.distance);
            document.getElementById('route-summary').style.display = 'block';
            
            if (uiManager && uiManager.isPanelMinimized) {
                uiManager.updateMiniRouteInfo();
            }
        }
    }

    calculateWalkingTime(distance) {
        const timeSeconds = distance / WALKING_SPEED_MS;
        
        if (timeSeconds < 60) {
            return `${Math.round(timeSeconds)}s`;
        } else if (timeSeconds < 3600) {
            return `${Math.round(timeSeconds / 60)}min`;
        } else {
            const hours = Math.floor(timeSeconds / 3600);
            const minutes = Math.round((timeSeconds % 3600) / 60);
            return `${hours}h ${minutes}min`;
        }
    }

    clearRoute() {
        if (this.pathLayer) {
            this.mapManager.getMap().removeLayer(this.pathLayer);
            this.pathLayer = null;
        }
        
        document.getElementById('route-summary').style.display = 'none';
        
        document.getElementById('mini-route-info').style.display = 'none';
    }

    hasActiveRoute() {
        return this.pathLayer !== null;
    }
}

export default RouteManager;