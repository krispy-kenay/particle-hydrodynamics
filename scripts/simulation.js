// ----------------------------------------
// Defining global variables
// ----------------------------------------

// Initialize global variables for simulation parameters
var gravity = 0;
var numPoints = 0;
var smoothingRadius = 0;
var pressureMultiplier = 0;
var nearPressureMultiplier = 0;

var viscosityStrength = 0;
var targetDensity = 0;
var mass = 0;
var particleRadius = 0;

// Initialize behind the scenes variables (ones that shouldn't be changed during)
const timestep = 0.01
const max_speed = 20;
const collisionDamping = 0.5;

// Initialize empty arrays to hold the positions, acceleration, etc.
var positions = [];
var positions_prev = [];
var acceleration = [];
var radiuses = [];
var colors = [];
var densities = [];
var spatialLookup = [];
var startIndices = [];
var collisionSpatialLookup = [];
var collisionStartIndices = [];

// Initialize state variables
var displaySmoothingRadius = false;
var displayVelocity = true;

// Color map
const velocityColor = ['#2736b9','#0043c3','#0056ae','#0060a5','#0067a3','#006ea4','#0075a6','#007ba9','#0082ac','#0089af','#0090b2','#0097b4','#009eb6','#00a6b7','#00aeb8','#00b6b7','#00beb5','#00c7b2','#00cead','#1cd4a9','#1cd4a9','#35da9f','#4ddf93','#64e486','#7be878','#92ec6a','#abef5b','#c4f14d','#def140','#f8f135','#f8f135','#f8e92f','#f8e129','#f8d924','#f7d11f','#f6c91b','#f5c117','#f4b914','#f2b212','#f0aa11','#eea211','#ec9a11','#ea9212','#e78b13','#e48315'];

// Initialize state variables
var displaySmoothingRadius = false;
var displayVelocity = true;

// Color map
const velocityColor = ['#2736b9','#0043c3','#0056ae','#0060a5','#0067a3','#006ea4','#0075a6','#007ba9','#0082ac','#0089af','#0090b2','#0097b4','#009eb6','#00a6b7','#00aeb8','#00b6b7','#00beb5','#00c7b2','#00cead','#1cd4a9','#1cd4a9','#35da9f','#4ddf93','#64e486','#7be878','#92ec6a','#abef5b','#c4f14d','#def140','#f8f135','#f8f135','#f8e92f','#f8e129','#f8d924','#f7d11f','#f6c91b','#f5c117','#f4b914','#f2b212','#f0aa11','#eea211','#ec9a11','#ea9212','#e78b13','#e48315'];

// ----------------------------------------
// Setup functions
// ----------------------------------------

// Function to change the number of particles without removing existing ones, used both to setup the simulation and update it on the-fly
function changeNumParticles(newNum) {
    let diff = newNum - numPoints;
    if (diff > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let _ = 0; _ < diff; _++) {
            let newLength = positions.length;
            positions[newLength] = [getRandomFloat(0, canvas.width), getRandomFloat(0, canvas.height)];
            positions_prev[newLength] = [positions[newLength][0] + getRandomFloat(-1,1), positions[newLength][1] + getRandomFloat(-1,1)];
            acceleration[newLength] = [0,0];
            colors[newLength] = "#1e1e1e";
            radiuses[newLength] = particleRadius;
            densities[newLength] = [0,0];
            numPoints = newNum; 
            updatePositions(timestep, gravity, collisionDamping);
        }
    } else if (diff < 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let _ = 0; _ < -diff; _++) {
            let _1 = positions.pop();
            let _2 = positions_prev.pop();
            let _3 = acceleration.pop();
            let _5 = radiuses.pop();
            let _6 = colors.pop();
            let _7 = densities.pop();
            let _8 = spatialLookup.pop();
            let _9 = startIndices.pop();
            let _10 = collisionSpatialLookup.pop();
            let _11 = collisionStartIndices.pop();
            numPoints = newNum;
            updatePositions(timestep, gravity, collisionDamping);
        }
    } else {return;}
}

