self.onmessage = function(event) {
    let points = event.data.points;
    let octree = event.data.octree;
    let dt = event.data.dt;
    let g = event.data.g;
    let damping = event.data.damping;
    let maxspeed = event.data.maxspeed;
    console.log(octree)

    let updatedPoints = updatePositions(points, octree, dt, g, damping, maxspeed);
    self.postMessage(updatedPoints)
}

