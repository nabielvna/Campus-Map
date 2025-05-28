import os
import osmnx as ox
import pandas as pd
from shapely import wkt
from shapely.geometry import LineString
from haversine import haversine

ox.settings.use_cache = True
ox.settings.cache_folder = "osmnx_cache"

north, south, east, west = -7.27414, -7.29019, 112.80152, 112.78972

out_dir = '../campus_map_app'
os.makedirs(out_dir, exist_ok=True)
graphml_path = os.path.join(out_dir, 'campus_graph.graphml')
osm_xml_path = 'osm_map'

# Local XML -> cache GraphML -> Overpass API
if os.path.exists(osm_xml_path):
    print(f"Loading graph from local OSM XML file {osm_xml_path}...")
    G = ox.graph_from_xml(osm_xml_path)
elif os.path.exists(graphml_path):
    print(f"Loading graph from cache GraphML {graphml_path}...")
    G = ox.load_graphml(graphml_path)
else:
    print("Downloading graph from Overpass API...")
    G = ox.graph_from_bbox(
        bbox=(north, south, east, west),
        network_type='drive',
        simplify=True,
        retain_all=False,
        custom_filter='["highway"~"primary|secondary|tertiary|residential"]'
    )
    print(f"Saving graph to cache GraphML {graphml_path}...")
    ox.save_graphml(G, graphml_path)

print(f"Graph loaded successfully with {len(G.nodes)} nodes and {len(G.edges)} edges.")

def load_custom_nodes(csv_path):
    if not os.path.exists(csv_path):
        print(f"Warning: {csv_path} not found. Skipping custom nodes.")
        return pd.DataFrame(columns=['WKT', 'name', 'geom'])
    
    df = pd.read_csv(csv_path)
    if 'WKT' not in df.columns or 'name' not in df.columns:
        raise ValueError("File CSV harus berisi kolom 'WKT' dan 'name'.")
    df['geom'] = df['WKT'].apply(wkt.loads)
    return df

custom_nodes = load_custom_nodes('nodes.csv')

def get_nearest_node(lon, lat):
    """
    Mencari node terdekat secara manual menggunakan haversine distance
    """
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

# 6) Add custom nodes to the graph
if not custom_nodes.empty:
    max_id = max(G.nodes) if G.nodes else 0
    added_nodes = 0
    
    for i, row in custom_nodes.iterrows():
        try:
            new_id = max_id + 1 + i
            pt = row['geom']
            lon, lat = pt.x, pt.y
            
            print(f"Processing custom node: {row['name']} at ({lat:.6f}, {lon:.6f})")
            
            # Find nearest OSM node 
            nearest = get_nearest_node(lon, lat)
            if nearest is None:
                print(f"Warning: Could not find nearest node for {row['name']}")
                continue
                
            osm_lat = G.nodes[nearest]['y']
            osm_lon = G.nodes[nearest]['x']
            dist_m = haversine((lat, lon), (osm_lat, osm_lon)) * 1000
            
            print(f"  -> Nearest OSM node: {nearest} at ({osm_lat:.6f}, {osm_lon:.6f}), distance: {dist_m:.1f}m")
            
            # Add new node
            G.add_node(new_id, x=lon, y=lat, name=row['name'])
            
            # Create connecting edge 
            line = LineString([(lon, lat), (osm_lon, osm_lat)])
            rev = LineString(line.coords[::-1])
            # Add bidirectional edges
            G.add_edge(new_id, nearest, length=dist_m, geometry=line)
            G.add_edge(nearest, new_id, length=dist_m, geometry=rev)
            
            added_nodes += 1
            
        except Exception as e:
            print(f"Error processing node {row['name']}: {e}")
            continue
    
    print(f"Successfully added {added_nodes} custom nodes to the graph.")
else:
    print("No custom nodes to add.")

# 7) Export graph to CSV
print("Exporting graph to CSV...")
_, edges_gdf = ox.graph_to_gdfs(G)

print(f"Available columns in edges_gdf: {list(edges_gdf.columns)}")
print(f"Index names: {edges_gdf.index.names}")

# Try to extract 'u', 'v' columns or index
if 'u' in edges_gdf.columns and 'v' in edges_gdf.columns:
    edges_df = edges_gdf[['u','v','length','geometry']].rename(
        columns={'u':'from','v':'to','length':'weight'}
    )
elif edges_gdf.index.names == ['u', 'v', 'key']:
    edges_df = edges_gdf.reset_index()[['u','v','length','geometry']].rename(
        columns={'u':'from','v':'to','length':'weight'}
    )
else:
    edges_df = edges_gdf.reset_index()
    from_col = next((col for col in ['u', 'from', 'source'] if col in edges_df.columns), edges_df.columns[0])
    to_col = next((col for col in ['v', 'to', 'target'] if col in edges_df.columns), edges_df.columns[1])
    length_col = next((col for col in ['length', 'weight', 'distance'] if col in edges_df.columns), 'length')
    
    cols_to_use = [from_col, to_col]
    if length_col in edges_df.columns:
        cols_to_use.append(length_col)
    if 'geometry' in edges_df.columns:
        cols_to_use.append('geometry')
    
    edges_df = edges_df[cols_to_use].rename(columns={
        from_col: 'from',
        to_col: 'to',
        length_col: 'weight'
    })

if 'geometry' in edges_df.columns:
    edges_df['geometry'] = edges_df['geometry'].apply(lambda g: g.wkt if hasattr(g, 'wkt') else str(g))

csv_path = os.path.join(out_dir, 'graph.csv')
edges_df.to_csv(csv_path, index=False)
print(f"graph.csv created with {len(edges_df)} edges → {csv_path}")

print("Exporting nodes to CSV...")
nodes_gdf, _ = ox.graph_to_gdfs(G)
nodes_df = nodes_gdf[['x', 'y']].copy()
if 'name' in nodes_gdf.columns:
    nodes_df['name'] = nodes_gdf['name']
else:
    nodes_df['name'] = None
    
if not custom_nodes.empty:
    max_id = max([n for n in G.nodes if isinstance(n, int)]) - len(custom_nodes) if G.nodes else 0
    for i, row in custom_nodes.iterrows():
        node_id = max_id + 1 + i
        if node_id in nodes_df.index:
            nodes_df.loc[node_id, 'name'] = row['name']

nodes_csv_path = os.path.join(out_dir, 'nodes.csv')
nodes_df.to_csv(nodes_csv_path, index_label='node_id')
print(f"nodes.csv created with {len(nodes_df)} nodes → {nodes_csv_path}")

print("Graph processing completed successfully!")