// Function to change the radius of all the particles
function changeRadius(newRadius) {
    if (newRadius !== particleRadius) {
        particleRadius = newRadius;
        for (let i = 0; i < positions.length; i++) {
            radiuses[i] = particleRadius;
        }
        updatePositions(timestep, gravity, collisionDamping);
    }
    
}

// ----------------------------------------
// Simulation Loop
// ----------------------------------------

// Interval Manager setup (allows the simulation to run in the background without blocking main window functionality)
let runPlay = false;
var index = 0;
let intervalManager = {
    interval: null,

    startInterval: function(callback, intervalTime) {
        this.stopInterval(); // Clear any existing interval
        this.interval = setInterval(callback, intervalTime);
    },

    stopInterval: function() {
        clearInterval(this.interval);
        this.interval = null;
    }
};

// toggle state control with button
function togglePlay() {
    runPlay = !runPlay;
    console.log('Simulation Running:', runPlay);
    if (runPlay) {
        intervalManager.startInterval(function () {
            if (!runPlay) {
                intervalManager.stopInterval();
                return;
            }
            updatePositions(timestep, gravity, collisionDamping);
            index++;
        }, 10);
    } else {
        intervalManager.stopInterval();
    }
}

// Main update function
function updatePositions(dt, g, damping) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateSpatialLookup(positions, collisionSpatialLookup, collisionStartIndices, particleRadius);
    updateSpatialLookup(positions, spatialLookup, startIndices, smoothingRadius);

    if (leftclick == true) {mouseAttraction(mouseX, mouseY);}
    else if (rightclick == true) {mouseRepulsion(mouseX, mouseY);}

    if (targetDensity > 0) {calculateDensity(positions, densities, spatialLookup, startIndices, smoothingRadius);}
    if (pressureMultiplier > 0) {calculatePressureForce(positions, acceleration, densities, spatialLookup, startIndices, smoothingRadius);}
    if (viscosityStrength > 0) {calculateViscosity(positions, positions_prev, acceleration, spatialLookup, startIndices, smoothingRadius, viscosityStrength, dt);}
    if (gravity > 0) {applyGravity(acceleration, g, mass);}
    
    for (let _ = 0; _ < 3; _++) {calculateCollision(positions, positions_prev, radiuses, spatialLookup, startIndices, smoothingRadius);}


    boundBoxCheck(positions, positions_prev, canvas.width, canvas.height, damping);
    applyVelocity(positions, positions_prev, acceleration, dt);

    // Redraw points
    if (displaySmoothingRadius) {drawInfluence(ctx, positions, densities, targetDensity, smoothingRadius);}
    drawCoordinates(ctx, positions, positions_prev, radiuses);
    return;
}

// ----------------------------------------
// Mouse Interaction Functions
// ----------------------------------------

function mouseAttraction(mx, my) {
    for (let i = 0; i < positions.length; i++) {
        let dx = positions[i][0] - mx;
        let dy = positions[i][1] - my;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouseDist) {
            let nx = dx / distance;
            let ny = dy / distance;
            acceleration[i][0] *= 0.9;
            acceleration[i][1] *= 0.9;
            acceleration[i][0] -= nx * mouseForce; //Math.max(0.5, distance/mouseDist)
            acceleration[i][1] -= ny * mouseForce;
        }
    }
    drawMouse(ctx, mx, my, mouseDist, [19,3,252]);
}
function mouseRepulsion(mx, my) {
    for (let i = 0; i < positions.length; i++) {
        let dx = positions[i][0] - mx;
        let dy = positions[i][1] - my;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouseDist) {
            let nx = dx / distance;
            let ny = dy / distance;
            acceleration[i][0] *= 0.9;
            acceleration[i][1] *= 0.9;
            acceleration[i][0] += nx * mouseForce;
            acceleration[i][1] += ny * mouseForce;
        }
    }
    drawMouse(ctx, mx, my, mouseDist, [156,0,8]);
}


