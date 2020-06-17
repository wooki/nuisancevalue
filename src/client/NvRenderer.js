import { Renderer } from 'lance-gg';
import Ship from './../common/Ship';
// import Asteroid from './../common/Asteroid';
import LobbyRenderer from './renderers/Lobby';
import HelmRenderer from './renderers/Helm';
import NavRenderer from './renderers/Nav';
import GamesMasterRenderer from './renderers/GamesMaster';
import CompositeRenderer from './renderers/Composite';
import SignalsRenderer from './renderers/Signals';
import LocalMapBackground from './renderers/SubRenderers/LocalMapBackground';
import LocalMap from './renderers/SubRenderers/LocalMap';
import LocalMapHud from './renderers/SubRenderers/LocalMapHud';
import EngineControl from './renderers/SubRenderers/EngineControl';
import ManeuverControl from './renderers/SubRenderers/ManeuverControl';
import DockingControl from './renderers/SubRenderers/DockingControl';
import HudData from './renderers/SubRenderers/HudData';
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
            renderer = new CompositeRenderer(game, client, {
              station: 'captain',
              stationProperty: 'captainPlayerId',
              baseUrl: '/',
              dashboardColor: 0xCC0000,
              subRenderers: [
                new LocalMapBackground({
                  x: halfWidth - (halfHeight - margin),
                  y: margin,
                  width: fullHeight - marginFull,
                  height: fullHeight - marginFull,
                  zIndex: 5,
                  // backgroundAsset: 'black'
                }),
                new LocalMap({
                  x: halfWidth - (halfHeight - margin),
                  y: margin,
                  width: fullHeight - marginFull,
                  height: fullHeight - marginFull,
                  zIndex: 15
                }),
                new LocalMapHud({
                  x: halfWidth - (halfHeight - margin),
                  y: margin,
                  width: fullHeight - marginFull,
                  height: fullHeight - marginFull,
                  zIndex: 20
                }),
                new EngineControl({
                  x: margin,
                  y: fullHeight - (margin + 372),
                  zIndex: 30,
                  keyboardControls: true
                }),
                new ManeuverControl({
                  x: margin + margin + 60, // engine control + 2 margins
                  y: fullHeight - (margin + 63),
                  zIndex: 30,
                  keyboardControls: true
                }),
                new DockingControl({
                  x: margin,
                  y: margin,
                  width: Math.max(sideWidth, sideControlsMin),
                  height: (halfHeight - (margin * 2)),
                  zIndex: 30,
                  keyboardControls: true
                }),
                new HudData({
                  x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
                  y: margin,
                  width: Math.max(sideWidth, sideControlsMin),
                  height: fullHeight - marginFull,
                  zIndex: 30
                })
              ]
            });
        } else if (station == 'engineer') {
          renderer = new CompositeRenderer(game, client, {
            station: 'engineer',
            stationProperty: 'engineerPlayerId',
            baseUrl: '/',
            dashboardColor: 0xCC00CC,
            subRenderers: [
              new LocalMap({
                x: fullWidth - (400 + margin),
                y: margin,
                width: 400,
                height: 400,
                zIndex: 1,
                baseUrl: '/',
                mapSize: 6000,
                zoom: 1
              }),
              new LocalMapHud({
                x: fullWidth - (400 + margin),
                y: margin,
                width: 400,
                height: 400,
                zIndex: 2,
                baseUrl: '/',
                mapSize: 6000,
                zoom: 1,
                arrowSize: 10,
                arrowMargin: 6,
                dialSmallDividerSize: 2,
                dialLargeDividerSize: 5,
                dialFontSize: 7
              })
            ]
          });
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
