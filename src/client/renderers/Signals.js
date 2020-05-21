const PIXI = require('pixi.js');

import KeyboardControls from '../NvKeyboardControls.js';
import Assets from './Utils/images.js';
import {GlowFilter} from '@pixi/filter-glow';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import {BevelFilter} from '@pixi/filter-bevel';
import {CRTFilter} from '@pixi/filter-crt';

import Torpedo from './../../common/Torpedo';
import PDC from './../../common/PDC';
import Ship from './../../common/Ship';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';
import Hulls from './../../common/Hulls';
import Victor from 'victor';
import HelmUi from './Utils/HelmUi';
import HelmPathUi from './Utils/HelmPathUi';
import Comms from './../../common/Comms';
import SolarObjects from './../../common/SolarObjects';
import UiUtils from './Utils/UiUtils';

let destroyed = false;
let backToLobby = false;
let el = null;
let uiEls = {};
let game = null;
let client = null;
const GridDefault = 10000;
let settings = {
    baseUrl: '/',
    mapSize: 36000, // this is set in setSizes
    loadedSprites: false,
    gridSize: 10000, // this is set in setSizes
    waypointTexture: null,
    minimumScale: 0.001,
    minimumSpriteSize: 8,
    zIndex: {
      background: 1,
      grid: 2,
      paths: 2,
      asteroid: 10,
      planet: 11,
      torpedo: 49,
      ship: 50,
      waypoints: 60,
      dashboard: 100,
      ui: 101
    },
    predictTime: 120
};
let lastPlayerShip = null;
let pixiApp = null;
let pixiContainer = null;
let mapContainer = null;
let sprites = {};
let mapObjects = {}; // keep track of what we have added
let effects = {
    hudGlow: new GlowFilter({
      distance: 3,
      outerStrength: 5,
      innerStrength: 0,
      color: 0x000000,
      quality: 0.5
    }),
    waypointColor: new ColorReplaceFilter([0, 0, 0], [1, 1, 0], 0.1),
    selectionColor: new ColorReplaceFilter([0, 0, 0], [0, 1, 0], 0.1),
    pdcHudColor: new ColorReplaceFilter([0, 0, 0], [1, 1, 1], 0.1),
    bevel: new BevelFilter({lightAlpha: 0.1, shadowAlpha: 0.9}),
    crt: new CRTFilter({
      curvature: 8,
      lineWidth: 10,
      lineContrast: 0.4,
      noise: 0.2,
      noiseSize: 1.2,
      vignetting: 0,
      vignettingAlpha: 0,
      seed: 0,
      time: 0
    })
};

export default class SignalsRenderer {

    // create a PIXI app and add to the #game element, start load of resources
    constructor(gameEngine, clientEngine) {
        game = gameEngine;
        client = clientEngine;

        let root = document.getElementById('game');
        root.innerHTML = '';
        el = document.createElement('div');
        root.append(el);

        // work out some sizes for UI - populates settings var
        UiUtils.setSizes(settings, window, GridDefault);

        // create pixie app and container
        pixiApp = new PIXI.Application({
            width: settings.UiWidth,
            height: settings.UiHeight,
            backgroundColor: Assets.Colors.Black,
            resolution: window.devicePixelRatio || 1
        });
        // animate the mapContainers filter once it exists
        PIXI.Ticker.shared.add(function (time) {
          if (mapContainer.filters) {
            mapContainer.filters.forEach((f) => {
              f.time += 0.33;
              f.seed = Math.random();
            });
          }
        });
        pixiApp.stage.sortableChildren = true;
        pixiContainer = new PIXI.Container();
        pixiContainer.sortableChildren = true;
        pixiContainer.zIndex = 2;
        mapContainer = new PIXI.Container();
        mapContainer.sortableChildren = true;
        mapContainer.zIndex = 1;
        mapContainer.interactive = true;
        mapContainer.on('mousedown', this.canvasClick.bind(this));
        mapContainer.on('touchstart', this.canvasClick.bind(this));
        // mapContainer.filters = [effects.crt];
        pixiApp.stage.addChild(pixiContainer);
        pixiApp.stage.addChild(mapContainer);
        el.append(pixiApp.view); // add to the page

        // prepare to load resources
        const loader = PIXI.Loader.shared;

        // load sprites
        UiUtils.loadAllAssets(pixiApp.loader, settings.baseUrl);

        // manage loading of resources
        pixiApp.loader.load(this.loadResources.bind(this));

        // add ui might as well use html for the stuff it's good at
        this.drawUi(el);

        // custom keys
        this.controls = new KeyboardControls(client);
        this.controls.bindKey('left', 'pdcangle', { repeat: true }, { direction: '-' });
        this.controls.bindKey('right', 'pdcangle', { repeat: true }, { direction: '+' });
        this.controls.bindKey('up', 'pdcstate', { }, { direction: '+' });
        this.controls.bindKey('down', 'pdcstate', { }, { direction: '-' });

        // listen for explosion events
        gameEngine.emitonoff.on('explosion', this.addExplosion.bind(this));
    }

    remove() {
      if (el) {
        el.remove();
        el = null;
      }
    }

    addExplosion(obj) {

      if (lastPlayerShip) {
        let coord = UiUtils.relativeScreenCoord(obj.physicsObj.position[0],
                                             obj.physicsObj.position[1],
                                             lastPlayerShip.physicsObj.position[0],
                                             lastPlayerShip.physicsObj.position[1],
                                             pixiApp.screen.width,
                                             pixiApp.screen.height,
                                             lastPlayerShip.physicsObj.angle,
                                             settings.scale);

        let useSize = UiUtils.getUseSize(settings.scale, obj.size, obj.size, 0.01, 16);
        UiUtils.addExplosion(settings.resources[settings.baseUrl+Assets.Images.explosion].spritesheet,
          mapContainer,
          useSize.useWidth, useSize.useHeight,
          coord.x, coord.y, settings.zIndex.explosion);
      }
    }

    addPDC(x, y, area, explosionSize, numberPerSecond) {
      UiUtils.addPDC(settings.resources[settings.baseUrl+Assets.Images.explosion].spritesheet, mapContainer, x, y, area, explosionSize, numberPerSecond, settings.scale, 16, settings.zIndex.explosion);
    }

