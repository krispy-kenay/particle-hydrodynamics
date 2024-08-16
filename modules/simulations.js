import { Point } from "./point.js";
import { Tree, Box } from "./tree.js";
import { ctx, canvas } from "./variables.js";

class Simulation {
    constructor(constraints, dimensions) {
        this.points = new Array(0);
        this.constraints = constraints;
        this.tree = new Tree(new Box(constraints.map((x) => x / 2), constraints, dimensions), 8, dimensions);
        this.dimensions = dimensions;
        this.timestep = 0.01;
        this.collisionDamping = 0.5;
        this.maxSpeed = 20;
        this.mass = 0;
        this.gravity = 0;
        this.numParticles = 0;
        this.smoothingRadius = 0;
        this.particleRadius = 0;
        this.targetDensity = 0;
        this.pressureMultiplier = 0;
        this.nearPressureMultiplier = 0;
        this.viscosityStrength = 0;
        this.displayVelocity = true;
        this.displaySmoothingRadius = false;
    }

    changeConstraints(newConstraints) {
        this.constraints = newConstraints;
        this.tree = new Tree(new Box(newConstraints.map((x) => x / 2), newConstraints, this.dimensions), 8, this.dimensions);
    }

    changeNumPositions(numParticles) {
        let difference = numParticles - this.points.length;
        if (difference > 0) {
            for (let i = 0; i < difference; i++) {
                let position = new Array(this.dimensions);
                let positionPrevious = new Array(this.dimensions);
                let acceleration = new Array(this.dimensions);
                for (let k = 0; k < this.dimensions; k++) {
                    position[k] = getRandomFloat(0, this.constraints[k]);
                    positionPrevious[k] = position[k] + getRandomFloat(-5, 5);
                    acceleration[k] = 0;
                }
                let color = (this.dimensions == 2) ? "#1e1e1e" : 0x2736b9;
                let point = new Point(position, positionPrevious, acceleration, 0, this.particleRadius, this.mass, [0,0], color);
                this.points.push(point);
            }
        } else if (difference < 0) {
            for (let _ = 0; _ < -difference; _++) {
                let __ = this.points.pop();
            }
        }
        this.points[0].position = [200,200];
        this.points[0].positionPrevious = [200,200];
        this.points[1].position = [200,250];
        this.points[1].positionPrevious = [200,250];
    }

    initializeSystem() {
        this.points = new Array(this.numParticles)
        for (let i = 0; i < this.numParticles; i++) {
            let point = this.generatePoint()
            //this.points[i] = JSON.parse(JSON.stringify(point));
            this.points[i] = point;
        }
    }

    generatePoint() {
        let position = new Array(this.dimensions);
        let positionPrevious = new Array(this.dimensions);
        let acceleration = new Array(this.dimensions);
        for (let k = 0; k < this.dimensions; k++) {
            position[k] = getRandomFloat(0, this.constraints[k]);
            positionPrevious[k] = position[k] + getRandomFloat(-5, 5);
            acceleration[k] = 0;
        }
        let color = (this.dimensions == 2) ? "#1e1e1e" : 0x2736b9;
        let point = new Point(position, positionPrevious, acceleration, 0, this.particleRadius, this.mass, [0,0], color);
        return point;
    };

    changeRadius(newRadius) {
        this.particleRadius = newRadius;
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].radius = newRadius;
        }
    }

    changeMass(newMass) {
        this.mass = newMass;
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].mass = newMass
        }
    }

    updatePositions() {
        
        this.tree.clear();
        for (let i = 0; i < this.points.length; i++) {
            this.tree.insert(i, this.points[i].position)
        }
        
        for (let i = 0; i < this.points.length; i++) {this.points[i].calculateDensity2(i, this.points, this.tree, this.smoothingRadius);}
        for (let i = 0; i < this.points.length; i++) {this.points[i].calculatePressureForce2(i, this.points, this.tree, this.smoothingRadius, this.targetDensity, this.pressureMultiplier, this.nearPressureMultiplier);}
        for (let i = 0; i < this.points.length; i++) {this.points[i].applyGravity(this.gravity);}
        // Collisions here
        for (let i = 0; i < this.points.length; i++) {this.points[i].applyConstraints(this.constraints, this.collisionDamping);}
        for (let i = 0; i < this.points.length; i++) {this.points[i].applyVelocity(this.timestep, this.maxSpeed);}

        let pp = this.points[0]
        let range = new Box(pp.position, [this.smoothingRadius, this.smoothingRadius], this.dimensions);
        let pointsInRange = this.tree.query(range, []);

        pp.drawSpecial(ctx, '#ff0000', pp.radius);
        pp.drawSpecial(ctx, 'rgba(255,0,0,0.3)', this.smoothingRadius)

        for (let j = 0; j < pointsInRange.length; j++) {
            if (pointsInRange[j] == 0) {continue;}
            let that = this.points[pointsInRange[j]];
            
            that.drawSpecial(ctx, '#00ff00', that.radius)
        }

        this.points[1].drawSpecial(ctx, '#ff00ff', pp.radius)
    }

    updateDrawing() {
        if (this.dimensions == 2) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < this.points.length; i++) {
                if (this.displaySmoothingRadius) {
                    this.points[i].drawInfluence2D(ctx, this.smoothingRadius, this.targetDensity);
                }
                this.points[i].drawPoint2D(ctx, this.displayVelocity)
            }
        }
    }
}

// Random float generator
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export {Simulation}