// ----------------------------------------
// Defining global variables
// ----------------------------------------

// Initialize global variables for simulation parameters
var gravity = 0;
var numPoints = 0;

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

// ----------------------------------------
// Setup functions
// ----------------------------------------

// Initialize Positions at the beginning
function initializePositions() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < numPoints; i++) {
        positions[i] = [getRandomFloat(0, canvas.width), getRandomFloat(0, canvas.height)];
        positions_prev[i] = [positions[i][0] + getRandomFloat(-1,1), positions[i][1] + getRandomFloat(-1,1)];
        acceleration[i] = [0,0];
        colors[i] = "#1e1e1e";
    }
    for (let _ = 0; _ < 20; _++) {
        resolveCollisions(positions, positions_prev, radiuses);
    }
    drawCoordinates(ctx, positions, radiuses, colors);
}

function changeNumParticles(newNum) {
    let diff = newNum - numPoints;
    if (diff > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let _ = 0; _ < diff; _++) {
            let newLength = positions.length;
            positions[newLength] = [getRandomFloat(0, canvas.width), getRandomFloat(0, canvas.height)];
            positions_prev[newLength] = [positions[newLength][0] + getRandomFloat(-1,1), positions[newLength][1] + getRandomFloat(-1,1)];
            acceleration[newLength] = [0,0];
            radiuses[newLength] = parseInt(getRandomFloat(10, 10));
            colors[newLength] = "#1e1e1e";
        }
        drawCoordinates(ctx, positions, radiuses, colors);
    } else if (diff < 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let _ = 0; _ < -diff; _++) {
            let _1 = positions.pop();
            let _2 = positions_prev.pop();
            let _3 = acceleration.pop();
            let _5 = radiuses.pop();
            let _6 = colors.pop();
        }
        drawCoordinates(ctx, positions, radiuses, colors);
    }
    numPoints = newNum; 
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

    if (leftclick == true) {
        mouseAttraction(mouseX, mouseY);
    }
    else if (rightclick == true) {
        mouseRepulsion(mouseX, mouseY);
    }

    applyGravity(acceleration, g);
    for (let _ = 0; _ < 2; _++) {
        resolveCollisions(positions, positions_prev, radiuses);
    }
    boundBoxCheck(positions, positions_prev, canvas.width, canvas.height, damping);
    applyVelocity(positions, positions_prev, acceleration, dt);

    // Redraw points
    drawCoordinates(ctx, positions, radiuses, colors);
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
function applyGravity(acc, g) {
    for (let i = 0; i < acc.length; i++) {
        acc[i][1] += g;
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
function resolveCollisions(pos, ppos, radii) {
    for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
            let dx = pos[i][0] - pos[j][0];
            let dy = pos[i][1] - pos[j][1];
            let distance = Math.sqrt(dx * dx + dy * dy);
            let minDistance = radii[i] + radii[j];

            if (distance < minDistance) {
                // Calculate penetration depth
                let penetration = minDistance - distance;
                // Normalize penetration vector
                let nx = dx / distance;
                let ny = dy / distance;
                // Separate particles along penetration vector
                let separation = penetration / 2;
                pos[i][0] += separation * nx;
                pos[i][1] += separation * ny;
                pos[j][0] -= separation * nx;
                pos[j][1] -= separation * ny;

                // Update previous positions
                ppos[i][0] = pos[i][0] - (pos[i][0] - ppos[i][0]);
                ppos[i][1] = pos[i][1] - (pos[i][1] - ppos[i][1]);
                ppos[j][0] = pos[j][0] - (pos[j][0] - ppos[j][0]);
                ppos[j][1] = pos[j][1] - (pos[j][1] - ppos[j][1]);
            }
        }
    }
}

// ----------------------------------------
// Draw functions
// ----------------------------------------

// Function to draw coordinates on the canvas
function drawCoordinates(canv, pos, radii, col) {
    for (let i = 0; i < pos.length; i++) {
        canv.fillStyle = col[i];
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


// ----------------------------------------
// Helper functions
// ----------------------------------------

// Function to get a random number in the interval [min, max)
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}