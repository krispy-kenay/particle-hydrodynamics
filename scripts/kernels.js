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
export function densityKernel(dst, sradius) {
    return spikyKernel(dst, sradius);
}
export function nearDensityKernel(dst, sradius) {
    return spikyKernel3(dst, sradius);
}

export function densityKernelDerivative(dst, sradius) {
    return spikyKernelDerivative(dst, sradius);
}
export function nearDensityKernelDerivative(dst, sradius) {
    return spikyKernel3Derivative(dst, sradius)
}

export function viscosityKernelDerivative(dst, sradius) {
    return smoothingKernelDerivative(dst, sradius);
}
