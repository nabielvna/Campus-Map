class ValueDetector {
    constructor(locationManager, uiManager) {
        this.locationManager = locationManager;
        this.uiManager = uiManager;
        this.isInitialized = false;
        this.observers = [];
        this.lastValues = {
            start: '',
            end: ''
        };
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupInputEventListeners();
        this.setupMutationObserver();
        this.setupPeriodicCheck();
        this.setupValidationTriggers();
        
        this.isInitialized = true;
    }

    setupInputEventListeners() {
        const startInput = document.getElementById('start-search');
        const endInput = document.getElementById('end-search');
        
        const events = ['input', 'change', 'paste', 'keyup', 'keydown', 'blur', 'focus'];
        
        events.forEach(eventType => {
            startInput.addEventListener(eventType, () => {
                this.debounce(() => this.validateAndUpdate(), 50);
            });
            
            endInput.addEventListener(eventType, () => {
                this.debounce(() => this.validateAndUpdate(), 50);
            });
        });
    }

    setupMutationObserver() {
        const startInput = document.getElementById('start-search');
        const endInput = document.getElementById('end-search');
        
        const observerConfig = {
            attributes: true,
            attributeFilter: ['value'],
            childList: false,
            subtree: false
        };

        const startObserver = new MutationObserver(() => {
            this.validateAndUpdate();
        });
        startObserver.observe(startInput, observerConfig);
        this.observers.push(startObserver);

        const endObserver = new MutationObserver(() => {
            this.validateAndUpdate();
        });
        endObserver.observe(endInput, observerConfig);
        this.observers.push(endObserver);
    }

    setupPeriodicCheck() {
        setInterval(() => {
            this.checkForChanges();
        }, 500);
    }

    setupValidationTriggers() {
        const originalSelectLocation = this.locationManager.selectLocation.bind(this.locationManager);
        this.locationManager.selectLocation = (...args) => {
            const result = originalSelectLocation(...args);
            this.validateAndUpdate();
            return result;
        };

        const originalClearSelection = this.locationManager.clearSelection.bind(this.locationManager);
        this.locationManager.clearSelection = (...args) => {
            const result = originalClearSelection(...args);
            this.validateAndUpdate();
            return result;
        };

        const originalSwapLocations = this.locationManager.swapLocations.bind(this.locationManager);
        this.locationManager.swapLocations = (...args) => {
            const result = originalSwapLocations(...args);
            this.validateAndUpdate();
            return result;
        };
    }

    checkForChanges() {
        const startInput = document.getElementById('start-search');
        const endInput = document.getElementById('end-search');
        
        const currentValues = {
            start: startInput.value.trim(),
            end: endInput.value.trim()
        };

        if (currentValues.start !== this.lastValues.start || 
            currentValues.end !== this.lastValues.end) {
            
            this.lastValues = currentValues;
            this.validateAndUpdate();
        }
    }

    validateAndUpdate() {
        try {
            const startInput = document.getElementById('start-search');
            const endInput = document.getElementById('end-search');
            const findRouteBtn = document.getElementById('find-route');
            
            if (!startInput || !endInput || !findRouteBtn) return;

            const startValue = startInput.value.trim();
            const endValue = endInput.value.trim();
            
            const selections = this.locationManager.getSelections();
            const hasValidStart = selections.selectedStart && startValue;
            const hasValidEnd = selections.selectedEnd && endValue;
            
            const shouldEnable = hasValidStart && hasValidEnd;
            findRouteBtn.disabled = !shouldEnable;
            
            this.updateVisualFeedback(startInput, hasValidStart);
            this.updateVisualFeedback(endInput, hasValidEnd);
            
        } catch (error) {
            console.error('ValueDetector validation error:', error);
        }
    }

    updateVisualFeedback(input, isValid) {
        const wrapper = input.closest('.search-input-wrapper');
        if (!wrapper) return;
        
        if (input.value.trim() && isValid) {
            wrapper.classList.add('valid');
            wrapper.classList.remove('invalid');
        } else if (input.value.trim() && !isValid) {
            wrapper.classList.add('invalid');
            wrapper.classList.remove('valid');
        } else {
            wrapper.classList.remove('valid', 'invalid');
        }
    }

    debounce(func, wait) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(func, wait);
    }

    forceValidation() {
        this.validateAndUpdate();
    }

    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.isInitialized = false;
    }
}

export default ValueDetector;