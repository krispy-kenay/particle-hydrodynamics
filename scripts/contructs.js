import { densityKernel,nearDensityKernel,densityKernelDerivative,nearDensityKernelDerivative } from "./kernels.js";

// Color map
const velocityColor = [0x2736b9,0x0043c3,0x0056ae,0x0060a5,0x0067a3,0x006ea4,0x0075a6,0x007ba9,0x0082ac,0x0089af,0x0090b2,0x0097b4,0x009eb6,0x00a6b7,0x00aeb8,0x00b6b7,0x00beb5,0x00c7b2,0x00cead,0x1cd4a9,0x1cd4a9,0x35da9f,0x4ddf93,0x64e486,0x7be878,0x92ec6a,0xabef5b,0xc4f14d,0xdef140,0xf8f135,0xf8f135,0xf8e92f,0xf8e129,0xf8d924,0xf7d11f,0xf6c91b,0xf5c117,0xf4b914,0xf2b212,0xf0aa11,0xeea211,0xec9a11,0xea9212,0xe78b13,0xe48315];


export class Quboid {
    constructor(center, box) {
        this.center = center; //Center point
        this.box = box; //Half width box
    }
    contains(point) {
        let x = point[0] >= this.center[0] - this.box[0] && point[0] < this.center[0] + this.box[0];
        let y = point[1] >= this.center[1] - this.box[1] && point[1] < this.center[1] + this.box[1];
        let z = point[2] >= this.center[2] - this.box[2] && point[2] < this.center[2] + this.box[2];
        return x && y && z;
    }
    intersects(range) {
        let x = range.center[0] - range.box[0] > this.center[0] + this.box[0] || range.center[0] + range.box[0] < this.center[0] - this.box[0];
        let y = range.center[1] - range.box[1] > this.center[1] + this.box[1] || range.center[1] + range.box[1] < this.center[1] - this.box[1];
        let z = range.center[2] - range.box[2] > this.center[2] + this.box[2] || range.center[2] + range.box[2] < this.center[2] - this.box[2];
        return !(x || y || z);
    }
}

export class Octree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }
    insert(index, point) {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push([index, point]);
            return true;
        } else {
            if (!this.divided) {
                this.subdivide();
            }
            if (this.northwestup.insert(index, point)) return true;
            if (this.northeastup.insert(index, point)) return true;
            if (this.southwestup.insert(index, point)) return true;
            if (this.southeastup.insert(index, point)) return true;
            if (this.northwestdown.insert(index, point)) return true;
            if (this.northeastdown.insert(index, point)) return true;
            if (this.southwestdown.insert(index, point)) return true;
            if (this.southeastdown.insert(index, point)) return true;
        }
    }
    subdivide() {
        let x = this.boundary.center[0];
        let y = this.boundary.center[1];
        let z = this.boundary.center[2];
        let hx = this.boundary.box[0] / 2;
        let hy = this.boundary.box[1] / 2;
        let hz = this.boundary.box[2] / 2;
        let nwu = new Quboid([x-hx,y-hy,z+hz],[hx,hy,hz]);
        this.northwestup = new Octree(nwu, this.capacity);
        let neu = new Quboid([x+hx,y-hy,z+hz],[hx,hy,hz]);
        this.northeastup = new Octree(neu, this.capacity);
        let swu = new Quboid([x-hx,y+hy,z+hz],[hx,hy,hz]);
        this.southwestup = new Octree(swu, this.capacity);
        let seu = new Quboid([x+hx,y+hy,z+hz],[hx,hy,hz]);
        this.southeastup = new Octree(seu, this.capacity);
    
        let nwd = new Quboid([x-hx,y-hy,z-hz],[hx,hy,hz]);
        this.northwestdown = new Octree(nwd, this.capacity);
        let ned = new Quboid([x+hx,y-hy,z-hz],[hx,hy,hz]);
        this.northeastdown = new Octree(ned, this.capacity);
        let swd = new Quboid([x-hx,y+hy,z-hz],[hx,hy,hz]);
        this.southwestdown = new Octree(swd, this.capacity);
        let sed = new Quboid([x+hx,y+hy,z-hz],[hx,hy,hz]);
        this.southeastdown = new Octree(sed, this.capacity);
    
        this.divided = true;
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
                found.push(this.points[i][0]);
            }
        }
        if (this.divided) {
            this.northwestup.query(range, found);
            this.northeastup.query(range, found);
            this.southwestup.query(range, found);
            this.southeastup.query(range, found);
            this.northwestdown.query(range, found);
            this.northeastdown.query(range, found);
            this.southwestdown.query(range, found);
            this.southeastdown.query(range, found);
        } 
        return found;
    }
    clear() {
        this.points = [];
        if (this.divided) {
            this.northwestup.clear();
            this.northeastup.clear();
            this.southwestup.clear();
            this.southeastup.clear();
            this.northwestdown.clear();
            this.northeastdown.clear();
            this.southwestdown.clear();
            this.southeastdown.clear();
        }
        this.divided = false;
    }
}

