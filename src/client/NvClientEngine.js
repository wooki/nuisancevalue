import { ClientEngine, KeyboardControls } from 'lance-gg';
import NvRenderer from '../client/NvRenderer';

export default class NvClientEngine extends ClientEngine {

    constructor(gameEngine, options) {
        super(gameEngine, options, NvRenderer);
    }

    // start() {
    //   super.start();
    //
    //   // this.networkMonitor.on('RTTUpdate', (e) => {
    //   //   console.log(e);
    //   // });
    // }

    start() {
        this.stopped = false;
        this.resolved = false;
        // initialize the renderer
        // the render loop waits for next animation frame
        if (!this.renderer) alert('ERROR: game has not defined a renderer');
        let renderLoop = (timestamp) => {
            if (this.stopped) {
                this.renderer.stop();
                return;
            }
            this.lastTimestamp = this.lastTimestamp || timestamp;
            let dt = timestamp - this.lastTimestamp;
            if (dt <= 0) {
              console.error("dt:"+dt);
            }
            if (dt >= 100) {
              console.error("dt:"+dt);
            }
            this.renderer.draw(timestamp, timestamp - this.lastTimestamp);
            this.lastTimestamp = timestamp;
            window.requestAnimationFrame(renderLoop);
        };

        return this.renderer.init().then(() => {
            this.gameEngine.start();

            if (this.options.scheduler === 'fixed') {
                // schedule and start the game loop
                this.scheduler = new Scheduler({
                    period: this.options.stepPeriod,
                    tick: this.step.bind(this),
                    delay: STEP_DELAY_MSEC
                });
                this.scheduler.start();
            }

            if (typeof window !== 'undefined')
                window.requestAnimationFrame(renderLoop);
            if (this.options.autoConnect && this.options.standaloneMode !== true) {
                return this.connect()
                    .catch((error) => {
                        this.stopped = true;
                        throw error;
                    });
            }
        }).then(() => {
            return new Promise((resolve, reject) => {
                this.resolveGame = resolve;
                if (this.socket) {
                    this.socket.on('disconnect', () => {
                        if (!this.resolved && !this.stopped) {
                            if (this.options.verbose)
                                console.log('disconnected by server...');
                            this.stopped = true;
                            reject();
                        }
                    });
                }
            });
        });
    }

    scan(targetId) {
      this.sendInput("scan", { objId: targetId })
    }

    setPowerCell(row, col, newState) {
      this.sendInput("powercell", { row: row, col: col, state: newState });
    }

    loadTorp(tube, torpType) {
        this.sendInput("loadtorp", { tube: tube, torpType: torpType });
    }

    setTarget(objId) {
        this.sendInput("target", { objId: objId });
    }

    fireTorp(objId, tube) {
        this.sendInput("firetorp", { objId: objId, tube: tube });
    }

    pdcAngle(direction) {
        this.sendInput("pdcangle", { direction: direction });
    }

    pdcState(direction) {
        this.sendInput("pdcstate", { direction: direction });
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

    addWaypoint(objId, orbit) {
        this.sendInput("waypoint", { objId: objId, orbit: orbit } );
    }

    removeWaypoint(objId) {
        this.sendInput("waypoint", { objId: objId, orbit: -1 } );
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
