import { Renderer } from 'lance-gg';
import Ship from './../common/Ship';
// import Asteroid from './../common/Asteroid';
import LobbyRenderer from './renderers/Lobby';
import HelmRenderer from './renderers/Helm';
import NavRenderer from './renderers/Nav';
import GamesMasterRenderer from './renderers/GamesMaster';
import CompositeRenderer from './renderers/Composite';
import SignalsRenderer from './renderers/Signals';
import LocalMap from './renderers/SubRenderers/LocalMap';
import EmitOnOff from 'emitonoff';

let ctx = null;
let game = null;
let canvas = null;
let renderer = null;
let client = null;

export default class NvRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        game = gameEngine;
        client = clientEngine;
    }

    setRenderer(station) {

        // set some useful vars for positioning subRenderers
        let fullWidth = window.innerWidth;
        let fullHeight = window.innerHeight;
        let halfWidth = (fullWidth/2);
        let halfHeight = (fullHeight/2);
        let spaceWidth = fullWidth - fullHeight;
        if (spaceWidth < 0) spaceWidth = 0;

        // actually configure and set the renderer
        this.removeRenderer();
        if (station == 'helm') {
            renderer = new HelmRenderer(game, client);
        } else if (station == 'nav') {
            renderer = new NavRenderer(game, client);
        } else if (station == 'signals') {
            renderer = new SignalsRenderer(game, client);
        } else if (station == 'captain') {
            renderer = new CompositeRenderer(game, client, {
              station: 'captain',
              stationProperty: 'captainPlayerId',
              baseUrl: '/',
              dashboardColor: 0xCC0000,
              subRenderers: [
                new LocalMap({
                  x: halfWidth - halfHeight,
                  y: 0,
                  width: fullHeight,
                  height: fullHeight,
                  zIndex: 1,
                  baseUrl: '/'
                })
              ]
            });
        } else if (station == 'engineer') {
            // renderer = new SignalsRenderer(game, client);
            throw "Engineer Not Implemented";
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

    // defer draw to specific renderer
    draw(t, dt) {
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

    }

}
