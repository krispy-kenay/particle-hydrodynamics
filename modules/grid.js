class Grid {
    constructor(cellSize, dimensions, maxBounds = null) {
        this.cellSize = cellSize;
        this.dimensions = dimensions;
        this.cells = new Map();
        this.preInitialized = maxBounds !== null;
        if (maxBounds !== null) {
            this.maxBounds = maxBounds;
            this._initializeGrid();
        }
    }

    _initializeGrid() {
        const totalCells = this.maxBounds.map(bound => Math.ceil(bound / this.cellSize));
        const generateCoords = function*(dim, current) {
            if (dim === this.dimensions) {
                yield current.slice();
                return;
            }
            for (let i = 0; i < totalCells[dim]; i++) {
                current[dim] = i;
                yield* generateCoords.call(this, dim + 1, current);
            }
        }.bind(this);

        for (let coords of generateCoords(0, new Array(this.dimensions).fill(0))) {
            const hash = coords.join(',');
            this.cells.set(hash, []);
        }
    }

    _hash(point) {
        return point.map(coord => Math.floor(coord / this.cellSize)).join(',');
    }

    _contains(center, box, point) {
        for (let k = 0; k < this.dimensions; k++) {
            if (point[k] < center[k] - box[k] || point[k] > center[k] + box[k]) {
                return false;
            }
        }
        return true;
    }

    insert(index, point) {
        const hash = this._hash(point);
        if (!this.cells.has(hash)) {
            this.cells.set(hash, []);
        }
        this.cells.get(hash).push([index, point]);
    }

    query(rangeCenter, rangeBox, found = []) {
        const minCoords = rangeCenter.map((c, i) => Math.floor((c - rangeBox[i]) / this.cellSize));
        const maxCoords = rangeCenter.map((c, i) => Math.floor((c + rangeBox[i]) / this.cellSize));

        const generateCoords = function*(dim, current) {
            if (dim === this.dimensions) {
                yield current.slice();
                return;
            }
            for (let i = minCoords[dim]; i <= maxCoords[dim]; i++) {
                current[dim] = i;
                yield* generateCoords.call(this, dim + 1, current);
            }
        }.bind(this);

        for (let coords of generateCoords(0, new Array(this.dimensions).fill(0))) {
            const hash = coords.join(',');
            if (this.cells.has(hash)) {
                for (let [index, point] of this.cells.get(hash)) {
                    if (this._contains(rangeCenter, rangeBox, point)) {
                        found.push(index);
                    }
                }
            }
        }
        return found;
    }

    clear() {
        if (this.preInitialized) {
            // Clear the contents of each cell without removing the cells
            for (let cell of this.cells.values()) {
                cell.length = 0;
            }
        } else {
            // Clear the entire map
            this.cells.clear();
        }
    }
}

export { Grid }