    destroyed(playerShip) {
      if (destroyed) return;
      destroyed = true;

      // remove some stuff
      if (mapObjects[settings.playerShipId]) {
          UiUtils.removeFromMap(mapObjects, sprites, settings.playerShipId);
      }
      if (sprites.helmPathUi) sprites.helmPathUi.clear();
      if (sprites.helmUi) sprites.helmUi.clear();

      let root = document.getElementById('game');
      UiUtils.leaveTimer("YOU WERE DESTROYED", root).then(function() {
        backToLobby = true;
      });
    }

    setTarget(objId) {
      client.setTarget(objId);
      this.removeCommsUi();

      let objects = this.getPlayerAndSelected(objId);
      if (objects) {
        if (objects.selectedObj.signalsPlayerId != game.playerId) {
            this.createInitialCommsUi(objects.selectedObj);
        }
      }
    }

    unsetTarget() {
      client.setTarget(-1);
      this.removeCommsUi();
    }

    canvasClick(event) {

        event.stopPropagation();

        // unselect selection
        this.unsetTarget();
    }

    // draw some controls
    drawUi(container) {
        uiEls.uiContainer = document.createElement("div");
        uiEls.uiContainer.classList.add('ui-container');
        uiEls.uiContainer.classList.add('signals');
        container.appendChild(uiEls.uiContainer);

        // torps
        uiEls.uiRightContainer = document.createElement("div");
        uiEls.uiRightContainer.classList.add('ui-container');
        uiEls.uiRightContainer.classList.add('signals');
        uiEls.uiRightContainer.classList.add('right');
        container.appendChild(uiEls.uiRightContainer);

        uiEls.uiWeapons = document.createElement("div");
        uiEls.uiWeapons.classList.add('ui-weapons');
        uiEls.uiWeapons.classList.add('ui-comms');
        uiEls.uiRightContainer.appendChild(uiEls.uiWeapons);

        // torps
        uiEls.uiTorps = document.createElement("div");
        uiEls.uiTorps.classList.add('ui-torps');
        uiEls.uiFireTorp = this.createButton(document, uiEls.uiTorps, "fireTorp", "Fire Torp", this.fireTorp.bind(this));
        uiEls.uiWeapons.appendChild(uiEls.uiTorps);

        // PDCs
        uiEls.uiPDCs = document.createElement("div");
        uiEls.uiPDCs.classList.add('ui-pdcs');
        uiEls.uiStopPDC = this.createButton(document, uiEls.uiPDCs, "uiStopPDC", "Stop PDC", this.stopPDC.bind(this));
        uiEls.uiActivatePDC = this.createButton(document, uiEls.uiPDCs, "uiActivatePDC", "Activate PDC", this.activatePDC.bind(this));
        uiEls.uiFirePDC = this.createButton(document, uiEls.uiPDCs, "uiFirePDC", "Fire PDC", this.firePDC.bind(this));
        uiEls.uiWeapons.appendChild(uiEls.uiPDCs);
    }

    createButton(document, container, id, innerHTML, onClick) {
        return UiUtils.addElement(container, document, "button", id, ['button', 'key'], innerHTML, onClick);
    }

    createLabel(document, container, id, innerHTML) {
        return UiUtils.addElement(container, document, "label", id, ['label'], innerHTML, null);
    }

    // clicked an object, do some stuff...
    objectClick(guid, eventData) {

        eventData.stopPropagation();

        let selectedGuid = parseInt(guid);
        let obj = game.world.queryObject({ id: selectedGuid });
        if (obj && obj.signalsPlayerId != game.playerId) {

          this.setTarget(selectedGuid);
        }
    }

    removeCommsUi() {
        if (uiEls.closeCommsButton) {
            uiEls.closeCommsButton.removeEventListener('click', this.closeComms.bind(this));
            uiEls.closeCommsButton.remove();
            uiEls.closeCommsButton = null;
        }
        if (uiEls.uiCommsOpen) {
            uiEls.uiCommsOpen.removeEventListener('click', this.openComms.bind(this));
            uiEls.uiCommsOpen.remove();
            uiEls.uiCommsOpen = null;
        }
        if (uiEls.uiCommsText) {
            uiEls.uiCommsText.remove();
            uiEls.uiCommsText = null;
        }
        if (uiEls.uiComms) {
            uiEls.uiComms.remove();
            uiEls.uiComms = null;;
        }
    }

    createInitialCommsUi() {

        // container
        uiEls.uiComms = document.createElement("div");
        uiEls.uiComms.classList.add('ui-comms');
        uiEls.uiContainer.appendChild(uiEls.uiComms);

        // let objects = this.getPlayerAndSelected();
        // if (objects) {

            // open comms button
            uiEls.uiCommsOpen = this.createButton(document, uiEls.uiComms, "openComms", "Open Comms", this.openComms.bind(this));
        // }

    }

    createResponseCommsUi(state) {

        uiEls.uiCommsText = this.createLabel(document, uiEls.uiComms, "commsText", state.text);

        state.responses.forEach((response, responseIndex) => {
            let responseButton = this.createButton(document, uiEls.uiComms, "response-"+response, response, this.sendCommsResponse.bind(this));
            responseButton.setAttribute('data-response', responseIndex);
            uiEls['uiCommsTextResponse'+responseIndex] = responseButton;
        });

        uiEls.closeCommsButton = this.createButton(document, uiEls.uiComms, "response-close", "Close Comms", this.closeComms.bind(this));
    }

    closeComms() {
        this.removeCommsUi();

        let objects = this.getPlayerAndSelected();
        if (objects) {
            let c = new Comms(game, client);
            c.closeComms(objects.playerShip, objects.selectedObj);

            if (objects.selectedObj.signalsPlayerId != game.playerId) {
                this.createInitialCommsUi(objects.selectedObj);
            }
        }
    }

