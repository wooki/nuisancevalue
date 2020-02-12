import { ClientEngine, KeyboardControls } from 'lance-gg';
import NvRenderer from '../client/NvRenderer';

const betaTiltThreshold = 40;
const gammaTiltThreshold = 40;
const steerThreshold = 0.4;

export default class NvClientEngine extends ClientEngine {

    constructor(gameEngine, options) {
        super(gameEngine, options, NvRenderer);
    }

    // send to game
    joinShip(objId, station) {
        this.sendInput("join-ship", { objId: objId, station: station });
        this.renderer.setSubRenderer(station);
    }

    // send to game
    setEngine(level) {
        this.sendInput("engine", { level: level} );
    }

    // send to game
    setManeuver(direction) {
        this.sendInput("maneuver", { direction: direction} );
    }

    // add waypoint
    addWaypoint(name, x, y) {
        this.sendInput("waypoint", { name: name, x: x, y: y } );
    }

    removeWaypoint(name) {
        this.sendInput("waypoint", { name: name } );
    }


    // handleOrientation(event) {
    //     let isPortrait = window.innerHeight > window.innerWidth;
    //     let beta = event.beta;  // In degree in the range [-180,180]
    //     let gamma = event.gamma; // In degree in the range [-90,90]
    //     let flip = gamma > 0;
    //     let steerValue = Math.max(-1, Math.min(1, beta / betaTiltThreshold)) * (flip?-1:1);
    //     if (isPortrait) {
    //         flip = beta < 0;
    //         steerValue = Math.max(-1, Math.min(1, gamma / gammaTiltThreshold)) * (flip?-1:1);
    //     }

    //     this.actions.delete('left');
    //     this.actions.delete('right');
    //     if (steerValue < -steerThreshold) this.actions.add('left');
    //     else if (steerValue > steerThreshold) this.actions.add('right');
    // }

    // our pre-step is to process inputs that are "currently pressed" during the game step
    // preStep() {
    //     this.actions.forEach((action) => this.sendInput(action, { movement: true }));
    //     this.actions = new Set();
    // }

}

// function isTouchDevice() {
//     return 'ontouchstart' in window || navigator.maxTouchPoints;
// }
