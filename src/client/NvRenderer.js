import { Renderer } from 'lance-gg';
// import Bullet from './../common/Bullet';
import Ship from './../common/Ship';
// import Asteroid from './../common/Asteroid';
import LobbyRenderer from './renderers/Lobby';
import HelmRenderer from './renderers/Helm';
import NavRenderer from './renderers/Nav';
import SignalsRenderer from './renderers/Signals';
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

    setSubRenderer(station) {
        if (station == 'helm') {
            renderer = new HelmRenderer(game, client);
        } else if (station == 'nav') {
            renderer = new NavRenderer(game, client);
        } else if (station == 'signals') {
            renderer = new SignalsRenderer(game, client);
        } else {
            // default to lobby
            renderer = new LobbyRenderer(game, client);
        }
    }

    detectSubRenderer() {

        console.log("detectSubRenderer");

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
                }
            }
        });

        // renderer depends on which station you are using
        if (station == 'helm') {
            renderer = new HelmRenderer(game, client);
        } else if (station == 'nav') {
            renderer = new NavRenderer(game, client);
        } else if (station == 'signals') {
            renderer = new SignalsRenderer(game, client);
        } else {
            // default to lobby
            renderer = new LobbyRenderer(game, client);
        }
    }

    // defer draw to specific renderer
    draw(t, dt) {
        super.draw(t, dt);

        if (renderer) {
            let backToLobby = renderer.draw(t, dt);
            if (backToLobby) {
                renderer = new LobbyRenderer(game, client);
            }
        } else {
            // on first draw, feels like there should be a place for this but constructor
            // doesn't have the world and playerId initialised yet
            this.detectSubRenderer();
        }

    }

}
