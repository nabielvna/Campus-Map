from flask import Flask, render_template, request, jsonify
import pandas as pd
from shapely import wkt
import heapq
import math
import os
from haversine import haversine, Unit

app = Flask(__name__)

# Load graph.csv dan nodes.csv 
BASE_DATA_DIR = 'data'
graph_path = os.path.join(BASE_DATA_DIR, 'graph.csv')
nodes_path = os.path.join(BASE_DATA_DIR, 'nodes.csv')

print("Loading graph data...")
df = pd.read_csv(graph_path)
nodes_df = pd.read_csv(nodes_path)

# Parse graph data 
weight = {} 
edge_geom = {}   

for _, row in df.iterrows():
    u, v = int(row['from']), int(row['to'])
    w = float(row['weight'])
    weight.setdefault(u, {})[v] = w

    # parse WKT → koordinat (lon,lat) → (lat,lon)
    try:
        geom = wkt.loads(row['geometry'])
        coords = [(lat, lon) for lon, lat in geom.coords]
        edge_geom[(u, v)] = coords
    except:
        edge_geom[(u, v)] = []

nodes_list = []
node_coords = {}  

for _, row in nodes_df.iterrows():
    node_id = int(row['node_id'])
    lat = float(row['y'])
    lng = float(row['x'])
    
    node_data = {
        'id': node_id,
        'lat': lat,
        'lng': lng,
        'name': row['name'] if pd.notna(row['name']) else f"Node {node_id}"
    }
    nodes_list.append(node_data)
    node_coords[node_id] = (lat, lng)

# Sort nodes
nodes_list.sort(key=lambda x: (pd.isna(x['name']) or x['name'].startswith('Node'), x['name']))

print(f"Loaded {len(df)} edges and {len(nodes_list)} nodes")
print(f"Named locations: {len([n for n in nodes_list if not n['name'].startswith('Node')])}")

# Main route
@app.route('/')
def index():
    return render_template('index.html', nodes=nodes_list)

# Node route
@app.route('/nodes')
def get_nodes():
    named_nodes = [n for n in nodes_list if not n['name'].startswith('Node')]
    return jsonify(named_nodes)

# Heuristic
def heuristic(node1, node2):
    if node1 not in node_coords or node2 not in node_coords:
        return 0
    
    lat1, lng1 = node_coords[node1]
    lat2, lng2 = node_coords[node2]
    
    point1 = (lat1, lng1)
    point2 = (lat2, lng2)
    
    # Calculate distance in meters
    distance = haversine(point1, point2, unit=Unit.METERS)
    
    return distance

# A* Algorithm
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
                
                # If this path to neighbor is better than any previous one
                if neighbor not in g_scores or tentative_g_score < g_scores[neighbor]:
                    g_scores[neighbor] = tentative_g_score
                    h_score = heuristic(neighbor, end)
                    f_score = tentative_g_score + h_score
                    f_scores[neighbor] = f_score
                    
                    heapq.heappush(queue, (f_score, tentative_g_score, neighbor, path + [neighbor]))
    
    return None

# Get node route
@app.route('/route')
def route():
    try:
        start = int(request.args.get('start'))
        end = int(request.args.get('end'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid node IDs'}), 400

    path = astar(start, end)

    if not path:
        return jsonify({'error': 'No route found between selected locations'}), 404

    coords = []
    total_distance = 0
    
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        seg = edge_geom.get((u, v), [])
        
        if u in weight and v in weight[u]:
            total_distance += weight[u][v]
        
        if coords and seg and coords[-1] == seg[0]:
            seg = seg[1:]
        coords.extend(seg)

    start_node = next((n for n in nodes_list if n['id'] == start), None)
    end_node = next((n for n in nodes_list if n['id'] == end), None)

    walking_speed_ms = 5000 / 3600
    walking_time_seconds = total_distance / walking_speed_ms
    
    if walking_time_seconds < 60:
        walking_time = f"{int(walking_time_seconds)}s"
    elif walking_time_seconds < 3600:
        walking_time = f"{int(walking_time_seconds / 60)}min"
    else:
        hours = int(walking_time_seconds // 3600)
        minutes = int((walking_time_seconds % 3600) // 60)
        walking_time = f"{hours}h {minutes}min"

    return jsonify({
        'path': path,
        'coords': coords,
        'distance': round(total_distance, 1),
        'walking_time': walking_time,
        'start_info': start_node,
        'end_info': end_node,
        'success': True
    })

if __name__ == '__main__':
    app.run(debug=True)