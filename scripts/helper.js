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
    gravity = slider.value * 10;
    setSpanPos(slider, slider.nextElementSibling, gravity);
}



// ----------------------------------------
// Helper functions
// ----------------------------------------

// Trigger general setup once the window has loaded in properly
window.onload = function() {
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'range' && input.oninput) {
            input.oninput();
        }
    }
    init_canvas();
    initializePositions();
};

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

// Helper function to set position of the number above the sliders
function setSpanPos(slider, span, value) {
    let sliderPosition = slider.value / slider.max;
    span.innerHTML = value;
    span.style.left = ((sliderPosition * 100) - (sliderPosition - 0.5)*6) + '%';
}