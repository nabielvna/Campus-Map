class UIManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.isPanelMinimized = false;
    }

    minimizePanel() {
        const panel = document.getElementById('search-panel');
        const indicator = document.getElementById('minimized-indicator');
        
        this.isPanelMinimized = true;
        panel.classList.add('minimized');
        
        setTimeout(() => {
            indicator.style.display = 'flex';
            setTimeout(() => {
                indicator.classList.add('show');
            }, 50);
        }, 200);
        
        this.updateMiniRouteInfo();
        this.showToast('Panel minimized. Press H to restore.', 'info');
    }

    restorePanel() {
        const panel = document.getElementById('search-panel');
        const indicator = document.getElementById('minimized-indicator');
        
        this.isPanelMinimized = false;
        
        indicator.classList.remove('show');
        setTimeout(() => {
            indicator.style.display = 'none';
            panel.classList.remove('minimized');
        }, 200);
    }

    togglePanel() {
        if (this.isPanelMinimized) {
            this.restorePanel();
        } else {
            this.minimizePanel();
        }
    }

    updateMiniRouteInfo() {
        const miniInfo = document.getElementById('mini-route-info');
        const miniDistance = document.getElementById('mini-distance');
        const routeSummary = document.getElementById('route-summary');
        
        if (routeSummary && routeSummary.style.display !== 'none') {
            const distance = document.getElementById('route-distance').textContent;
            miniDistance.textContent = distance;
            miniInfo.style.display = 'block';
        } else {
            miniInfo.style.display = 'none';
        }
    }

    updateRouteButton(selectedStart, selectedEnd) {
        const button = document.getElementById('find-route');
        button.disabled = !(selectedStart && selectedEnd);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    locateUser() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation not supported', 'error');
            return;
        }

        const button = document.getElementById('locate-btn');
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                const isWithinCampus = this.mapManager.isWithinCampusBounds(lat, lng);
                
                if (isWithinCampus) {
                    this.mapManager.centerOnLocation(lat, lng, 17);
                    
                    L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'user-location',
                            html: '<div style="width: 16px; height: 16px; background: #f59e0b; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        })
                    }).addTo(this.mapManager.getMap()).bindPopup('📍 Your location').openPopup();
                    
                    this.showToast('Location found', 'success');
                } else {
                    this.mapManager.resetView();
                    this.showToast('You are outside campus area. Showing campus center.', 'info');
                }
            },
            (error) => {
                this.showToast('Unable to get location', 'error');
                this.mapManager.resetView();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );

        button.innerHTML = originalHtml;
    }
}

export default UIManager;