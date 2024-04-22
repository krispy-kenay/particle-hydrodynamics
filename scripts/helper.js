// ----------------------------------------
// Context setup
// ----------------------------------------

// Setup the canvas & context
var canvas = document.querySelector("#Sim2Dbox");
var ctx = canvas.getContext("2d");
function init_canvas() {
    canvas.width = window.innerWidth ;
    canvas.height = window.innerHeight;
}

// ----------------------------------------
// Set global variables
// ----------------------------------------

// Set the number of particles within the simulation
function setNumParticles(slider) {
    newNum = slider.value;
    setSpanPos(slider, slider.nextElementSibling, newNum);
    changeNumParticles(newNum);
}
// Adjust Gravity 
function setGravity(slider) {
    gravity = slider.value;
    setSpanPos(slider, slider.nextElementSibling, gravity / (10*200));
}
// Adjust mass
function setMass(slider) {
    let val;
    if (slider.value == 0) {val = 0.05;}
    else {val = slider.value}
    mass = val;
    setSpanPos(slider, slider.nextElementSibling, mass / (200));
    changeRadius(val / 10);
}
// Adjust Smoothing Radius
function setSmoothingRadius(slider) {
    smoothingRadius = slider.value;
    setSpanPos(slider, slider.nextElementSibling, smoothingRadius);
}
// Adjust Target Density
function setTargetDensity(slider) {
    targetDensity = slider.value / 1000;
    setSpanPos(slider, slider.nextElementSibling, targetDensity * (1000/200));
}
// Adjust Pressure Multiplier
function setPressureMultiplier(slider) {
    pressureMultiplier = slider.value * (1/timestep**2);
    setSpanPos(slider, slider.nextElementSibling, pressureMultiplier * (timestep**2/200));
}
// Adjust Viscosity
function setViscosityStrength(slider) {
    viscosityStrength = slider.value * (1/timestep**2) * mass**2;
    setSpanPos(slider, slider.nextElementSibling, viscosityStrength * (timestep**2/200)/(mass**2 ));
}



// ----------------------------------------
// Helper functions
// ----------------------------------------

// Trigger general setup once the window has loaded in properly
window.onload = function() {
    init_canvas();
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'range' && input.oninput) {
            input.oninput();
        }
    }
    
    //initializePositions();
};

// Trigger canvas resize when the window is resized
window.onresize = function() {
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'range' && input.oninput) {
            input.oninput();
        }
    }
    init_canvas();
}

// Global mouse related variables
var mouseX, mouseY;
var leftclick = false;
var rightclick = false;
var range = 0;
var mouseDist = 200;
var mouseForce = 4000;

// Mouse event listeners
canvas.addEventListener('mousemove', e => {
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    mouseY = e.clientY - canvas.getBoundingClientRect().top;
});
canvas.addEventListener('mousedown', e => {
if (e.button === 0) {
    leftclick = true;
} else if (e.button === 2) {
    rightclick = true;
}});
canvas.addEventListener('mouseup', e => {
if (e.button === 0) {
    leftclick = false;
} else if (e.button === 2) {
    rightclick = false;
}});
canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
});
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    mouseDist += delta * 10;
    if (mouseDist < 0) mouseDist = 0;
});

// Helper function to set position of the number above the sliders
function setSpanPos(slider, span, value) {
    let sliderPosition = slider.value / slider.max;
    span.innerHTML = parseFloat(value).toFixed(2);
    span.style.left = ((sliderPosition * 100) - (sliderPosition - 0.5)*6) + '%';
}