    getPlayerAndSelected(objId) {

        let playerActualShip = null;
        game.world.forEachObject((objId, obj) => {
            if (obj instanceof Ship && obj.playable == 1) {
                if (obj.signalsPlayerId == game.playerId) {
                    playerActualShip = obj;
                }
            }
        });

        // check docked if we haven't found yet
        if (!playerActualShip) {
          game.world.forEachObject((objId, obj) => {
            if (obj instanceof Ship) {
              if (obj.docked && obj.docked.length > 0) {
                let dockedMatch = obj.docked.find(function(dockedShip) {
                  return (dockedShip.signalsPlayerId == game.playerId);
                });
                if (dockedMatch) {
                  playerActualShip = dockedMatch;
                }
              }
            }
          });
        }

        if (objId === undefined) {
          objId = playerActualShip.targetId;
        }

        // if (playerActualShip.targetId || playerActualShip.targetId === 0) {
        if (objId ||objId === 0) {

            let selectedGuid = parseInt(objId);
            let selectedObj = game.world.queryObject({ id: selectedGuid });
            if (selectedObj) {

                if (playerActualShip) {
                    return {
                        selectedObj: selectedObj,
                        playerShip: playerActualShip
                    }
                }
            }
        }
        return false;
    }

    fireTorp() {
      let objects = this.getPlayerAndSelected();
      if (objects) {
        client.fireTorp(objects.selectedObj.id);
      }
    }

    stopPDC() {
      if (lastPlayerShip.pdcState > 2) {
        client.pdcState('-');
        client.pdcState('-');
      } else if (lastPlayerShip.pdcState > 1) {
        client.pdcState('-');
      }
    }

    activatePDC() {
      if (lastPlayerShip.pdcState < 1) {
        client.pdcState('+');
      } else if (lastPlayerShip.pdcState > 1) {
        client.pdcState('-');
      }
    }

    firePDC() {
      if (lastPlayerShip.pdcState < 1) {
        client.pdcState('+');
        client.pdcState('+');
      } else if (lastPlayerShip.pdcState < 2) {
        client.pdcState('+');
      }
    }

    drawPDCHud(playerShip, hullData) {
      // set-up the PDC ui
      if (uiEls.uiStopPDC && hullData.pdc) {

        // set-up ui buttons
        if (playerShip.pdcState == 0) {
          uiEls.uiStopPDC.classList.add('active');
          uiEls.uiActivatePDC.classList.remove('active');
          uiEls.uiFirePDC.classList.remove('active');
        } else if (playerShip.pdcState == 1) {
          uiEls.uiStopPDC.classList.remove('active');
          uiEls.uiActivatePDC.classList.add('active');
          uiEls.uiFirePDC.classList.remove('active');
        } else if (playerShip.pdcState == 2) {
          uiEls.uiStopPDC.classList.remove('active');
          uiEls.uiActivatePDC.classList.remove('active');
          uiEls.uiFirePDC.classList.add('active');
        }

        // add or update the hud ui
        if (playerShip.pdcState > 0) {
          let rotation = UiUtils.adjustAngle(playerShip.pdcAngle);

          // draw/add the helm sprite and set rotation
          if (!sprites.pdcHud) {
            sprites.pdcHud = new PIXI.Sprite(settings.resources[settings.baseUrl+Assets.Images.pdchud].texture);
            sprites.pdcHud.filters = [ effects.pdcHudColor ];
            sprites.pdcHud.width = hullData.pdc.range * 2 * settings.scale;
            sprites.pdcHud.height = hullData.pdc.range * 2 * settings.scale;
            sprites.pdcHud.anchor.set(0.5);
            sprites.pdcHud.x = Math.floor(pixiApp.screen.width / 2);
            sprites.pdcHud.y = Math.floor(pixiApp.screen.height / 2);
            sprites.pdcHud.zIndex = settings.zIndex.dashboard;
            sprites.pdcHud.rotation = rotation;
            mapContainer.addChild(sprites.pdcHud);
          } else {
            sprites.pdcHud.rotation = rotation;
            sprites.pdcHud.visible = true;
          }
        } else if (sprites.pdcHud) {
          sprites.pdcHud.visible = false;
        }
      }
    }

    openComms() {
        this.removeCommsUi();

        // container
        uiEls.uiComms = document.createElement("div");
        uiEls.uiComms.classList.add('ui-comms');
        uiEls.uiComms.classList.add('open');
        uiEls.uiContainer.appendChild(uiEls.uiComms);

        let objects = this.getPlayerAndSelected();
        if (objects) {

            let c = new Comms(game, client);

            let conversation = c.openComms(objects.playerShip, objects.selectedObj); // returns text and possible responses
            uiEls.uiCommsText = this.createLabel(document, uiEls.uiComms, "commsText", conversation.text);

            conversation.responses.forEach((response, responseIndex) => {
                let responseButton = this.createButton(document, uiEls.uiComms, "response-"+response, response, this.sendCommsResponse.bind(this));
                responseButton.setAttribute('data-response', responseIndex);
                uiEls['uiCommsTextResponse'+responseIndex] = responseButton;
            });

            uiEls.closeCommsButton = this.createButton(document, uiEls.uiComms, "response-close", "Close Comms", this.closeComms.bind(this));

        }
    }

    sendCommsResponse(event) {

        this.removeCommsUi();

        // container
        uiEls.uiComms = document.createElement("div");
        uiEls.uiComms.classList.add('ui-comms');
        uiEls.uiComms.classList.add('open');
        uiEls.uiContainer.appendChild(uiEls.uiComms);

        let objects = this.getPlayerAndSelected();
        if (objects) {

            let response = event.currentTarget.getAttribute('data-response');
            response = parseInt(response);

            let c = new Comms(game, client);
            let state = c.respond(objects.playerShip, objects.selectedObj, response);
            this.createResponseCommsUi(state);
        }
    }

    // wrap default addToMap
    addInteractiveSpriteToMap(sprite, alias, guid, addLabel, useSize) {
      this.addSpriteToMap(sprite, alias, guid, addLabel, useSize);
      sprite.interactive = true;
      sprite.on('mousedown', (e) => { this.objectClick(guid, e) });
      sprite.on('touchstart', (e) => { this.objectClick(guid, e) });
    }

    addSpriteToMap(sprite, alias, guid, addLabel, useSize) {

      mapObjects[guid] = sprite;
      mapContainer.addChild(sprite);

      if (addLabel) {
          sprites[guid+'-label'] = new PIXI.Text(alias, {fontFamily : 'Arial', fontSize: 12, fill : 0xFFFFFF, align : 'center'});
          // sprites[guid+'-label'].filters = [ effects.hudGlow ];
          sprites[guid+'-label'].anchor.set(0, 0.5);
          sprites[guid+'-label'].x = sprite.x + (3 + Math.floor(useSize.useWidth));
          sprites[guid+'-label'].y = sprite.y - (3 + Math.floor(useSize.useHeight));
          sprites[guid+'-label'].rotation = (-0.25 * Math.PI);
          sprites[guid+'-label'].zIndex = settings.zIndex.ui;

          mapObjects[guid+'-label'] = sprites[guid+'-label'];
          mapContainer.addChild(sprites[guid+'-label']);
      }

      mapContainer.sortChildren();
      return sprite;
    }