// ----------------------------------------
// Simulation Math
// ----------------------------------------

// Function to add gravity to acceleration
function applyGravity(acc, g, mass) {
    for (let i = 0; i < acc.length; i++) {
        acc[i][1] += g * mass;
    }
}
// Function to recalculate position based on velocity and acceleration
function applyVelocity(pos, ppos, acc, dt) {
    for (let i = 0; i < pos.length; i++) {
        for (let k = 0; k < pos[i].length; k++) {
            let disp = pos[i][k] - ppos[i][k];
            if (disp > max_speed) {
                disp = max_speed;
            } 
            ppos[i][k] = pos[i][k];
            pos[i][k] += disp + acc[i][k] * (dt*dt);
            acc[i][k] = 0;
        }
    }
}
// Function to check bounding box interactions
function boundBoxCheck(pos, ppos, max_x, max_y, damping) {
    for (let i = 0; i < pos.length; i++) {
        if (pos[i][1] > max_y) {
            ppos[i][1] = max_y - (ppos[i][1] - max_y);
            pos[i][1] = max_y - (pos[i][1] - max_y) * damping;
            pos[i][0] = ppos[i][0] + (pos[i][0] - ppos[i][0]) * damping;
        }
        if (pos[i][1] < 0) {
            ppos[i][1] *= -1;
            pos[i][1] *= -1 * damping;
            pos[i][0] = ppos[i][0] + (pos[i][0] - ppos[i][0]) * damping;
        }
        if (pos[i][0] > max_x) {
            ppos[i][0] = max_x - (ppos[i][0] - max_x);
            pos[i][0] = max_x - (pos[i][0] - max_x) * damping;
            pos[i][1] = ppos[i][1] + (pos[i][1] - ppos[i][1]) * damping;
        }
        if (pos[i][0] < 0) {
            ppos[i][0] *= -1;
            pos[i][0] *= -1 * damping;
            pos[i][1] = ppos[i][1] + (pos[i][1] - ppos[i][1]) * damping;
        }
    }
}
// Function to resolve collisions
function calculateCollision(pos, ppos, radii, slookup, sindices, sradius) {
    for (let i = 0; i < pos.length; i++) {
        let cell = positionToCellCoord(pos[i], sradius);
        let cellX = cell[0];
        let cellY = cell[1];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                let hash = hashCell([cellX + x, cellY + y]);
                let key = getKeyFromHash(hash, pos.length);
                let cellStartIndex = sindices[key];
                for (let k = cellStartIndex; k < slookup.length; k++) {
                    if (slookup[k].cellKey != key) {break;}
                    if (i == k) {continue;}
                    let j = slookup[k].index;
                    let dx = pos[i][0] - pos[j][0];
                    let dy = pos[i][1] - pos[j][1];
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    let minDistance = radii[i] + radii[j];
                    if (distance >= minDistance) {continue;}
                    if (distance == 0) {continue;}
                    let penetration = minDistance - distance;
                    let nx = dx / distance;
                    let ny = dy / distance;
                    let separation = penetration / 2;
                    pos[i][0] += separation * nx;
                    pos[i][1] += separation * ny;
                    pos[j][0] -= separation * nx;
                    pos[j][1] -= separation * ny;

                    let rvx = (pos[i][0] - ppos[i][0]) - (pos[j][0] - ppos[j][0]);
                    let rvy = (pos[i][1] - ppos[i][1]) - (pos[j][1] - ppos[j][1]);
                    let vel = rvx * nx + rvy * ny;
                    if (vel > 0) {continue;}
                    let impulse = -(1 + collisionDamping) * vel;
                    impulse /= (1 / mass) + (1 / mass);

                    let impulseX = impulse * nx;
                    let impulseY = impulse * ny;
                    ppos[i][0] -= impulseX / mass;
                    ppos[i][1] -= impulseY / mass;
                    ppos[j][0] += impulseX / mass;
                    ppos[j][1] += impulseY / mass;
                }
            }
        }
    }
}
// Update all densities
function calculateDensity(pos, dens, slookup, sindices, sradius) {
    for (let i = 0; i < pos.length; i++) {
        let cell = positionToCellCoord(pos[i], sradius);
        let cellX = cell[0];
        let cellY = cell[1];
        let sqradius = sradius ** 2;
        let density = 0;
        let nearDensity = 0;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                let hash = hashCell([cellX + x, cellY + y]);
                let key = getKeyFromHash(hash, pos.length);
                let cellStartIndex = sindices[key];
                for (let k = cellStartIndex; k < slookup.length; k++) {
                    if (slookup[k].cellKey != key) {break;}
                    //if (i == k) {continue;}
                    let particleIndex = slookup[k].index;
                    let sqdist = sqrMagnitude([pos[particleIndex][0] - pos[i][0], pos[particleIndex][1] - pos[i][1]]);
                    if (sqdist >= sqradius) {continue;}
                    let dst = Math.sqrt(sqdist);
                    density += mass * densityKernel(dst, sradius);
                    nearDensity += mass * NearDensityKernel(dst, sradius);
                }
            }

        }
        dens[i] = [density, nearDensity];
    }
}
// Calculate all remaining forces
function calculatePressureForce(pos, acc, dens, slookup, sindices, sradius) {
    for (let i = 0; i < pos.length; i++) {
        let cell = positionToCellCoord(pos[i], sradius);
        let cellX = cell[0];
        let cellY = cell[1];
        let sqradius = sradius ** 2;
        // Specific
        let density = dens[i][0];
        let nearDensity = dens[i][1];
        let pressure = (density - targetDensity)*pressureMultiplier;
        let nearPressure = (nearDensity)*nearPressureMultiplier;
        let pressureForce = [0,0];

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                let hash = hashCell([cellX + x, cellY + y]);
                let key = getKeyFromHash(hash, pos.length);
                let cellStartIndex = sindices[key];
                for (let k = cellStartIndex; k < slookup.length; k++) {
                    if (slookup[k].cellKey != key) {break;}
                    if (i == k) {continue;}
                    let particleIndex = slookup[k].index;
                    let sqdist = sqrMagnitude([pos[particleIndex][0] - pos[i][0], pos[particleIndex][1] - pos[i][1]]);
                    if (sqdist >= sqradius) {continue;}
                    
                    let dst = Math.sqrt(sqdist);
                    // Specific
                    let dirToNeighbour;
                    if (dst > 0) {
                        dirToNeighbour = [(pos[particleIndex][0] - pos[i][0])/dst, (pos[particleIndex][1] - pos[i][1])/dst];
                    } else {
                        dirToNeighbour = [0,0];
                    }

                    let neighbourDensity = dens[particleIndex][0];
                    let neighbourNearDensity = dens[particleIndex][1];
                    let neighbourPressure = (neighbourDensity - targetDensity)*pressureMultiplier;
                    let neighbourNearPressure = (neighbourNearDensity)*nearPressureMultiplier;

                    let sharedPressure = (pressure + neighbourPressure) * 0.5;
                    let sharedNearPressure = (nearPressure + neighbourNearPressure) * 0.5;

                    let densityDeriv = densityKernelDerivative(dst, sradius);
                    let nearDensityDeriv = nearDensityKernelDerivative(dst, sradius);
                    if (neighbourDensity !== 0 && neighbourNearDensity !== 0) {
                        // slope (densityDeriv) * ((density - targetDensity)*pressureMultiplier + (neighbourDensity - targetDensity)*pressureMultiplier) * 0.5 / neighbourDensity
                        pressureForce[0] += (dirToNeighbour[0] * densityDeriv * mass * sharedPressure / neighbourDensity);
                        pressureForce[1] += (dirToNeighbour[1] * densityDeriv * mass * sharedPressure / neighbourDensity);
                        pressureForce[0] += (dirToNeighbour[0] * nearDensityDeriv * mass * sharedNearPressure / neighbourNearDensity);
                        pressureForce[1] += (dirToNeighbour[1] * nearDensityDeriv * mass * sharedNearPressure / neighbourNearDensity);
                    }
                }
            }

        }
        if (density !== 0) {
            acc[i][0] += (pressureForce[0]/density);
            acc[i][1] += (pressureForce[1]/density);
        }
    }
}

