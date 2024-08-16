// Kernel functions
function smoothingKernel (distance, smoothingRadius) {
    if (distance < smoothingRadius) {
    let v = (Math.PI * smoothingRadius ** 4) / 6;
    return (smoothingRadius - distance)**2 / v;
    } else {return 0;}
}

function spikyKernel (distance, smoothingRadius) {
    if (distance < smoothingRadius) {
        let v = smoothingRadius - distance;
        return v*v*6 / (Math.PI * smoothingRadius**4);
    } else {return 0;}
}

function spikyKernel3 (distance, smoothingRadius) {
    if (distance < smoothingRadius) {
        let v = smoothingRadius - distance;
        return v*v*v*10 / (Math.PI * smoothingRadius**5);
    } else {return 0;}
}

function smoothingKernelDerivative(distance, smoothingRadius) {
    if (distance < smoothingRadius) {
        let scale = 12 / (Math.PI * smoothingRadius ** 4);
        return (distance - smoothingRadius) * scale;
    } else {return 0;}
}

function spikyKernelDerivative (distance, smoothingRadius) {
    if (distance < smoothingRadius) {
        let v = smoothingRadius - distance;
        return -v*12 / ((smoothingRadius ** 4) * Math.PI);
    } else {return 0;}
}

function spikyKernel3Derivative (distance, smoothingRadius) {
    if (distance < smoothingRadius) {
        let v = smoothingRadius - distance;
        return -v*v*30 / (Math.PI * smoothingRadius**5);
    } else {return 0;}
}

// Wrapper for easier selection
function densityKernel(distance, smoothingRadius) {
    return spikyKernel(distance, smoothingRadius);
}

function nearDensityKernel(distance, smoothingRadius) {
    return spikyKernel3(distance, smoothingRadius);
}

function densityKernelDerivative(distance, smoothingRadius) {
    return spikyKernelDerivative(distance, smoothingRadius);
}

function nearDensityKernelDerivative(distance, smoothingRadius) {
    return spikyKernel3Derivative(distance, smoothingRadius)
}

function viscosityKernelDerivative(distance, smoothingRadius) {
    return smoothingKernelDerivative(distance, smoothingRadius);
}

export {densityKernel, nearDensityKernel, densityKernelDerivative, nearDensityKernelDerivative, viscosityKernelDerivative}