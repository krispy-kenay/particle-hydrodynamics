import { simulation, running } from "./modules/variables.js";

function animate() {
    requestAnimationFrame(animate);
    if (running) {
        simulation.updatePositions();
        simulation.updateDrawing();
    }
}
animate();

//for (let _ = 0; _ < 30; _++) {
    //tree.insert(_, [getRandomFloat(0, 1000), getRandomFloat(0, 1000)])
//}