    updateShipEngine(ship, guid, useSize) {

      let hullData = Hulls[ship.hull];
      if (hullData.enginePositions) {

        let sprite = mapObjects[guid];

        if (sprite) {
          hullData.enginePositions.forEach(function(e, i) {
            let size = (ship.engine || 0) * useSize.useWidth * e[0];

            // scale based on ship engine level
            let exhaustSprite = sprite.getChildByName('exhaust-'+i);
            if (exhaustSprite) {
              exhaustSprite.width = size;
              exhaustSprite.height = size; // sprite needs to be square
            }

          });
        }
      }
    }

    createShipSprite(ship, width, height, x, y, zIndex, minimumScale, minimumSize) {

      let useSize = UiUtils.getUseSize(settings.scale, width, height, minimumScale, minimumSize);
      let hullData = Hulls[ship.hull];
      let texture = settings.resources[settings.baseUrl+hullData.image].texture;

      // container is actually twice the size (for effects etc)
      let container = new PIXI.Container();
      container.width = useSize.useWidth * 2;
      container.height = useSize.useHeight * 2;
      container.pivot.x = useSize.useWidth;
      container.pivot.y = useSize.useHeight;
      container.x = x;
      container.y = y;
      container.zIndex = zIndex;

      // ships are containers for a main sprite plus engines and possibly other sprites
      let body = new PIXI.Sprite(texture);
      body.width = useSize.useWidth;
      body.height = useSize.useHeight;
      body.anchor.set(0.5);
      body.x = useSize.useWidth;
      body.y = useSize.useHeight;
      body.zIndex = 10;
      container.addChild(body);

      // create the engine sprite but make it invisible
      if (hullData.enginePositions) {
        let exhaustSheet = settings.resources[settings.baseUrl+Assets.Images[hullData.exhaustImage]].spritesheet;

        hullData.enginePositions.forEach(function(e, i) {
          let size = (ship.engine || 0) * useSize.useWidth * e[0];
          let exhaust = new PIXI.AnimatedSprite(exhaustSheet.animations[hullData.exhaustImage]);
          exhaust.width = size;
          exhaust.height = size; // sprite needs to be square
          exhaust.anchor.set(0.5, 0);
          exhaust.x = (useSize.useWidth*0.5) + (useSize.useWidth * e[1]);
          exhaust.y = (useSize.useHeight*0.5) + (useSize.useHeight * e[2]);
          exhaust.loop = true;
          exhaust.play();
          exhaust.zIndex = 5;
          exhaust.name = 'exhaust-'+i;
          container.addChild(exhaust);

        });
      }

      return container;
    }

    // wrap default addToMap
    addInteractiveToMap(alias, guid, texture, width, height, x, y, zIndex, minimumScale, minimumSize, addLabel) {
      let sprite = this.addToMap(alias, guid, texture, width, height, x, y, zIndex, minimumScale, minimumSize, addLabel);
      sprite.interactive = true;
      sprite.on('mousedown', (e) => { this.objectClick(guid, e) });
      sprite.on('touchstart', (e) => { this.objectClick(guid, e) });
    }

    addToMap(alias, guid, texture, width, height, x, y, zIndex, minimumScale, minimumSize, addLabel) {

        let useSize = UiUtils.getUseSize(settings.scale, width, height, minimumScale, minimumSize);

        sprites[guid] = new PIXI.Sprite(texture);
        sprites[guid].width = useSize.useWidth;
        sprites[guid].height = useSize.useHeight;
        sprites[guid].anchor.set(0.5);
        sprites[guid].x = x;
        sprites[guid].y = y;
        sprites[guid].zIndex = zIndex;
        if (guid.toString().startsWith('waypoint-')) {
            sprites[guid].filters = [ effects.waypointColor ];
            // sprites[guid].filters = [ effects.waypointColor, effects.hudGlow ];
        // } else {
        //     sprites[guid].filters = [ effects.hudGlow ];
        }
        // sprites[guid].tint = tint; // tint is rubbish - ships need color switch filters for palette

        return this.addSpriteToMap(sprites[guid], alias, guid, addLabel, useSize);
    }

    createGrid() {

        // remove old one
        if (sprites.gridSprite) {
            mapContainer.removeChild(sprites.gridSprite);
            sprites.gridSprite.destroy(true);
            sprites.gridSprite = null;
        }

        // add a background image
        let backgroundTexture = settings.resources[settings.baseUrl+Assets.Images.space].texture;
        sprites.backgroundSprite = new PIXI.TilingSprite(backgroundTexture, 1024, 1024);
        sprites.backgroundSprite.anchor.set(0.5);
        sprites.backgroundSprite.x = Math.floor(settings.UiWidth / 2);
        sprites.backgroundSprite.y = Math.floor(settings.UiHeight / 2);
        sprites.backgroundSprite.width = settings.UiWidth;
        sprites.backgroundSprite.height = settings.UiHeight;
        sprites.backgroundSprite.zIndex = settings.zIndex.background;
        mapContainer.addChild(sprites.backgroundSprite);

        // create a texture for the grid background
        let gridGraphics = new PIXI.Graphics();
        // once the grid is large draw extra lines
        let smallGridDivisions = 10;
        settings.smallGridDimenion = settings.GridDefault / 10;

        // draw grid depending on sizes
        let smallGridSize = Math.round(settings.gridSize/smallGridDivisions);
        gridGraphics.lineStyle(1, Assets.Colors.GridSmall);
        for (let iX = 0; iX < (smallGridDivisions-1); iX++) {
          gridGraphics.moveTo(smallGridSize*iX, 1); gridGraphics.lineTo(smallGridSize*iX, settings.gridSize - 1);
        }
        gridGraphics.moveTo(settings.gridSize - smallGridSize, 1); gridGraphics.lineTo(settings.gridSize - smallGridSize, settings.gridSize - 1);

        for (let iY = 0; iY < (smallGridDivisions-1); iY++) {
          gridGraphics.moveTo(1, smallGridSize*iY); gridGraphics.lineTo(settings.gridSize - 1, smallGridSize*iY);
        }
        gridGraphics.moveTo(1, settings.gridSize - smallGridSize); gridGraphics.lineTo(settings.gridSize - 1, settings.gridSize - smallGridSize);


        gridGraphics.lineStyle(1, Assets.Colors.Grid);
        gridGraphics.drawRect(0, 0, settings.gridSize, settings.gridSize);

        let gridTexture = pixiApp.renderer.generateTexture(gridGraphics);
        gridGraphics.destroy();
        sprites.gridSprite = new PIXI.TilingSprite(gridTexture, settings.gridSize, settings.gridSize);
        sprites.gridSprite.anchor.set(0.5);
        sprites.gridSprite.x = Math.floor(settings.UiWidth / 2);
        sprites.gridSprite.y = Math.floor(settings.UiHeight / 2);
        sprites.gridSprite.width = settings.UiWidth;
        sprites.gridSprite.height = settings.UiHeight;
        sprites.gridSprite.zIndex = settings.zIndex.grid;
        mapContainer.addChild(sprites.gridSprite);
    }

