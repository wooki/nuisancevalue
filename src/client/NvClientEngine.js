import { ClientEngine, KeyboardControls } from 'lance-gg';
import NvRenderer from '../client/NvRenderer';

const betaTiltThreshold = 40;
const gammaTiltThreshold = 40;
const steerThreshold = 0.4;

export default class NvClientEngine extends ClientEngine {

    constructor(gameEngine, options) {
        super(gameEngine, options, NvRenderer);
    }

    setTarget(objId) {
        this.sendInput("target", { objId: objId });
    }

    fireTorp(objId) {
        this.sendInput("firetorp", { objId: objId });
    }

    firePDC(angle, state) {
        this.sendInput("pdc", { angle: angle, state: state });
    }

    loadMission(id) {
        this.sendInput("load-mission", { missionId: id });
    }

    joinShip(objId, station) {
        this.sendInput("join-ship", { objId: objId, station: station });
    }

    setEngine(level) {
        this.sendInput("engine", { level: level} );
    }

    setManeuver(direction) {
        this.sendInput("maneuver", { direction: direction} );
    }

    addWaypoint(name, x, y) {
        this.sendInput("waypoint", { name: name, x: x, y: y } );
    }

    removeWaypoint(name) {
        this.sendInput("waypoint", { name: name } );
    }

    // update ship comms
    updateShipComms(params) {
        this.sendInput("comms", params );
    }

    dock(objId) {
        this.sendInput("dock", { target: objId } );
    }

    undock() {
        this.sendInput("undock");
    }

}

// function isTouchDevice() {
//     return 'ontouchstart' in window || navigator.maxTouchPoints;
// }