function calculateViscosity(pos, ppos, acc, slookup, sindices, sradius, vstrength) {
    for (let i = 0; i < pos.length; i++) {
        let cell = positionToCellCoord(pos[i], sradius);
        let cellX = cell[0];
        let cellY = cell[1];
        let sqradius = sradius ** 2;
        let viscosityForce = [0,0];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                let hash = hashCell([cellX + x, cellY + y]);
                let key = getKeyFromHash(hash, pos.length);
                let cellStartIndex = sindices[key];
                for (let k = cellStartIndex; k < slookup.length; k++) {
                    if (slookup[k].cellKey != key) {break;}
                    if (i == k) {continue;}
                    let j = slookup[k].index;
                    let sqdist = sqrMagnitude([pos[j][0] - pos[i][0], pos[j][1] - pos[i][1]]);
                    if (sqdist >= sqradius) {continue;}
                    let dst = Math.sqrt(sqdist);
                    if (dst == 0) {continue;}
                    viscosityForce[0] += ((pos[j][0] - ppos[j][0]) - (pos[i][0] - ppos[i][0])) * -viscosityKernelDerivative(dst, sradius);
                    viscosityForce[1] += ((pos[j][1] - ppos[j][1]) - (pos[i][1] - ppos[i][1])) * -viscosityKernelDerivative(dst, sradius);
                }
            }
        }
        acc[i][0] += viscosityForce[0] * vstrength / mass;
        acc[i][1] += viscosityForce[1] * vstrength / mass;
    }
}