    loadResources(loader, resources) {

        settings.loadedSprites = true;
        settings.resources = resources;

        this.createGrid();

        // UI create a texture to overlay on top of the background
        let dashboardGraphics = new PIXI.Graphics();
        // dashboardGraphics.beginFill(Assets.Colors.Dashboard, 1);
        dashboardGraphics.beginTextureFill({
            texture: resources[settings.baseUrl+Assets.Images.dashboard].texture,
            color: Assets.Colors.Dashboard,
            alpha: 1
        });
        dashboardGraphics.drawRect(0, 0, settings.UiWidth, settings.UiHeight);
        dashboardGraphics.endFill();
        let dashboardTexture = pixiApp.renderer.generateTexture(dashboardGraphics);
        dashboardGraphics.destroy();
        sprites.dashboardSprite = new PIXI.Sprite(dashboardTexture);
        sprites.dashboardSprite.anchor.set(0.5);
        sprites.dashboardSprite.x = Math.floor(settings.UiWidth / 2);
        sprites.dashboardSprite.y = Math.floor(settings.UiHeight / 2);
        sprites.dashboardSprite.width = settings.UiWidth;
        sprites.dashboardSprite.height = settings.UiHeight;
        sprites.dashboardSprite.filters = [effects.bevel];
        sprites.dashboardSprite.zIndex = settings.zIndex.dashboard;

        let dashboardMaskGraphics = new PIXI.Graphics();
        dashboardMaskGraphics.beginFill(Assets.Colors.Black, 1);
        dashboardMaskGraphics.drawRect(0, 0, settings.UiWidth, settings.UiHeight);
        dashboardMaskGraphics.endFill();
        dashboardMaskGraphics.beginHole();
        dashboardMaskGraphics.drawCircle(sprites.dashboardSprite.x, sprites.dashboardSprite.y, Math.floor(settings.narrowUi / 2));
        dashboardMaskGraphics.endHole();
        sprites.dashboardSprite.invertMask = true;
        sprites.dashboardSprite.mask = dashboardMaskGraphics;
        pixiContainer.addChild(sprites.dashboardSprite);

        settings.waypointTexture = settings.resources[settings.baseUrl+Assets.Images.waypoint].texture;

        // sort the z-index
        pixiContainer.sortChildren();
        pixiApp.stage.sortChildren();
    }

    drawObjects(gameObjects, playerShip, t, dt) {

        // keep track of and return ids of stuff we have
        let drawnObjects = {};

        // if we have no selection - remove the selection sprite
        if (playerShip.targetId == null) {
            if (sprites.selection) {
                sprites.selection.destroy();
                sprites.selection = null;
            }
        }

        gameObjects.forEach((obj) => {

            drawnObjects[obj.id] = true;
            drawnObjects[obj.id + '-label'] = true;

            let isPDC = false;
            let alias = obj.id;
            let texture = null;
            let zIndex = settings.zIndex.asteroid;
            let widthRatio = 1;
            let labelObj = false;
            if (obj instanceof Asteroid) {
                texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
                alias = 'asteroid';
            } else if (obj instanceof PDC) {
                // instead of drawing - always create a load of random small explosions
                isPDC = true;
            } else if (obj instanceof Planet) {
                texture = settings.resources[settings.baseUrl+Assets.Images[obj.texture]].texture;
                zIndex = settings.zIndex.planet;
                alias = obj.texture;
                labelObj = true;
            } else if (obj instanceof Ship) {
                let hullData = Hulls[obj.hull];
                texture = settings.resources[settings.baseUrl+hullData.image].texture;
                zIndex = settings.zIndex.ship;
                alias = obj.hull;
                widthRatio = hullData.width;
                labelObj = true;
            } else if (obj instanceof Torpedo) {
                let hullData = Hulls[obj.hull];
                texture = settings.resources[settings.baseUrl+hullData.image].texture;
                zIndex = settings.zIndex.torpedo;
                alias = obj.hull;
                widthRatio = hullData.width;
            }

            let coord = UiUtils.relativeScreenCoord(obj.physicsObj.position[0],
                                                 obj.physicsObj.position[1],
                                                 playerShip.physicsObj.position[0],
                                                 playerShip.physicsObj.position[1],
                                                 pixiApp.screen.width,
                                                 pixiApp.screen.height,
                                                 playerShip.physicsObj.angle,
                                                 settings.scale);

            if (isPDC) {
              this.addPDC(coord.x, coord.y, obj.size, 200, 6);
            } else {
              if (!mapObjects[obj.id]) {
                  if (obj instanceof Ship || obj instanceof Torpedo) {
                    let shipSprite = this.createShipSprite(obj, obj.size * widthRatio, obj.size, coord.x, coord.y, zIndex, 0.05, 12);
                    let useSize = UiUtils.getUseSize(settings.scale, obj.size * widthRatio, obj.size, 0.05, 12);
                    this.addInteractiveSpriteToMap(shipSprite, alias, obj.id, false, useSize);
                  } else {
                    this.addInteractiveToMap(alias,
                            obj.id,
                            texture,
                            obj.size * widthRatio, obj.size,
                            coord.x, coord.y,
                            zIndex, 0.05, 12, labelObj)
                  }
              } else {
                  // update position
                  mapObjects[obj.id].x = coord.x;
                  mapObjects[obj.id].y = coord.y;
                  mapObjects[obj.id].rotation = UiUtils.adjustAngle(obj.physicsObj.angle);

                  if (mapObjects[obj.id + '-label'] && mapObjects[obj.id]) {
                      mapObjects[obj.id + '-label'].x = coord.x + (3 + Math.floor(mapObjects[obj.id].width/2));
                      mapObjects[obj.id + '-label'].y = coord.y - (3 + Math.floor(mapObjects[obj.id].height/2));
                  }

                  if (obj instanceof Ship || obj instanceof Torpedo) {
                    if (obj.engine || obj.engine == 0) {
                      let useSize = UiUtils.getUseSize(settings.scale, obj.size * widthRatio, obj.size, 0.05, 12);
                      this.updateShipEngine(obj, obj.id, useSize);
                    }
                  }
              }
            }

            // if selected then highlight somehow
            if (playerShip.targetId === obj.id) {
                this.drawTarget(coord);
            }

        });

        return drawnObjects;
    }

