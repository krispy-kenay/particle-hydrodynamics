import { Simulation } from "./simulations.js";
import { Tree, Box } from "./tree.js";

// Global relevant contexts
export var canvas = document.querySelector("#Sim2Dbox");
export var ctx = canvas.getContext("2d");

export var simulation;


// Global adjustable variables
export var gravity = 0;
export var numPoints = 0;
export var smoothingRadius = 0;
export var pressureMultiplier = 0;
export var nearPressureMultiplier = 0;
export var viscosityStrength = 0;
export var targetDensity = 0;
export var mass = 1;
export var particleRadius = 10;
export var dimensions = 2;
// Arrays
export var points = new Array(numPoints);
export var constraints = [canvas.width, canvas.height];
export var tree = new Tree(new Box(constraints.map((x) => x / 2), constraints, dimensions), 8, dimensions);

export var running = false;
// Boolean toggles
export var displayVelocity = false;
export var displaySmoothingRadius = false;

// Set the number of particles within the simulation
export function setNumParticles(slider) {
    simulation.numParticles = parseInt(slider.value);
    setSpanPos(slider, slider.nextElementSibling, simulation.numParticles);
    //setupPositions(points, newNum, dimensions, constraints, particleRadius, mass)
}

// Adjust Gravity 
export function setGravity(slider) {
    simulation.gravity = slider.value;
    setSpanPos(slider, slider.nextElementSibling, simulation.gravity / (200));
}

// Adjust mass
export function setMass(slider) {
    let val;
    if (parseFloat(slider.value) == 0) {val = 0.05;}
    else {val = parseFloat(slider.value)}
    simulation.changeMass(parseFloat(val));
    simulation.changeRadius(parseFloat(val) / 10);
    setSpanPos(slider, slider.nextElementSibling, simulation.mass / (200));
    //changeRadius(val / 10);
}

// Adjust Smoothing Radius
export function setSmoothingRadius(slider) {
    simulation.smoothingRadius = parseFloat(slider.value);
    setSpanPos(slider, slider.nextElementSibling, simulation.smoothingRadius);
}

// Show smoothing Radius
export function showSmoothingRadius(chkbox) {
    simulation.displaySmoothingRadius = chkbox.checked;
    simulation.updateDrawing();
}

// Adjust Target Density
export function setTargetDensity(slider) {
    simulation.targetDensity = slider.value/100000;
    console.log(simulation.targetDensity)
    let avgD = 0;
    for (let i = 0; i < simulation.points.length; i++) {
        avgD += simulation.points[i].density[0]
    }
    console.log(avgD/simulation.points.length)
    setSpanPos(slider, slider.nextElementSibling, simulation.targetDensity * (1000/200));
}

// Adjust Pressure Multiplier
export function setPressureMultiplier(slider) {
    //simulation.pressureMultiplier = slider.value * (1/simulation.timestep**2);
    simulation.pressureMultiplier = parseFloat(slider.value)* (1/simulation.timestep**2)
    simulation.nearPressureMultiplier = parseFloat(slider.value)*0
    setSpanPos(slider, slider.nextElementSibling, simulation.pressureMultiplier * (simulation.timestep**2/200));
}

// Adjust Viscosity
export function setViscosityStrength(slider) {
    simulation.viscosityStrength = slider.value * (1/simulation.timestep**2) * simulation.mass**2;
    setSpanPos(slider, slider.nextElementSibling, simulation.viscosityStrength * (simulation.timestep**2/200)/(simulation.mass**2 ));
}

// Show Velocity as color
export function showVelocity(chkbox) {
    simulation.displayVelocity = chkbox.checked;
    simulation.updateDrawing();
}

// Helper function to set position of the number above the sliders
function setSpanPos(slider, span, value) {
    let sliderPosition = slider.value / slider.max;
    span.innerHTML = parseFloat(value).toFixed(2);
    span.style.left = ((sliderPosition * 100) - (sliderPosition - 0.5)*6) + '%';
}

export function togglePlay() {
    running = !running;
    console.log(running)
}


//export function resizeCanvas() {
    //canvas.width = window.innerWidth ;
    //canvas.height = window.innerHeight;
    //constraints[0] = canvas.width;
    //constraints[1] = canvas.height;
    //simulation.changeConstraints([canvas.width, canvas.height])
//}

// Trigger general setup once the window has loaded in properly
window.onload = function() {
    simulation = new Simulation([window.innerWidth, window.innerHeight], 2)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'range' && input.oninput) {
            input.oninput();
        }
    }
    simulation.initializeSystem();
    simulation.updatePositions();
    simulation.updateDrawing();
};

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    simulation.changeConstraints([window.innerWidth, window.innerHeight]);
    simulation.updateDrawing();
    simulation.updatePositions();
    console.log(simulation.timestep)
    console.log(simulation.collisionDamping)
    console.log(simulation.maxSpeed)
    console.log(simulation.mass)
    console.log(simulation.gravity)
    console.log(simulation.smoothingRadius)
    console.log(simulation.particleRadius)
    console.log(simulation.targetDensity)
    console.log(simulation.pressureMultiplier)
    console.log(simulation.nearPressureMultiplier)
    console.log(simulation.viscosityStrength)
    console.log(simulation.displayVelocity)
    console.log(simulation.displaySmoothingRadius)
}