function updateSpatialLookup(pos, slookup, sindices, sradius) {
    for (let i = 0; i < pos.length; i++) {
        let cell = positionToCellCoord(pos[i], sradius);
        let cellKey = getKeyFromHash(hashCell(cell), slookup.length);
        slookup[i] =  new Entry(i, cellKey);
        sindices[i] = Number.MAX_SAFE_INTEGER;
    }
    slookup.sort((a, b) => a.cellKey - b.cellKey);
    for (let i = 0; i < pos.length; i++) {
        let key = slookup[i].cellKey;
        let keyPrev;
        if (i == 0){
            keyPrev = Number.MAX_SAFE_INTEGER;
        } else {
            keyPrev = slookup[i - 1].cellKey;
        }
        if (key != keyPrev) {
            sindices[key] = i;
        }       
    }
}

// ----------------------------------------
// Kernel functions
// ----------------------------------------

function smoothingKernel (dst, sradius) {
    if (dst < sradius) {
    let v = (Math.PI * sradius ** 4) / 6;
    return (sradius - dst)**2 / v;
    } else {return 0;}
}
function spikyKernel (dst, sradius) {
    if (dst < sradius) {
        let v = sradius - dst;
        return v*v*6 / (Math.PI * sradius**4);
    } else {return 0;}
}
function spikyKernel3 (dst, sradius) {
    if (dst < sradius) {
        let v = sradius - dst;
        return v*v*v*10 / (Math.PI * sradius**5);
    } else {return 0;}
}

function smoothingKernelDerivative(dst, sradius) {
    if (dst < sradius) {
        let scale = 12 / (Math.PI * sradius ** 4);
        return (dst - sradius) * scale;
    } else {return 0;}
}

function spikyKernelDerivative (dst, sradius) {
    if (dst < sradius) {
        let v = sradius - dst;
        return -v*12 / ((sradius ** 4) * Math.PI);
    } else {return 0;}
}

function spikyKernel3Derivative (dst, sradius) {
    if (dst < sradius) {
        let v = sradius - dst;
        return -v*v*30 / (Math.PI * sradius**5);
    } else {return 0;}
}