    drawTarget(coord) {
      // let useSize = UiUtils.getUseSize(settings.scale, obj.size + 4, obj.size + 4, 0.05, 16);
      if (sprites.selection) {
          sprites.selection.x = coord.x;
          sprites.selection.y = coord.y;
          // sprites.selection.width = useSize.useWidth;
          // sprites.selection.height = useSize.useHeight;
      } else {
          sprites.selection = new PIXI.Sprite(settings.waypointTexture);
          sprites.selection.width = 16;
          sprites.selection.height = 16;
          // sprites.selection.width = useSize.useWidth;
          // sprites.selection.height = useSize.useHeight;
          sprites.selection.anchor.set(0.5);
          sprites.selection.x = coord.x;
          sprites.selection.y = coord.y;
          sprites.selection.zIndex = settings.zIndex.waypoints;
          // sprites.selection.filters = [ effects.selectionColor, effects.hudGlow ];
          sprites.selection.filters = [ effects.selectionColor ];
          mapContainer.addChild(sprites.selection);
      }
    }

    drawWaypoint(waypoint, playerShip) {

        let coord = UiUtils.relativeScreenCoord(waypoint.x,
             waypoint.y,
             playerShip.physicsObj.position[0],
             playerShip.physicsObj.position[1],
             pixiApp.screen.width,
             pixiApp.screen.height,
             0,
             settings.scale);

        if (!mapObjects["waypoint-"+waypoint.name]) {

            this.addInteractiveToMap(waypoint.name,
                          "waypoint-"+waypoint.name,
                          settings.waypointTexture,
                          16, 16,
                          coord.x, coord.y,
                          settings.zIndex.waypoints, 1, 16, true)
        } else {
            // update position
            mapObjects["waypoint-"+waypoint.name].x = coord.x;
            mapObjects["waypoint-"+waypoint.name].y = coord.y;
            if (mapObjects["waypoint-"+waypoint.name + '-label'] && mapObjects["waypoint-"+waypoint.name]) {

                mapObjects["waypoint-"+waypoint.name + '-label'].x = coord.x + (3 + Math.floor(mapObjects["waypoint-"+waypoint.name].width/2));
                mapObjects["waypoint-"+waypoint.name + '-label'].y = coord.y - (3 + Math.floor(mapObjects["waypoint-"+waypoint.name].height/2));
            }
        }
    }

