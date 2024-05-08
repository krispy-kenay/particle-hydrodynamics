import { initializeScene } from './scripts/scene.js';
import { Octree, Quboid, Point } from './scripts/contructs.js';

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



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





//var smoothingRadius = 15;

//var mass = 0;
const maxSpeed = 20;
const collisionDamping = 0.1;



var ocTree = new Octree(new Quboid([box_x/50,box_y/50,box_z/50],[box_x,box_y,box_z]),8);
let [scene, camera, renderer] = initializeScene();
let clock = new THREE.Clock();
let delta = 0;
let interval = 1/30;

// define variables
let points = [];



for (let i = 0; i < 500; i++) {
    let position = [getRandomFloat(0, box_x), getRandomFloat(0, box_y), getRandomFloat(0, box_z)];
    let position_prev = [position[0] + getRandomFloat(-1,1), position[1] + getRandomFloat(-1,1), position[2] + getRandomFloat(-1,1)];
    //let position_prev = [position[0],position[1],position[2]];
    let acceleration = [0,0,0];
    let color = 0x2736b9;
    let radius = particleRadius;
    let density = [0,0];
    let mass = 1;
    let geometry = new THREE.SphereGeometry(radius,32,32);
    let material;
    if (i == 0) {
        material = new THREE.MeshPhongMaterial({color: 0xff0000,specular: 0x050505, shininess:100}); //2736b9
    } else {
        material = new THREE.MeshPhongMaterial({color: 0x2736b9,specular: 0x050505, shininess:100}); //2736b9
    }
    let sphere = new THREE.Mesh(geometry, material);
    let point = new Point(position, position_prev, acceleration, sphere, radius, mass, density, color);
    scene.add(sphere);
    points[i] = point;
}

/*var worker = new Worker('./scripts/worker.js');
worker.postMessage({points: points, octree: ocTree,dt: timestep, g: gravity, damping: collisionDamping, maxspeed: maxSpeed});
worker.onmessage = function(event) {
    points = event.data;
}*/

// Action
function animate() {
    requestAnimationFrame(animate);
    
    /*delta += clock.getDelta();
    if (running && delta > interval) {
        updatePositions(points, ocTree, timestep*delta, gravity, collisionDamping, maxSpeed, smoothingRadius, targetDensity, pressureMultiplier, nearPressureMultiplier)
    }
    delta = delta % interval;*/
    if (running) {
        updatePositions(points, ocTree, timestep, gravity, collisionDamping, maxSpeed, smoothingRadius, targetDensity, pressureMultiplier, nearPressureMultiplier)
    }
    //if (running) {
    //    worker.postMessage({points: points, octree: ocTree,dt: timestep, g: gravity, damping: collisionDamping, maxspeed: maxSpeed})
    //}
    //console.log(delta)
    renderer.render(scene, camera);
}

function updatePositions(points, octree, dt, g, damping, maxspeed, smoothingradius, targetdensity, pressuremultiplier, nearpressuremultiplier) {
    octree.clear();
    console.log(g)
    for (let i = 0; i < points.length; i++) {
        octree.insert(i, points[i].pos)
    }
    for (let i = 0; i < points.length; i++) {
        points[i].applyGravity(g);
        //console.time("Collisions")
        points[i].avoidCollisions(i, points, octree, 0.5);
        //console.timeEnd("Collisions")
        //console.time("Density")
        points[i].calculateDensity(i, points, octree, smoothingradius);
        //console.timeEnd("Density")
        points[i].calculatePressureForce(i, points, octree, smoothingradius, targetdensity, pressuremultiplier, nearpressuremultiplier);

        points[i].applyVelocity(dt, maxspeed);
        points[i].applyConstraints(box_x, box_y, box_z, damping);
        points[i].drawPoints(box_x,box_y,box_z);
    }
    return points;
}


//
// MOVE THESE FUNCTIONS TO A SEPARATE HELPER FILE MAYBE?
//
// Random float generator
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
// Get squared magnitude
function sqrMagnitude(vector) {
    return vector[0] * vector[0] + vector[1] * vector[1];
}

animate();