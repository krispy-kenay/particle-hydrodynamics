import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initializeScene() {
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    // Box drawing
    const geometry = new THREE.BoxGeometry(box_x+particleRadius,box_y+particleRadius,box_z+particleRadius);
    let edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.MeshBasicMaterial({color: 0xffffff}); //2736b9
    let line = new THREE.LineSegments(edges, material);
    scene.add(line);


    // Lights
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(box_x, box_y, 0).normalize(); // set the direction
    scene.add(directionalLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(box_x+50,0,box_z+30);//,box_y+50
    //camera.lookAt(0,0,0);
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents( window ); // optional
    controls.target.set(0,0,0)
    return [scene, camera, renderer];
}