// wrapper for easy selection
function densityKernel(dst, sradius) {
    return spikyKernel(dst, sradius);
}
function NearDensityKernel(dst, sradius) {
    return spikyKernel3(dst, sradius);
}

function densityKernelDerivative(dst, sradius) {
    return spikyKernelDerivative(dst, sradius);
}
function nearDensityKernelDerivative(dst, sradius) {
    return spikyKernel3Derivative(dst, sradius)
}

function viscosityKernelDerivative(dst, sradius) {
    return smoothingKernelDerivative(dst, sradius);
}

// ----------------------------------------
// Draw functions
// ----------------------------------------

// Draw coordinates on the canvas
function drawCoordinates(canv, pos, ppos, radii) {
    for (let i = 0; i < pos.length; i++) {
        let color;
        if (displayVelocity) {
            let velocity = 0;
            for (let k = 0; k < pos[i].length; k++) {
                velocity += Math.abs(pos[i][k] - ppos[i][k]);
            }
            color = velocityColor[parseInt(45*velocity / (max_speed * 2))];
        } else {
            color = "#1e1e1e";
        }
        
        canv.fillStyle = color;
        canv.beginPath();
        canv.arc(pos[i][0], pos[i][1], radii[i], 0, 2 * Math.PI);
        canv.fill();
        canv.stroke();
    }
}
// Draw circle around mouse
function drawMouse(canv, mx, my, iradius, col) {
    const gradient = ctx.createRadialGradient(
        mx, my, 2,
        mx, my, iradius
    );
    gradient.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.8)`); 
    gradient.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0.1)`); 

    canv.fillStyle = gradient;
    canv.beginPath();
    canv.arc(mx, my, iradius, 0, 2 * Math.PI);
    canv.fill();
}
// Draw Smoothing Radius on the canvas
function drawInfluence(canv, pos, dens, targetdens, sradius) {
    for (let i = 0; i < pos.length; i++) {
        const gradient = ctx.createRadialGradient(
            pos[i][0], pos[i][1], 2,
            pos[i][0], pos[i][1], smoothingRadius
        );
        if (dens[i][0] <= targetdens) {
            col = `rgba(19,3,252,${(1-(dens[i][0]/targetdens))})`;
        } else if (dens[i][0] > targetdens) {
            col = `rgba(156,0,8,${(1-(targetdens/dens[i][0]))})`;
        } else {
            col = `rgba(255,255,255,0)`;
        }
        gradient.addColorStop(0, col);
        gradient.addColorStop(1, `rgba(255,255,255,0)`);

        canv.fillStyle = gradient;
        canv.beginPath();
        canv.arc(pos[i][0], pos[i][1], sradius, 0, 2 * Math.PI);
        canv.fill();
    }
}

// ----------------------------------------
// Helper functions
// ----------------------------------------

// Function to get a random number in the interval [min, max)
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Function to calculate distance between two points
function calculateDistance (p1, p2) {
    return Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
}

// Calculate pressure between two points
function calculateSharedPressure (densityA, densityB, targetdens, pmult) {
    let pressureA = (densityA - targetdens) * pmult;
    let pressureB = (densityB - targetdens) * pmult;
    return (pressureA + pressureB) / 2;
}

// storage object
class Entry {
    constructor(index, cellKey) {
        this.index = index;
        this.cellKey = cellKey;
    }
}

// Map position to cell coordinates
function positionToCellCoord(posi, sradius) {
    let cellX = parseInt(posi[0]/sradius);
    let cellY = parseInt(posi[1]/sradius);
    return [cellX, cellY];
}

// Convert cell coordinate into a single number
function hashCell(cell) {
    let a = parseInt(cell[0] * 15823);
    let b = parseInt(cell[1] * 9737333);
    return a + b;
}

// Map hash value to length of the array
function getKeyFromHash(hash, len) {
    return parseInt(hash % len);
}

// Get squared magnitude
function sqrMagnitude(vector) {
    return vector[0] * vector[0] + vector[1] * vector[1];
}
