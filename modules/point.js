import { densityKernel, densityKernelDerivative, nearDensityKernelDerivative, nearDensityKernel } from "./kernels.js"
import { Box } from "./tree.js";

const velocityColor3D = [0x2736b9,0x0043c3,0x0056ae,0x0060a5,0x0067a3,0x006ea4,0x0075a6,0x007ba9,0x0082ac,0x0089af,0x0090b2,0x0097b4,0x009eb6,0x00a6b7,0x00aeb8,0x00b6b7,0x00beb5,0x00c7b2,0x00cead,0x1cd4a9,0x1cd4a9,0x35da9f,0x4ddf93,0x64e486,0x7be878,0x92ec6a,0xabef5b,0xc4f14d,0xdef140,0xf8f135,0xf8f135,0xf8e92f,0xf8e129,0xf8d924,0xf7d11f,0xf6c91b,0xf5c117,0xf4b914,0xf2b212,0xf0aa11,0xeea211,0xec9a11,0xea9212,0xe78b13,0xe48315];
const velocityColor2D = ['#2736b9','#0043c3','#0056ae','#0060a5','#0067a3','#006ea4','#0075a6','#007ba9','#0082ac','#0089af','#0090b2','#0097b4','#009eb6','#00a6b7','#00aeb8','#00b6b7','#00beb5','#00c7b2','#00cead','#1cd4a9','#1cd4a9','#35da9f','#4ddf93','#64e486','#7be878','#92ec6a','#abef5b','#c4f14d','#def140','#f8f135','#f8f135','#f8e92f','#f8e129','#f8d924','#f7d11f','#f6c91b','#f5c117','#f4b914','#f2b212','#f0aa11','#eea211','#ec9a11','#ea9212','#e78b13','#e48315'];


class Point {
    constructor(position, positionPrevious, acceleration, mesh, radius, mass, density, color) {
        this.position = position;
        this.positionPrevious = positionPrevious;
        this.acceleration = acceleration;
        this.mesh = mesh;
        this.radius = radius;
        this.mass = mass;
        this.density = density;
        this.color = color;
        this.dimensions = this.position.length;
    }

    applyGravity(g) {
        this.acceleration[1] += g * this.mass;
    }

    applyVelocity(dt, maxSpeed) {
        let velocity = 0;
        //let newPosition = new Array(this.dimensions);
        for (let k = 0; k < this.dimensions; k++) {
            let dispersion = (this.position[k] - this.positionPrevious[k]);
            // Set a speed limit to prevent destructive cascades
            if (dispersion > maxSpeed) {
                dispersion = maxSpeed
            } else if (dispersion < -maxSpeed) {
                dispersion = -maxSpeed
            }

            velocity += Math.abs(dispersion);
            let temp = this.position[k];
            this.position[k] = this.position[k]*2 - this.positionPrevious[k] + this.acceleration[k] * (dt*dt)
            this.positionPrevious[k] = temp;
            //this.positionPrevious[k] = this.position[k];
            //this.position[k] = this.position[k] + dispersion * dt + (0.5 * this.acceleration[k] * (dt * dt));
            //newPosition[k] = this.position[k] + dispersion * dt + (0.5 * this.acceleration[k] * (dt * dt));
            this.acceleration[k] = 0; 
        }

        this.color = (this.dimensions == 2) ? velocityColor2D[parseInt(45*velocity / (maxSpeed * 2))] : velocityColor3D[parseInt(45*velocity / (maxSpeed * 2))]
    }

    applyConstraints(constraints, damping) {
        for (let k = 0; k < this.dimensions; k++) {
            if (this.position[k] > constraints[k]) {
                this.positionPrevious[k] = constraints[k] - (this.positionPrevious[k] - constraints[k]);
                this.position[k] = constraints[k] - (this.position[k] - constraints[k]) * damping;

                for (let l = 0; l < this.dimensions; l++) {
                    if (k == l) {continue}
                    this.position[l] = this.positionPrevious[l] + (this.position[l] - this.positionPrevious[l]) * damping;
                }
            } else if (this.position[k] < 0) {
                this.positionPrevious[k] *= -1;
                this.position[k] *= -1 * damping;

                for (let l = 0; l < this.dimensions; l++) {
                    if (k == l) {continue}
                    this.position[l] = this.positionPrevious[l] + (this.position[l] - this.positionPrevious[l]) * damping;
                }
            }
        }
    }

    applyConstraints2(constraints, damping) {
        for (let k = 0; k < this.dimensions; k++) {
            if (this.position[k] > constraints[k]) {
                this.position[k] = constraints[k];
                this.positionPrevious[k] = this.position[k]*2 - this.positionPrevious[k]; 
            } else if (this.position[k] < 0) {
                this.position[k] = 0;
                this.positionPrevious[k] = this.position[k]*2 - this.positionPrevious[k]; 
            }
        }
    }

