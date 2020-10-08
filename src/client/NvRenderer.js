import { Renderer } from 'lance-gg';
import Ship from './../common/Ship';
import LobbyRenderer from './renderers/Lobby';
import HelmRenderer from './renderers/Helm';
import CaptainRenderer from './renderers/Captain';
import EngineerRenderer from './renderers/Engineer';
import NavRenderer from './renderers/Nav';
import SignalsRenderer from './renderers/Signals';
import EmitOnOff from 'emitonoff';

let ctx = null;
let game = null;
let canvas = null;
let renderer = null;
let client = null;

const TIME_RESET_THRESHOLD = 100;

export default class NvRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        game = gameEngine;
        client = clientEngine;
    }

    setRenderer(station) {

        // set some useful vars for positioning subRenderers
        const fullWidth = window.innerWidth;
        const fullHeight = window.innerHeight;
        const halfWidth = Math.round(fullWidth/2);
        const halfHeight = Math.round(fullHeight/2);
        let spaceWidth = fullWidth - fullHeight;
        let margin = 30;
        if (spaceWidth < 0) {
          spaceWidth = 0;
          margin = 15;
        }
        const sideWidth = Math.round((spaceWidth/2) - margin);
        const marginFull = margin * 2;
        const sideControlsMin = 200;

        // actually configure and set the renderer
        this.removeRenderer();
        if (station == 'helm') {
            renderer = new HelmRenderer(game, client);
        } else if (station == 'nav') {
            renderer = new NavRenderer(game, client);
        } else if (station == 'signals') {
            renderer = new SignalsRenderer(game, client);
        } else if (station == 'captain') {
            renderer = new CaptainRenderer(game, client);
        } else if (station == 'engineer') {
            renderer = new EngineerRenderer(game, client);
        } else if (station == 'gm') {
          renderer = new GamesMasterRenderer(game, client);
        } else {
            // default to lobby
            renderer = new LobbyRenderer(game, client);
        }
    }

    detectRenderer() {

        // check for your playerId
        let station = null;
        game.world.forEachObject((objId, obj) => {
            if (obj instanceof Ship) {
                if (obj.helmPlayerId == game.playerId) {
                    station = 'helm';
                } else if (obj.navPlayerId == game.playerId) {
                    station = 'nav';
                } else if (obj.signalsPlayerId == game.playerId) {
                    station = 'signals';
                } else if (obj.captainPlayerId == game.playerId) {
                    station = 'captain';
                } else if (obj.engineerPlayerId == game.playerId) {
                    station = 'engineer';
                }
            }
        });

        // renderer depends on which station you are using
        this.setRenderer(station);
    }

    removeRenderer() {
      if (renderer) {
        renderer.remove();
      }
    }

    addObject(obj) {
      console.log("addObject:"+(obj.name || obj.texture));
      if (obj.playable) {
        this.playable = obj;
      }
    }

    removeObject(obj) {
      console.log("removeObject:"+(obj.name || obj.texture));
      if (obj.playable) {
        console.log("PLAYABLE REMOVED!");
      }
    }

    // defer draw to specific renderer
    draw(t, dt) {
      if (this.playable && this.playable.physicsObj && isNaN(this.playable.physicsObj.position[0])) {
        console.error("A this.playable:"+this.playable.physicsObj.position.toString());
      }
        // console.log(`t:${t} dt:${dt}`);
        super.draw(t, dt);

        if (this.playable && this.playable.physicsObj && isNaN(this.playable.physicsObj.position[0])) {
          console.error("B this.playable:"+this.playable.physicsObj.position.toString());
        }
        if (renderer) {
            let backToLobby = renderer.draw(t, dt);
            if (backToLobby) {
                this.setRenderer(backToLobby);
            }
        } else {
            // on first draw, feels like there should be a place for this but
            // constructor doesn't have the world and playerId initialised yet
            this.detectRenderer();
        }

    }

    runClientStep(t) {
        let p = this.clientEngine.options.stepPeriod;
        let dt = 0;

        // reset step time if we passed a threshold
        if (this.doReset || t > this.clientEngine.lastStepTime + TIME_RESET_THRESHOLD) {
            this.doReset = false;
            this.clientEngine.lastStepTime = t - p / 2;
            this.clientEngine.correction = p / 2;
        }

        // catch-up missed steps
        while (t > this.clientEngine.lastStepTime + p) {

            if (p + this.clientEngine.correction < 0) {
              console.log("JIM:");
              console.dir({
                t: t,
                p: p,
                lastStepTime: this.clientEngine.lastStepTime,
                correction: this.clientEngine.correction,
                new_t: (this.clientEngine.lastStepTime + p),
                dt: (p + this.clientEngine.correction)
              });
            }
            this.clientEngine.step(this.clientEngine.lastStepTime + p, p + this.clientEngine.correction);
            this.clientEngine.lastStepTime += p;
            this.clientEngine.correction = 0;
        }

        // if not ready for a real step yet, return
        // this might happen after catch up above
        if (t < this.clientEngine.lastStepTime) {
            dt = t - this.clientEngine.lastStepTime + this.clientEngine.correction;
            console.log("NvRenderer dt:"+dt+" (set to zero)");
            if (dt < 0) dt = 0;
            this.clientEngine.correction = this.clientEngine.lastStepTime - t;
            this.clientEngine.step(t, dt, true);
            return;
        }

        // render-controlled step
        dt = t - this.clientEngine.lastStepTime + this.clientEngine.correction;
        console.log("NvRenderer dt:"+dt);
        this.clientEngine.lastStepTime += p;
        this.clientEngine.correction = this.clientEngine.lastStepTime - t;
        this.clientEngine.step(t, dt);
    }

}