    // update grid to reflect current position and
    // create/update/delete PIXI objects to match the world
    draw(t, dt) {

        if (settings.loadedSprites) {

            // keep track of all objects we have - so we can remove missing ones later
            let serverObjects = {};

            // find the player ship first, so we can set objects positions relative to it
            let playerShip = null;
            let isDocked = false;
            let gameObjects = [];
            game.world.forEachObject((objId, obj) => {
                if (obj instanceof Ship) {
                    if (obj.signalsPlayerId == game.playerId) {
                        playerShip = obj;
                    } else {
                        gameObjects.push(obj);
                    }
                } else {
                    gameObjects.push(obj);
                }
            });

            // check docked if we haven't found yet
            if (!playerShip) {
              game.world.forEachObject((objId, obj) => {
                if (obj instanceof Ship) {
                  if (obj.docked && obj.docked.length > 0) {
                    let dockedMatch = obj.docked.find(function(dockedShip) {
                      return (dockedShip.signalsPlayerId == game.playerId);
                    });
                    if (dockedMatch) {
                      isDocked = true;
                      playerShip = obj;
                      gameObjects = gameObjects.filter(function(mothership) {
                        return (mothership.id != obj.id);
                      });
                    }
                  }
                }
              });
            }

            if (!playerShip) {
              // must have been destroyed, keep original ship but flag as such
              playerShip = lastPlayerShip;
              this.destroyed(playerShip);
            } else {
              lastPlayerShip = playerShip;
            }

            if (playerShip) {

                let helmUiWaypoints = [];

                // if we have no target - remove the target sprite
                if (playerShip.targetId < 0) {
                    if (sprites.selection) {
                        sprites.selection.destroy();
                        sprites.selection = null;
                        this.unsetTarget();
                    }
                    uiEls.uiTorps.classList.add('inactive');
                } else {
                  uiEls.uiTorps.classList.remove('inactive');
                }

                if (!destroyed) {

                  serverObjects[playerShip.id] = true;

                  let hullData = Hulls[playerShip.hull];
                  let useSize = UiUtils.getUseSize(settings.scale, playerShip.size * hullData.width, playerShip.size, 0.01, 16);

                  // add the player ship sprite if we haven't got it
                  if (!mapObjects[playerShip.id]) {
                      settings.playerShipId = playerShip.id;
                      // this.addInteractiveToMap(playerShip.name,
                      //               playerShip.id,
                      //               settings.resources[settings.baseUrl+hullData.image].texture,
                      //               playerShip.size * hullData.width, playerShip.size ,
                      //               Math.floor(pixiApp.screen.width / 2), Math.floor(pixiApp.screen.height / 2),
                      //               settings.zIndex.ship, 0.01, 16, false)

                      let playershipSprite = this.createShipSprite(playerShip, playerShip.size * hullData.width, playerShip.size, Math.floor(pixiApp.screen.width / 2), Math.floor(pixiApp.screen.height / 2), settings.zIndex.ship, 0.01, 16);
                      this.addSpriteToMap(playershipSprite, playerShip.name, playerShip.id, true, useSize);
                      playershipSprite.interactive = true;
                      playershipSprite.on('mousedown', (e) => { this.objectClick(playerShip.id, e) });
                      playershipSprite.on('touchstart', (e) => { this.objectClick(playerShip.id, e) });
                  } else {
                    this.updateShipEngine(playerShip, playerShip.id, useSize);
                  }

                  if (playerShip.targetId == settings.playerShipId) {
                    this.drawSelection(new PIXI.Point(Math.floor(pixiApp.screen.width / 2), Math.floor(pixiApp.screen.height / 2)));
                  }

                  this.drawPDCHud(playerShip, hullData);

                  // draw waypoints (remember distance and direction)
                  if (playerShip.waypoints) {

                      playerShip.waypoints.forEach((wp) => {

                          let waypointParams = wp.split(',');
                          let waypoint = {
                              name: waypointParams[0],
                              x: parseInt(waypointParams[1]),
                              y: parseInt(waypointParams[2])
                          }

                          // check if the waypoint will be on screen, or to be drawn on the helm UI
                          waypoint.ourPos = Victor.fromArray(playerShip.physicsObj.position);
                          waypoint.waypointPos = Victor.fromArray([waypoint.x, waypoint.y]);
                          waypoint.waypointDirection = waypoint.waypointPos.clone().subtract(waypoint.ourPos);
                          waypoint.waypointDirection = new Victor(waypoint.waypointDirection.x, waypoint.waypointDirection.y);
                          waypoint.distanceToWaypoint = waypoint.waypointDirection.magnitude();
                          waypoint.bearing = waypoint.waypointDirection.angle() % (2 * Math.PI);

                          let ourSpeed = Victor.fromArray(playerShip.physicsObj.velocity);
                          waypoint.closing = (ourSpeed.dot(waypoint.waypointDirection) / waypoint.distanceToWaypoint);

                          if (waypoint.distanceToWaypoint < (settings.mapSize / 2)) {
                              // draw to map
                              serverObjects["waypoint-"+waypoint.name] = true;
                              serverObjects["waypoint-"+waypoint.name+'-label'] = true;
                              this.drawWaypoint(waypoint, playerShip);
                          } else {
                              // draw on the edge of the screen - helm UI
                              helmUiWaypoints.push(waypoint);
                          }
                      });
                  }
                }

                // update the grid
                UiUtils.updateGrid(settings, sprites, playerShip.physicsObj.position[0], playerShip.physicsObj.position[1]);

                // set the player ship rotation
                if (mapObjects[playerShip.id]) {
                  mapObjects[playerShip.id].rotation = UiUtils.adjustAngle(playerShip.physicsObj.angle);
                }

                // update engine
                settings.engineLevel = playerShip.engine;

                // update the UI
                let speedV = Victor.fromArray(playerShip.physicsObj.velocity);
                let speed = Math.abs(Math.round(speedV.length()));

                let course = Victor.fromArray(playerShip.physicsObj.velocity).angle();
                let bearing = (playerShip.physicsObj.angle + (0.5 * Math.PI)) % (2 * Math.PI);
                let gravity = null;
                let gravityPath = null;
                let predictedGravityPath = null;
                if (playerShip.gravityData && playerShip.gravityData.direction) {
                  gravity = Victor.fromArray([playerShip.gravityData.direction.x, playerShip.gravityData.direction.y]);

                  predictedGravityPath = UiUtils.predictPath({
                    physicsObj: {
                      position: playerShip.gravityData.source,
                      velocity: playerShip.gravityData.velocity,
                      mass: playerShip.gravityData.mass
                    }
                  }, settings.predictTime);
                  gravityPath = UiUtils.relativeScreenCoords(predictedGravityPath,
                                                         playerShip.physicsObj.position[0],
                                                         playerShip.physicsObj.position[1],
                                                         pixiApp.screen.width,
                                                         pixiApp.screen.height,
                                                         playerShip.physicsObj.angle,
                                                         settings.scale);
                }

                // predict a path for x seconds into the future
                let predictedPath = UiUtils.predictPath(playerShip, settings.predictTime);

                // adjust the path to be relative to the gravity source
                if (predictedGravityPath) {
                  let gravitySourcePosition = Victor.fromArray(playerShip.gravityData.source);
                  for (let pathIndex = 0; pathIndex < predictedPath.length; pathIndex++) {
                    // subtract the difference from the grav objects current position from position at same step
                    let gravitySourceDelta = predictedGravityPath[pathIndex].clone().subtract(gravitySourcePosition);
                    predictedPath[pathIndex] = predictedPath[pathIndex].clone().subtract(gravitySourceDelta);
                  }
                }

                let path = UiUtils.relativeScreenCoords(predictedPath,
                                                       playerShip.physicsObj.position[0], // adjust to relative to planet (as it moves)
                                                       playerShip.physicsObj.position[1],
                                                       pixiApp.screen.width,
                                                       pixiApp.screen.height,
                                                       playerShip.physicsObj.angle,
                                                       settings.scale);

               // get predictedPaths for the UI
               let predictedPaths = [];
               if (path && path.length > 0) {
                 predictedPaths.push({
                   color1: 0x00FF00,
                   color2: 0xFFFF00,
                   points: path
                 });
               }
               if (gravityPath && gravityPath.length > 0) {
                 predictedPaths.push({
                   color1: 0x00FF00,
                   color2: 0xFFFF00,
                   points: gravityPath
                 });
               }

              // draw predicted paths
              if (!sprites.helmPathUi) {
                  sprites.helmPathUi = new HelmPathUi({
                      uiSize: settings.narrowUi,
                      uiWidth: settings.UiWidth,
                      uiHeight: settings.UiHeight,
                      scale: settings.scale,
                      zIndex: settings.zIndex.paths,
                      paths: predictedPaths
                  });
                  mapContainer.addChild(sprites.helmPathUi);
              } else {
                  sprites.helmPathUi.update(predictedPaths);
              }


                // draw a marker to show bearing
                if (!sprites.helmUi) {
                    sprites.helmUi = new HelmUi({
                        uiSize: settings.narrowUi,
                        uiWidth: settings.UiWidth,
                        uiHeight: settings.UiHeight,
                        scale: settings.scale,
                        bearing: bearing,
                        course: course,
                        gravity: gravity ? gravity.angle() : null,
                        zIndex: settings.zIndex.ui,
                        waypoints: helmUiWaypoints
                    });
                    mapContainer.addChild(sprites.helmUi);
                } else {
                    sprites.helmUi.update(bearing, course, gravity ? gravity.angle() : null, helmUiWaypoints);
                }

                // draw distance and closing speed for waypoints
                helmUiWaypoints.forEach((waypoint) => {

                    if (!sprites.waypoints) {
                        sprites.waypoints = {};
                    }

                    let wayPointText = waypoint.name + "\n" +
                                Math.round(waypoint.distanceToWaypoint) + SolarObjects.units.distance + "\n" +
                               waypoint.closing.toPrecision(3) + SolarObjects.units.speed;


                    if (!sprites.waypoints[waypoint.name]) {

                        sprites.waypoints[waypoint.name] = new PIXI.Text(wayPointText, {
                            fontFamily : 'Arial',
                            fontSize: 9,
                            fill : 0xFFFFFF,
                            align : 'center'
                        });
                        // sprites.waypoints[waypoint.name].filters = [ effects.hudGlow ];
                        sprites.waypoints[waypoint.name].anchor.set(0.5);
                        sprites.waypoints[waypoint.name].x = Math.floor(settings.UiWidth / 2);
                        sprites.waypoints[waypoint.name].y = Math.floor(settings.UiHeight / 2);
                        sprites.waypoints[waypoint.name].pivot = new PIXI.Point(0, (Math.floor(settings.narrowUi / 2) - 22));
                        sprites.waypoints[waypoint.name].rotation = (waypoint.bearing + (0.5 * Math.PI)) % (2 * Math.PI);
                        sprites.waypoints[waypoint.name].zIndex = settings.zIndex.ui;
                        mapContainer.addChild(sprites.waypoints[waypoint.name]);
                        mapContainer.sortChildren();

                    } else {
                        sprites.waypoints[waypoint.name].text = wayPointText;
                        sprites.waypoints[waypoint.name].rotation = (waypoint.bearing + (0.5 * Math.PI)) % (2 * Math.PI);;
                    }

                });

                // remove helm waypoint markers for waypoints not in use
                if (sprites.waypoints) {
                    Object.keys(sprites.waypoints).forEach(function(key) {
                        if (key) {
                            // look for waypoint in ships waypoints
                            let wp = helmUiWaypoints.find(function(waypoint) {
                                return (waypoint.name == key);
                            });
                            if (!wp) {
                                sprites.waypoints[key].destroy();
                                delete sprites.waypoints[key];
                            }
                        }
                    });
                }

                // draw speed and gravity text
                if (!sprites.speedText) {
                    sprites.speedText = new PIXI.Text(speed + SolarObjects.units.speed, {fontFamily : 'Arial', fontSize: 9, fill : 0xFFFFFF, align : 'center'});
                    // sprites.speedText.filters = [ effects.hudGlow ];
                    sprites.speedText.anchor.set(0.5);
                    sprites.speedText.x = Math.floor(settings.UiWidth / 2);
                    sprites.speedText.y = Math.floor(settings.UiHeight / 2);
                    sprites.speedText.pivot = new PIXI.Point(0, (Math.floor(settings.narrowUi / 2) - 16));
                    sprites.speedText.rotation = (course + (0.5 * Math.PI)) % (2 * Math.PI);
                    sprites.speedText.zIndex = settings.zIndex.ui;
                    mapContainer.addChild(sprites.speedText);
                    mapContainer.sortChildren();
                } else {
                    sprites.speedText.text = speed + SolarObjects.units.speed;
                    sprites.speedText.rotation = (course + (0.5 * Math.PI)) % (2 * Math.PI);
                }

                if (gravity) {

                    let gravityDistanceText = Math.round(gravity.length());
                    let gravityAmountText = Math.round((playerShip.gravityData.amount / (playerShip.physicsObj.mass)) * 100) / 100;

                    let gravityHeading = Victor.fromArray([playerShip.gravityData.velocity.x, playerShip.gravityData.velocity.y]);
                    let closing = ((speedV.clone().subtract(gravityHeading)).dot(gravity) / gravity.length());

                    // let gravText = gravityDistanceText + SolarObjects.units.distance + "\n" +
                    //                gravityAmountText + SolarObjects.units.force + "\n" +
                    //                closing.toPrecision(3) + SolarObjects.units.speed;
                    let gravText = gravityDistanceText + SolarObjects.units.distance + "\n" +
                                   closing.toPrecision(3) + SolarObjects.units.speed;

                    if (!sprites.gravityText) {
                        sprites.gravityText = new PIXI.Text(gravText, {
                            fontFamily : 'Arial',
                            fontSize: 9,
                            fill : 0xFFFFFF,
                            align : 'center'
                        });
                        // sprites.gravityText.filters = [ effects.hudGlow ];
                        sprites.gravityText.anchor.set(0.5);
                        sprites.gravityText.x = Math.floor(settings.UiWidth / 2);
                        sprites.gravityText.y = Math.floor(settings.UiHeight / 2);
                        sprites.gravityText.pivot = new PIXI.Point(0, (Math.floor(settings.narrowUi / 2) - 22));
                        sprites.gravityText.rotation = (gravity.angle() + (0.5 * Math.PI)) % (2 * Math.PI);
                        sprites.gravityText.zIndex = settings.zIndex.ui;
                        mapContainer.addChild(sprites.gravityText);
                        mapContainer.sortChildren();
                    } else {
                        sprites.gravityText.text = gravText;
                        sprites.gravityText.rotation = (gravity.angle() + (0.5 * Math.PI)) % (2 * Math.PI);
                    }
                } else {
                    // remove gravity from UI
                    if (sprites.gravityText) {
                        sprites.gravityText.destroy();
                        sprites.gravityText = null;
                    }
                }

                // draw stuff on the map
                let drawnObjects = this.drawObjects(gameObjects, playerShip, t, dt);
                serverObjects = Object.assign(serverObjects, drawnObjects);

                // remove any objects that we no-longer have
                Object.keys(mapObjects).forEach((key) => {
                    if (!serverObjects[key]) {
                        UiUtils.removeFromMap(mapObjects, sprites, key);
                    }
                });


            }

        }

        return backToLobby;
    }

}