    applyCollisions(index, points, tree, damping) {
        let nBox = new Array(this.dimensions);
        for (let k = 0; k < this.dimensions; k++) {
            nBox[k] = this.radius*2;
        }
        let range = new Box(this.position, nBox, this.dimensions);
        let pointsInRange = tree.query(range, []);

        for (let j = 0; j < pointsInRange.length; j++) {
            if (index == j) {continue;}
            let that = points[pointsInRange[j]]
            let d = new Array(this.dimensions);
            let sqrDistance = 0;
            
            for (let k = 0; k < this.dimensions; k++) {
                d[k] = this.position[k] - that.position[k];
                sqrDistance += (this.position[k] - that.position[k])**2;
            }
            let distance = Math.sqrt(sqrDistance);
            let minDistance = this.radius + that.radius;
            
            if (distance >= minDistance) {continue;}
            if (distance == 0) {
                let epsilon = 0.001;
                for (let k = 0; k < this.dimensions; k++) {
                    this.position[k] += epsilon * (Math.random() - 0.5);
                }
                continue;
            }

            let penetration = minDistance - distance;
            let separation = penetration / 2;

            let velocity = 0;
            for (let k = 0; k < this.dimensions; k++) {
                this.position[k] += separation * (d[k] / distance);
                that.position[k] -= separation * (d[k] / distance);
                velocity += ((this.position[k] - this.positionPrevious[k]) - (that.position[k] - that.positionPrevious[k])) * (d[k] / distance);
            }

            if (velocity > 0) {continue;}
            let impulse = -(1 + damping) * velocity;
            impulse /= (1 / this.mass) + (1 / that.mass);

            for (let k = 0; k < this.dimensions; k++) {
                this.positionPrevious[k] -= impulse * (d[k] / distance) / this.mass;
                that.positionPrevious[k] += impulse * (d[k] / distance) / that.mass;
            }
        }
    }

    calculateDensity(index, points, tree, smoothingRadius) {
        let nBox = new Array(this.dimensions);
        for (let k = 0; k < this.dimensions; k++) {
            nBox[k] = smoothingRadius;
        }
        let range = new Box(this.position, nBox, this.dimensions);
        let pointsInRange = tree.query(range, []);
        this.density[0] = 0;
        this.density[1] = 0;
        for (let j = 0; j < pointsInRange.length; j++) {
            if (index == pointsInRange[j]) {continue;}
            let that = points[pointsInRange[j]];

            let sqrDistance = 0;
            for (let k = 0; k < this.dimensions; k++) {
                sqrDistance += (that.position[k] - this.position[k])**2;
            }

            if (sqrDistance >= smoothingRadius**2) {continue;}
            let distance = Math.sqrt(sqrDistance);
            if (distance == 0) {continue;}
            this.density[0] += this.mass * densityKernel(distance, smoothingRadius);
            this.density[1] += this.mass * nearDensityKernel(distance, smoothingRadius);
        }
    }

    calculateDensity2(index, points, tree, smoothingRadius) {
        this.density[0] = 0;
        this.density[1] = 0;
        for (let j = 0; j < points.length; j++) {
            if (index == j) {continue;}
            let that = points[j]
            let sqrDistance = 0;
            for (let k = 0; k < this.dimensions; k++) {
                sqrDistance += (that.position[k] - this.position[k])*(that.position[k] - this.position[k]);
            }
            if (sqrDistance >= smoothingRadius*smoothingRadius) {continue;}
            let distance = Math.sqrt(sqrDistance);
            this.density[0] += this.mass * densityKernel(distance, smoothingRadius);
            this.density[1] += this.mass * nearDensityKernel(distance, smoothingRadius);
        }
    }

