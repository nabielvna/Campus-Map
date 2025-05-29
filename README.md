# ITS Navigator 🗺️

**Web-Based Campus Navigation System for Institut Teknologi Sepuluh Nopember (ITS)**

[![Python](https://img.shields.io/badge/Python-3.12.3-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.1-green.svg)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-brightgreen.svg)](https://leafletjs.com/)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Data-orange.svg)](https://www.openstreetmap.org/)

## 🏗️ System Architecture

### **Backend Architecture**
```
📦 Backend (Python/Flask)
├── 🗃️ Data Processing Layer
│   ├── OSM Data Parser (osmnx)
│   ├── Graph Builder
│   └── Custom Nodes Integration
├── 🧠 Algorithm Layer  
│   ├── Dijkstra Pathfinding
│   └── Haversine Distance Calculation
├── 🌐 API Layer
│   ├── RESTful Endpoints
│   └── JSON Response Handler
└── 📊 Data Layer
    ├── Graph CSV Export
    ├── Nodes Management
    └── Geometry Processing
```

### **Frontend Architecture**
```
📦 Frontend (JavaScript/ES6 Modules)
├── 🎛️ Core Managers
│   ├── MapManager (Leaflet integration)
│   ├── LocationManager (Location handling)
│   ├── RouteManager (Route visualization)
│   └── UIManager (Interface management)
├── 🔧 Utility Modules
│   ├── AutocompleteManager (Search functionality)
│   ├── EventHandlers (User interactions)
│   └── ValueDetector (Input validation)
└── ⚙️ Configuration
    └── Config (App settings & constants)
```

## 🚀 Installation & Setup

### **1. Clone Repository**
```bash
git clone https://github.com/nabielvna/Campus-Map.git
cd Campus-Map
```

### **2. Setup Python Environment**
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r campus_map_app/requirements.txt
```

### **3. Data Preparation**
```bash
# Run graph processing script
python nodes_to_graph.py
```

**This script will:**
- Download OSM data for ITS campus area if no local data provided
- Process data into navigation graph
- Generate `graph.csv` and `nodes.csv` files
- Cache data for subsequent use

### **4. Prepare Custom Locations**
Create `nodes.csv` file with format: (I personally use google maps data [Google Maps](https://www.google.com/maps/d/). You can customize your own)
```csv
WKT,name
"POINT(112.7930 -7.2775)",Rectorate Building
"POINT(112.7925 -7.2780)",ITS Library
"POINT(112.7935 -7.2770)",Student Center
```

### **5. Run Application**
```bash
python app.py
```

Application will run at: `http://localhost:5000`

## 📁 Project Structure

```
CAMPUS-MAP/
├── 📁 venv/                                   # Python virtual environment
├── 📁 campus_map_app/                         # Main application directory
│   ├── 📁 data/                               # Generated data files
│   │   ├── 📄 graph.csv                       # Road network graph data
│   │   └── 📄 nodes.csv                       # Location nodes data
│   ├── 📁 static/                             # Static web assets
│   │   ├── 📁 css/                            # Stylesheets
│   │   │   └── 📄 style.css                   # Main application styles
│   │   └── 📁 js/                             # JavaScript modules
│   │       ├── 📄 autocompleteManager.js      # Search functionality
│   │       ├── 📄 config.js                   # Configuration constants
│   │       ├── 📄 eventHandlers.js            # Event management
│   │       ├── 📄 locationManager.js          # Location handling
│   │       ├── 📄 main.js                     # Application entry point
│   │       ├── 📄 mapManager.js               # Map functionality
│   │       ├── 📄 routeManager.js             # Route management
│   │       ├── 📄 uiManager.js                # UI interactions
│   │       └── 📄 valueDetector.js            # Input validation
│   └── 📁 templates/                          # HTML templates
│       └── 📄 index.html                      # Main HTML template
├── 📄 app.py                                  # Flask backend server
├── 📄 requirements.txt                        # Python dependencies
├── 📁 data_builder/                           # Data processing tools
│   ├── 📄 nodes_to_graph.py                   # Graph processing script
│   ├── 📄 nodes.csv                           # Custom campus locations
│   └── 📄 osm_map                             # OSM map data
└── 📄 .gitignore                              # Git ignore file
```

## 🔧 Configuration

### **Campus Boundaries** (`config.js`)
```javascript
export const CAMPUS_BOUNDS = {
    north: -7.27414,   // Campus northern boundary
    south: -7.29019,   // Campus southern boundary  
    east: 112.80152,   // Campus eastern boundary
    west: 112.78972,   // Campus western boundary
    center: [-7.2775, 112.7930]  // Campus center
};
```

### **Map Configuration**
```javascript
export const MAP_CONFIG = {
    minZoom: 16,        // Minimum zoom level
    maxZoom: 19,        // Maximum zoom level
    initialZoom: 16,    // Initial zoom level
    maxBoundsViscosity: 0.8  // Boundary elasticity
};
```

### **Color Scheme**
```javascript
export const MARKER_COLORS = {
    start: '#10b981',    // Green for start point
    end: '#ef4444',      // Red for end point  
    location: '#6366f1'  // Blue for location markers
};
```

## 🛠️ API Endpoints

### **GET /** 
- **Description**: Main application page
- **Response**: HTML template with location data

### **GET /nodes**
- **Description**: Get list of all campus locations
- **Response**:
```json
[
  {
    "id": 1,
    "name": "Rectorate Building",
    "lat": -7.2775,
    "lng": 112.7930
  }
]
```

### **GET /route**
- **Parameters**: 
  - `start`: Starting location ID
  - `end`: Destination location ID
- **Response**:
```json
{
  "path": [1, 2, 3, 4],
  "coords": [[-7.2775, 112.7930], [-7.2780, 112.7925]],
  "distance": 245.5,
  "walking_time": "3min",
  "start_info": {"id": 1, "name": "Start Location"},
  "end_info": {"id": 4, "name": "End Location"},
  "success": true
}
```

## 💡 Algorithms & Implementation

### **A (A-star) Algorithm**
A* algorithm implementation for finding optimal shortest path using heuristic search:

```python
def astar(start, end):
    if start not in weight or end not in weight:
        return None
    
    # Priority queue: (f_score, g_score, node, path)
    queue = [(heuristic(start, end), 0, start, [start])]
    visited = set()
    g_scores = {start: 0} 
    f_scores = {start: heuristic(start, end)} 

    while queue:
        f_score, g_score, node, path = heapq.heappop(queue)
        
        if node == end:
            return path
            
        if node in visited:
            continue
            
        visited.add(node)

        for neighbor, edge_weight in weight.get(node, {}).items():
            if neighbor not in visited:
                tentative_g_score = g_score + edge_weight
                
                if neighbor not in g_scores or tentative_g_score < g_scores[neighbor]:
                    g_scores[neighbor] = tentative_g_score
                    h_score = heuristic(neighbor, end)
                    f_score = tentative_g_score + h_score
                    f_scores[neighbor] = f_score
                    
                    heapq.heappush(queue, (f_score, tentative_g_score, neighbor, path + [neighbor]))
    
    return None
```

### **Haversine Distance Calculation**
For calculating accurate distances between coordinates:

For A*
```python
def heuristic(node1, node2):
    if node1 not in node_coords or node2 not in node_coords:
        return 0
    
    lat1, lng1 = node_coords[node1]
    lat2, lng2 = node_coords[node2]
    
    point1 = (lat1, lng1)
    point2 = (lat2, lng2)
    
    distance = haversine(point1, point2, unit=Unit.METERS)
    
    return distance
```

To incorporate custom nodes into the graph
```python
def get_nearest_node(lon, lat):
    min_distance = float('inf')
    nearest_node = None
    
    for node_id, node_data in G.nodes(data=True):
        node_lat = node_data['y']
        node_lon = node_data['x']
        
        # Haversine distance
        distance = haversine((lat, lon), (node_lat, node_lon))
        
        if distance < min_distance:
            min_distance = distance
            nearest_node = node_id
    
    return nearest_node
```

## 🔄 Updates & Improvements

### **Algorithm Enhancement: Dijkstra → A***

**Previous Implementation**
- Used **Dijkstra algorithm** for pathfinding
- Uninformed search - explores all directions equally
- Guaranteed optimal path but slower performance
- No heuristic guidance for search direction

**Current Implementation**
- Upgraded to **A* (A-star) algorithm** with haversine heuristic
- Informed search - prioritizes promising directions
- Maintains optimal path guarantee with better performance
- Uses geographical distance as intelligent guidance

### **Key Improvements Made**

#### **1. Performance Enhancement**
```python
# Before: Dijkstra - O((V + E) log V)
def dijkstra(start, end):
    # Explores nodes uniformly in all directions
    # No guidance toward goal
    
# After: A* - O(b^d) where b is branching factor, d is depth
def astar(start, end):
    # Uses heuristic to guide search toward goal
    # Dramatically reduces nodes explored
```
