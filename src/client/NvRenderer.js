import { Renderer } from 'lance-gg';
import Ship from './../common/Ship';
import LobbyRenderer from './renderers/Lobby';
import PilotRenderer from './renderers/Pilot';
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
        if (station == 'pilot') {
            renderer = new PilotRenderer(game, client);
        } else if (station == 'helm') {
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

                // station for actual role depends on hull,
                // e.g. a single seater hull just has helm and
                // gives a special single-seater pilot ui
                let hull = obj.getHullData();
                let stations = ['helm', 'nav', 'signals', 'captain', 'engineer'];
                if (hull.stations) {
                  stations = hull.stations;
                }

                if (hull.includes('pilot') && obj.helmPlayerId == game.playerId) {
                    station = 'pilot';
                } else if (hull.includes('helm') && obj.helmPlayerId == game.playerId) {
                    station = 'helm';
                } else if (hull.includes('pilot') && obj.helmPlayerId == game.playerId) {
                    station = 'pilot';
                } else if (hull.includes('nav') && obj.navPlayerId == game.playerId) {
                    station = 'nav';
                } else if (hull.includes('signals') && obj.signalsPlayerId == game.playerId) {
                    station = 'signals';
                } else if (hull.includes('captain') && obj.captainPlayerId == game.playerId) {
                    station = 'captain';
                } else if (hull.includes('engineer') && obj.engineerPlayerId == game.playerId) {
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

    // addObject(obj) {
    //   if (obj.playable) {
    //     this.playable = obj;
    //   }
    // }
    //
    // removeObject(obj) {
    //   if (obj.playable) {
    //     console.log("PLAYABLE REMOVED!");
    //   }
    // }

    // defer draw to specific renderer
    draw(t, dt) {

        // console.time("draw");
        // let startTime = performance.now();
        super.draw(t, dt);        

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
        // console.timeEnd("draw");
        // let endTime = performance.now();
        // let duration = endTime - startTime;
        // if (duration >= 16) {
            // console.log(`duration: ${duration}`);
        // }
    }


    runClientStep(t) {
        // console.time("runClientStep");

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

            // if (p + this.clientEngine.correction < 0) {
              // console.log("Negative dt:");
              // console.dir({
              //   t: t,
              //   p: p,
              //   lastStepTime: this.clientEngine.lastStepTime,
              //   correction: this.clientEngine.correction,
              //   new_t: (this.clientEngine.lastStepTime + p),
              //   dt: (p + this.clientEngine.correction)
              // });
            // }
            let dt = p + this.clientEngine.correction;
            if (dt < 0) dt = 0;
            this.clientEngine.step(this.clientEngine.lastStepTime + p, dt);
            this.clientEngine.lastStepTime += p;
            this.clientEngine.correction = 0;
        }

        // if not ready for a real step yet, return
        // this might happen after catch up above
        if (t < this.clientEngine.lastStepTime) {
            dt = t - this.clientEngine.lastStepTime + this.clientEngine.correction;
            // if (dt < 0) console.log("NvRenderer dt:"+dt+" (set to zero)");
            if (dt < 0) dt = 0;
            this.clientEngine.correction = this.clientEngine.lastStepTime - t;
            this.clientEngine.step(t, dt, true);
            // console.timeEnd("runClientStep");
            return;
        }

        // render-controlled step
        dt = t - this.clientEngine.lastStepTime + this.clientEngine.correction;
        // if (dt < 0) console.log("NvRenderer dt:"+dt);
        this.clientEngine.lastStepTime += p;
        this.clientEngine.correction = this.clientEngine.lastStepTime - t;
        this.clientEngine.step(t, dt);
        // console.timeEnd("runClientStep");
    }



}
