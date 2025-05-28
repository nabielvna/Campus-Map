from flask import Flask, render_template, request, jsonify
import pandas as pd
from shapely import wkt
import heapq
import os

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

# Parse nodes 
nodes_list = []
for _, row in nodes_df.iterrows():
    node_data = {
        'id': int(row['node_id']),
        'lat': float(row['y']),
        'lng': float(row['x']),
        'name': row['name'] if pd.notna(row['name']) else f"Node {row['node_id']}"
    }
    nodes_list.append(node_data)

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

# Dijkstra 
def dijkstra(start, end):
    if start not in weight or end not in weight:
        return None
        
    queue = [(0, start, [start])]
    visited = set()
    distances = {start: 0}

    while queue:
        dist, node, path = heapq.heappop(queue)
        
        if node == end:
            return path
            
        if node in visited:
            continue
            
        visited.add(node)

        for neighbor, edge_weight in weight.get(node, {}).items():
            if neighbor not in visited:
                new_dist = dist + edge_weight
                if neighbor not in distances or new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    heapq.heappush(queue, (new_dist, neighbor, path + [neighbor]))
    
    return None

# Get node route
@app.route('/route')
def route():
    try:
        start = int(request.args.get('start'))
        end = int(request.args.get('end'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid node IDs'}), 400

    path = dijkstra(start, end)

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