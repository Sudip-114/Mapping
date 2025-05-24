let map;
let markers = [];
let edges = [];
let graph = {};

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 22.5726, lng: 88.3639 },
        zoom: 13,
    });

    map.addListener("click", (e) => {
        addMarker(e.latLng);
    });
}

function addMarker(position) {
    const marker = new google.maps.Marker({
        position,
        map,
        label: `${markers.length}`,
    });

    markers.push(marker);
    graph[position.toUrlValue()] = [];

    if (markers.length > 1) {
        const prev = markers[markers.length - 2];
        const dist = google.maps.geometry.spherical.computeDistanceBetween(
            prev.getPosition(),
            marker.getPosition()
        );

        const edge = new google.maps.Polyline({
            path: [prev.getPosition(), marker.getPosition()],
            geodesic: true,
            strokeColor: "#999",
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map,
        });

        edges.push(edge);

        const from = prev.getPosition().toUrlValue();
        const to = marker.getPosition().toUrlValue();

        graph[from].push({ node: to, weight: dist });
        graph[to].push({ node: from, weight: dist });
    }
}

function computePath() {
    if (markers.length < 2) {
        document.getElementById("output").innerText = "Add at least 2 markers.";
        return;
    }

    const start = markers[0].getPosition().toUrlValue();
    const end = markers[markers.length - 1].getPosition().toUrlValue();
    const result = dijkstra(graph, start, end);

    if (result.path.length === 0) {
        document.getElementById("output").innerText = "No path found.";
        return;
    }

    document.getElementById("output").innerText =
        `Shortest Path: ${result.path.join(" → ")}\nDistance: ${Math.round(result.distance)} meters`;

    // Draw path
    for (let i = 0; i < result.path.length - 1; i++) {
        const pos1 = toLatLng(result.path[i]);
        const pos2 = toLatLng(result.path[i + 1]);

        new google.maps.Polyline({
            path: [pos1, pos2],
            geodesic: true,
            strokeColor: "#00cc00",
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map,
        });
    }
}

function toLatLng(str) {
    const [lat, lng] = str.split(",").map(Number);
    return new google.maps.LatLng(lat, lng);
}

function dijkstra(graph, start, end) {
    const distances = {};
    const prev = {};
    const visited = new Set();
    const queue = new Set(Object.keys(graph));

    for (let node in graph) {
        distances[node] = Infinity;
        prev[node] = null;
    }
    distances[start] = 0;

    while (queue.size) {
        let minNode = null;
        for (let node of queue) {
            if (minNode === null || distances[node] < distances[minNode]) {
                minNode = node;
            }
        }

        if (minNode === end) break;
        queue.delete(minNode);
        visited.add(minNode);

        for (let neighbor of graph[minNode]) {
            if (!visited.has(neighbor.node)) {
                const alt = distances[minNode] + neighbor.weight;
                if (alt < distances[neighbor.node]) {
                    distances[neighbor.node] = alt;
                    prev[neighbor.node] = minNode;
                }
            }
        }
    }

    const path = [];
    let current = end;
    while (current) {
        path.unshift(current);
        current = prev[current];
    }

    if (distances[end] === Infinity) return { path: [], distance: Infinity };
    return { path, distance: distances[end] };
}
