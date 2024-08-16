// Generalized Box structure (that can be a Quboid in 3D or a Rectangle in 2D)
class Box {
    constructor(center, box, dimensions) {
        this.center = center;
        this.box = box;
        this.dimensions = dimensions;
    }

    contains(point) {
        for (let k = 0; k < this.dimensions; k++) {
            if (point[k] < this.center[k] - this.box[k] || point[k] > this.center[k] + this.box[k]) {
                return false;
            }
        }
        return true;
    }

    intersects(range) {
        for (let k = 0; k < this.dimensions; k++) {
            if (range.center[k] - range.box[k] >= this.center[k] + this.box[k] || range.center[k] + range.box[k] <= this.center[k] - this.box[k]) {
                return false;
            }
        }
        return true;
    }
}

// Generalized multi dimensional k-tree structure
class Tree {
    constructor(boundary, capacity, dimensions) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
        this.dimensions = dimensions;
        this.children = [];
    }

    insert(index, point) {
        // Check whether the point is within the boundary
        if (!this.boundary.contains(point)) {
            return false;
        }
        // Check whether there is capacity to add another point
        if (this.points.length < this.capacity) {
            this.points.push([index, point]);
            return true;
        } else {
            // Subdivide the space if over capacity
            if (!this.divided) {
                this.subdivide();
            }
            // If it already has been subdivided, recursively find a box with capacity to insert the point into
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].insert(index, point)) {
                    return true;
                }
            }
        }
    }

    subdivide() {
        let newBoxSize = this.boundary.box.map(x => x / 2);
        let combinations = this.getCombinations(this.dimensions);
        for (let i = 0; i < combinations.length; i++) {
            let newCenter = this.boundary.center.map((x, index) => x + newBoxSize[index] * combinations[i][index] / 2);
            let newBox = new Box(newCenter, newBoxSize, this.dimensions);
            this.children[i] = new Tree(newBox, this.capacity, this.dimensions);
        }
        this.divided = true;
    }

    getCombinations(dimensions) {
        return Array.from({length: Math.pow(2, dimensions)}, (v, i) => i.toString(2).padStart(dimensions, '0').split('').map(x => parseInt(x) * 2 - 1));
    }

    query(range, found) {
        if (!found) {
            found = [];
        }

        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (let i = 0; i < this.points.length; i++) {
            if (range.contains(this.points[i][1])) {
                found.push(this.points[i][0])
            }
        }

        if (this.divided) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].query(range, found);
            }
        }
        return found;
    }

    clear() {
        this.points = [];
        if (this.divided) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].clear();
            }
            this.children = [];
        }
        this.divided = false;
    }
}

export {Tree, Box}