    calculatePressureForce(index, points, tree, smoothingRadius, targetDensity, pressureMultiplier, nearPressureMultiplier) {
        let pressureForce = new Array(this.dimensions);
        let nBox = new Array(this.dimensions);
        for (let k = 0; k < this.dimensions; k++) {
            nBox[k] = smoothingRadius;
            pressureForce[k] = 0;
        }
        
        let range = new Box(this.position, nBox, this.dimensions);
        let pointsInRange = tree.query(range, []);

        let pressure = (this.density[0] - targetDensity) * pressureMultiplier;
        let nearPressure = (this.density[1]) * nearPressureMultiplier;
        //console.log("MAIN",this.position)
        for (let j = 0; j < pointsInRange.length; j++) {
            //console.log(points[pointsInRange[j]].position)
            if (index == pointsInRange[j]) {continue;}
            let that = points[pointsInRange[j]];

            let sqrDistance = 0;
            for (let k = 0; k < this.dimensions; k++) {
                sqrDistance += (that.position[k] - this.position[k])**2;
            }

            if (sqrDistance > smoothingRadius**2) {continue;}
            let distance = Math.sqrt(sqrDistance);

            let dirToNeighbour = new Array(this.dimensions);
            for (let k = 0; k < this.dimensions; k++) {
                if (distance == 0) {
                    dirToNeighbour[k] = 0;
                } else {
                    dirToNeighbour[k] = (that.position[k] - this.position[k]) / distance;
                }
            }

            let neighbourPressure = (that.density[0] - targetDensity) * pressureMultiplier;
            let neighbourNearPressure = (that.density[1]) * nearPressureMultiplier;

            let sharedPressure = (pressure + neighbourPressure) * 0.5;
            let sharedNearPressure = (nearPressure + neighbourNearPressure) * 0.5;

            let densityDerivative = densityKernelDerivative(distance, smoothingRadius);
            let nearDensityDerivative = nearDensityKernelDerivative(distance, smoothingRadius);

            
            if (that.density[0] !== 0 && that.density[1] !== 0) {
                for (let k = 0; k < this.dimensions; k++) {
                    pressureForce[k] += (dirToNeighbour[k] * densityDerivative * that.mass * sharedPressure / that.density[0]);
                    pressureForce[k] += (dirToNeighbour[k] * nearDensityDerivative * that.mass * sharedNearPressure / that.density[1]);
                }
            }
        }
        if (this.density[0] !== 0) {
            for (let k = 0; k < this.dimensions; k++) {
                this.acceleration[k] += (pressureForce[k] / this.density[0]);
            }
        }
        if (index == 0) {
            console.log(pressureForce, this.acceleration)
        }
    }

    calculatePressureForce2(index, points, tree, smoothingRadius, targetDensity, pressureMultiplier, nearPressureMultiplier) {
        let pressureForce = new Array(this.dimensions);
        for (let k = 0; k < this.dimensions; k++) {pressureForce[k] = 0;}
        let pressure = (this.density[0] - targetDensity) * pressureMultiplier;
        let nearPressure = (this.density[1]) * nearPressureMultiplier;
        for (let j = 0; j < points.length; j++) {
            if (j == index) {continue;}
            let that = points[j]
            let sqrDistance = 0;
            for (let k = 0; k < this.dimensions; k++) {
                sqrDistance += (that.position[k] - this.position[k])**2;
            }

            if (sqrDistance > smoothingRadius**2) {continue;}
            let distance = Math.sqrt(sqrDistance);

            let dirToNeighbour = new Array(this.dimensions);
            for (let k = 0; k < this.dimensions; k++) {
                if (distance == 0) {
                    dirToNeighbour[k] = 0;
                } else {
                    dirToNeighbour[k] = (that.position[k] - this.position[k]) / distance;
                }
            }
           
            let neighbourPressure = (that.density[0] - targetDensity) * pressureMultiplier;
            let neighbourNearPressure = (that.density[1]) * nearPressureMultiplier;

            let sharedPressure = (pressure + neighbourPressure) * 0.5;
            let sharedNearPressure = (nearPressure + neighbourNearPressure) * 0.5;

            let densityDerivative = densityKernelDerivative(distance, smoothingRadius);
            let nearDensityDerivative = nearDensityKernelDerivative(distance, smoothingRadius);

            if (that.density[0] != 0 && that.density[1] != 0) {
                for (let k = 0; k < this.dimensions; k++) {
                    pressureForce[k] += (dirToNeighbour[k] * densityDerivative * that.mass * sharedPressure / that.density[0]);
                    pressureForce[k] += (dirToNeighbour[k] * nearDensityDerivative * that.mass * sharedNearPressure / that.density[1]);
                }
            }
        }
        if (this.density[0] != 0) {
            for (let k = 0; k < this.dimensions; k++) {
                //if (index == 0) {console.log(pressureForce[k] / this.density[0])}
                this.acceleration[k] += (pressureForce[k] / this.density[0]);
            }
        }
    }

    drawPoint2D(context, displayVelocity) {
        let color = (displayVelocity) ? this.color : "#1e1e1e";
        context.fillStyle = color;
        context.beginPath();
        context.arc(this.position[0], this.position[1], this.radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }

    drawInfluence2D(context, smoothingRadius, targetDensity) {
        const gradient = context.createRadialGradient(
            this.position[0], this.position[1], 2,
            this.position[0], this.position[1], smoothingRadius
        );

        let color;
        if (this.density[0] <= targetDensity) {
            color = `rgba(19,3,252,${(1-(this.density[0]/targetDensity))})`;
        } else if (this.density[0] > targetDensity) {
            color = `rgba(156,0,8,${(1-(targetDensity/this.density[0]))})`;
        } else {
            color = `rgba(255,255,255,0)`;
        }

        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `rgba(255,255,255,0)`);

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.position[0], this.position[1], smoothingRadius, 0, 2 * Math.PI);
        context.fill();
    }

    drawSpecial(context, color, radius) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(this.position[0], this.position[1], radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }

    drawPoint3D() {

    }
}



export {Point}