// storage object
export class Point {
    constructor(position, previous_position, acceleration, mesh, radius, mass, density, color) {
        this.pos = position;
        this.posp = previous_position;
        this.acc = acceleration;
        this.mesh = mesh;
        this.radius = radius;
        this.mass = mass;
        this.density = density;
        this.color = color;
    }
    applyGravity(g) {
        this.acc[1] += -g * this.mass;
    }
    applyVelocity(dt, maxspeed) {
        let velocity = 0;
        for (let k = 0; k < this.pos.length; k++) {
            let dispersion =(this.pos[k] - this.posp[k]);
            if (dispersion > maxspeed) {
                dispersion = maxspeed;
            } else if (dispersion < -maxspeed) {
                dispersion = -maxspeed
            }
            velocity += Math.abs(dispersion);
            this.posp[k] = this.pos[k];
            this.pos[k] = this.pos[k] + dispersion + 0.5* this.acc[k] * (dt*dt);
            this.acc[k] = 0;
        }
        this.color = velocityColor[parseInt(45*velocity / (maxspeed * 2))];
    }
    applyConstraints(mx, my, mz, damping) {
        let maxima = [mx, my, mz]
        for (let k = 0; k < this.pos.length; k++) {
            if (this.pos[k] > maxima[k]) {
                this.posp[k] = maxima[k] - (this.posp[k] - maxima[k]);
                this.pos[k] = maxima[k] - (this.pos[k] - maxima[k]) * damping;
                for (let l = 0; l < this.pos.length; l++) {
                    if (k == l) {continue}
                    this.pos[l] = this.posp[l] + (this.pos[l] - this.posp[l]) * damping;
                }
            } else if (this.pos[k] < 0) {
                this.posp[k] *= -1;
                this.pos[k] *= -1 * damping;
                for (let l = 0; l < this.pos.length; l++) {
                    if (k == l) {continue}
                    this.pos[l] = this.posp[l] + (this.pos[l] - this.posp[l]) * damping;
                }
            }
        }
    }
    /*avoidCollision(index, points, damping) {
        for (let j = 0; j < points.length; j++) {
            let that = points[j];
            let dx = this.pos[0] - that.pos[0];
            let dy = this.pos[1] - that.pos[1];
            let dz = this.pos[2] - that.pos[2];
            let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            let minDistance = this.radius + that.radius;
            let penetration = minDistance - distance;
            let n = [dx/distance, dy/distance, dz/distance];
            let separation = penetration / 2;
            if (index == j) {continue;}
            if (distance < minDistance) {
                this.pos[0] += separation * n[0];
                this.pos[1] += separation * n[1];
                this.pos[2] += separation * n[2];
                that.pos[0] -= separation * n[0];
                that.pos[1] -= separation * n[1];
                that.pos[2] -= separation * n[2];
                // Calculate impulse
                let velocity = ((this.pos[0] - this.posp[0]) - (that.pos[0] - that.posp[0]))*n[0] + ((this.pos[1] - this.posp[1]) - (that.pos[1] - that.posp[1]))*n[1] + ((this.pos[2] - this.posp[2]) - (that.pos[2] - that.posp[2]))*n[2];
                if (velocity > 0) {continue;}
                let impulse = -(1 + damping) * velocity;
                impulse /= (1 / this.mass) + (1 / that.mass);
                this.posp[0] -= impulse * n[0] / this.mass;
                this.posp[1] -= impulse * n[1] / this.mass;
                this.posp[2] -= impulse * n[2] / this.mass;
                that.posp[0] += impulse * n[0] / that.mass;
                that.posp[1] += impulse * n[1] / that.mass;
                that.posp[2] += impulse * n[2] / that.mass;
            }
        }
    }*/
    avoidCollisions(index, points, octree, damping) {
        let range = new Quboid(this.pos, [this.radius*2, this.radius*2, this.radius*2])
        let pointsInRange = octree.query(range, []);

        for (let j = 0; j < pointsInRange.length; j++) {
            if (index == j) {continue;}
            let that = points[pointsInRange[j]];
            let d = [this.pos[0] - that.pos[0], this.pos[1] - that.pos[1], this.pos[2] - that.pos[2]];
            let distance = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
            let minDistance = this.radius + that.radius;
            if (distance >= minDistance) {continue;}
            //if (distance == 0) {continue;}
            if (distance == 0) {
                // Apply a small random displacement
                let epsilon = 0.001; // Small value
                this.pos[0] += epsilon * (Math.random() - 0.5);
                this.pos[1] += epsilon * (Math.random() - 0.5);
                this.pos[2] += epsilon * (Math.random() - 0.5);
                continue;
            }
            let penetration = minDistance - distance;
            let n = [d[0]/distance, d[1]/distance, d[2]/distance];
            let separation = penetration / 2;
            // Push particles away from each other
            this.pos[0] += separation * n[0];
            this.pos[1] += separation * n[1];
            this.pos[2] += separation * n[2];
            that.pos[0] -= separation * n[0];
            that.pos[1] -= separation * n[1];
            that.pos[2] -= separation * n[2];
            // Calculate impulse
            let velocity = ((this.pos[0] - this.posp[0]) - (that.pos[0] - that.posp[0]))*n[0] + ((this.pos[1] - this.posp[1]) - (that.pos[1] - that.posp[1]))*n[1] + ((this.pos[2] - this.posp[2]) - (that.pos[2] - that.posp[2]))*n[2];
            if (velocity > 0) {continue;}
            let impulse = -(1 + damping) * velocity;
            impulse /= (1 / this.mass) + (1 / that.mass);
            this.posp[0] -= impulse * n[0] / this.mass;
            this.posp[1] -= impulse * n[1] / this.mass;
            this.posp[2] -= impulse * n[2] / this.mass;
            that.posp[0] += impulse * n[0] / that.mass;
            that.posp[1] += impulse * n[1] / that.mass;
            that.posp[2] += impulse * n[2] / that.mass;
        }
    }
    calculateDensity(index, points, octree, smoothingradius) {
        let range = new Quboid(this.pos, [smoothingradius, smoothingradius, smoothingradius])
        let pointsInRange = octree.query(range, []);
        let sqradius = smoothingradius**2;
        this.density[0] = 0;
        this.density[1] = 0;
        for (let j = 0; j < pointsInRange.length; j++) {
            if (index == j) {continue;}
            let that = points[pointsInRange[j]];
            
            let sqdist = sqrMagnitude([that.pos[0] - this.pos[0], that.pos[1] - this.pos[1], that.pos[2] - this.pos[2]]);
            if (sqdist >= sqradius) {continue;}
            let distance = Math.sqrt(sqdist);
            if (distance == 0) {continue;}

            this.density[0] += this.mass * densityKernel(distance, smoothingradius);
            this.density[1] += this.mass * nearDensityKernel(distance, smoothingradius);
        }
        
    }
    calculatePressureForce(index, points, octree, smoothingradius, targetdensity, pressuremultiplier, nearpressuremultiplier) {
        let range = new Quboid(this.pos, [smoothingradius, smoothingradius, smoothingradius])
        let pointsInRange = octree.query(range, []);
        let pressure = (this.density[0] - targetdensity)*pressuremultiplier;
        let nearPressure = (this.density[1])*nearpressuremultiplier;
        let pressureForce = [0,0,0];

        for (let j = 0; j < pointsInRange.length; j++) {
            if (index == j) {continue;}
            let that = points[pointsInRange[j]];

            let sqdist = sqrMagnitude([that.pos[0] - this.pos[0], that.pos[1] - this.pos[1], that.pos[2] - this.pos[2]]);
            if (sqdist >= smoothingradius**2) {continue;}
            let distance = Math.sqrt(sqdist);
            let dirToNeighbour;
            if (distance > 0) {
                dirToNeighbour = [(that.pos[0] - this.pos[0])/distance, (that.pos[1] - this.pos[1])/distance, (that.pos[2] - this.pos[2])/distance];
            } else {
                dirToNeighbour = [0, 0, 0];
            }
            let neighbourPressure = (that.density[0] - targetdensity)*pressuremultiplier;
            let neighbourNearPressure = (that.density[1])*nearpressuremultiplier;

            let sharedPressure = (pressure + neighbourPressure) * 0.5;
            let sharedNearPressure = (nearPressure + neighbourNearPressure) * 0.5;

            let densityDeriv = densityKernelDerivative(distance, smoothingradius);
            let nearDensityDeriv = nearDensityKernelDerivative(distance, smoothingradius);
            if (that.density[0] !== 0 && that.density[1] !== 0) {
                pressureForce[0] += (dirToNeighbour[0] * densityDeriv * that.mass * sharedPressure / that.density[0]);
                pressureForce[1] += (dirToNeighbour[1] * densityDeriv * that.mass * sharedPressure / that.density[0]);
                pressureForce[2] += (dirToNeighbour[2] * densityDeriv * that.mass * sharedPressure / that.density[0]);
                pressureForce[0] += (dirToNeighbour[0] * nearDensityDeriv * that.mass * sharedNearPressure / that.density[1]);
                pressureForce[1] += (dirToNeighbour[1] * nearDensityDeriv * that.mass * sharedNearPressure / that.density[1]);
                pressureForce[2] += (dirToNeighbour[2] * nearDensityDeriv * that.mass * sharedNearPressure / that.density[1]);
            }
        }
        if (this.density[0] !== 0) {
            this.acc[0] += (pressureForce[0]/this.density[0]);
            this.acc[1] += (pressureForce[1]/this.density[0]);
            this.acc[2] += (pressureForce[2]/this.density[0]);
        }
    }
    drawPoints(mx, my, mz) {
        this.mesh.position.x = this.pos[0] - mx/2;
        this.mesh.position.y = this.pos[1] - my/2;
        this.mesh.position.z = this.pos[2] - mz/2;
        
        this.mesh.material.color.set(this.color);
    }
}


// Get squared magnitude
function sqrMagnitude(vector) {
    return vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2];
}