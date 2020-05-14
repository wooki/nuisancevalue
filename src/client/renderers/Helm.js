const PIXI = require('pixi.js');

import KeyboardControls from '../NvKeyboardControls.js';
import Assets from './Utils/images.js';
import {GlowFilter} from '@pixi/filter-glow';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import {BevelFilter} from '@pixi/filter-bevel';
import {CRTFilter} from '@pixi/filter-crt';
// import {OldFilmFilter} from '@pixi/filter-old-film';

import Ship from './../../common/Ship';
import Torpedo from './../../common/Torpedo';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';
import Hulls from './../../common/Hulls';
import Victor from 'victor';
import HelmUi from './Utils/HelmUi';
import HelmPathUi from './Utils/HelmPathUi';
import SolarObjects from './../../common/SolarObjects';
import UiUtils from './Utils/UiUtils';
import morphdom from 'morphdom';
import Damage from './../../common/Damage';

const GridDefault = 1000;
let destroyed = false;
let backToLobby = false;
let damage = new Damage();
let el = null;
let uiEls = {};
let game = null;
let client = null;
let leaveTimer = false;
let settings = {};
let lastPlayerShip = null;
let pixiApp = null;
let pixiContainer = null;
let mapContainer = null;
let sprites = {};
let mapObjects = {}; // keep track of what we have added
let effects = {};
let docking = {};

export default class HelmRenderer {

    // create a PIXI app and add to the #game element, start load of resources
    constructor(gameEngine, clientEngine) {
    	game = gameEngine;
      client = clientEngine;

      // set defaults
      destroyed = false;
      backToLobby = false;
      damage = new Damage();
      el = null;
      uiEls = {};
      leaveTimer = false;
      settings = {
          baseUrl: '/',
          mapSize: 10000,
          loadedSprites: false,
          gridSize: 1000, // set in setSizes
          waypointTexture: null,
          zIndex: {
              background: 1,
              grid: 2,
              paths: 2,
              asteroid: 10,
              planet: 11,
              torpedo: 49,
              ship: 50,
              waypoints: 60,
              explosion: 70,
              dashboard: 100,
              ui: 101
          },
          predictTime: 120
      };
      lastPlayerShip = null;
      pixiApp = null;
      pixiContainer = null;
      mapContainer = null;
      sprites = {};
      mapObjects = {}; // keep track of what we have added
      effects = {
          hudGlow: new GlowFilter({
            distance: 3,
            outerStrength: 5,
            innerStrength: 0,
            color: 0x000000,
            quality: 0.5
          }),
          waypointColor: new ColorReplaceFilter([0, 0, 0], [1, 1, 0], 0.1),
          targetColor: new ColorReplaceFilter([0, 0, 0], [0, 1, 0], 0.1),
          bevel: new BevelFilter({lightAlpha: 0.1, shadowAlpha: 0.9}),
          crt: new CRTFilter({
            curvature: 8,
            lineWidth: 10,
            lineContrast: 0.8, // 0.4,
            noise: 0.4, // 0.2,
            noiseSize: 1.6, // 1.2,
            vignetting: 0,
            vignettingAlpha: 0,
            seed: 0,
            time: 0
          }),
          // crt: new OldFilmFilter({
          //
          // })
      };
      docking = {
          dockable: null, // closest id < 1000 - allows us to start dock
          distance: null, // distance to closest id, so we can start dock to closest
          target: null, // id we are trying to dock with
          id: null, // id docked with
          progress: 0 // percent progress
      }


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

        this.controls = new KeyboardControls(client);
        this.controls.bindKey('0', 'engine', { }, { level: 0 });
        this.controls.bindKey('1', 'engine', { }, { level: 1 });
        this.controls.bindKey('2', 'engine', { }, { level: 2 });
        this.controls.bindKey('3', 'engine', { }, { level: 3 });
        this.controls.bindKey('4', 'engine', { }, { level: 4 });
        this.controls.bindKey('5', 'engine', { }, { level: 5 });
        this.controls.bindKey('left', 'maneuver', { }, { direction: 'l' });
        this.controls.bindKey('right', 'maneuver', { }, { direction: 'r' });
        this.controls.bindKey('up', 'engine', { }, { level: '+' });
        this.controls.bindKey('down', 'engine', { }, { level: '-' });

        // listen for explosion events
        gameEngine.emitonoff.on('explosion', this.addExplosion.bind(this));
    }

    remove() {
      if (el) {
        el.remove();
        el = null;
      }
    }

    setEngine(level) {
        settings.engineLevel = level;
        client.setEngine(level);
    }

    setManeuver(direction) {
        client.setManeuver(direction);
    }

    addExplosion(obj) {

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

    // draw some controls
    drawUi(container) {
        let uiContainer = document.createElement("div");
        uiContainer.classList.add('ui-container');
        uiContainer.classList.add('helm');
        container.appendChild(uiContainer);

        let uiEngineContainer = document.createElement("div");
        uiEngineContainer.classList.add('engine');
        uiContainer.appendChild(uiEngineContainer);
        uiEls.engineEl5 = this.createButton(document, uiEngineContainer, "engineOnBtn5", "5", () => { this.setEngine(5); });
        uiEls.engineEl4 = this.createButton(document, uiEngineContainer, "engineOnBtn4", "4", () => { this.setEngine(4); });
        uiEls.engineEl3 = this.createButton(document, uiEngineContainer, "engineOnBtn3", "3", () => { this.setEngine(3); });
        uiEls.engineEl2 = this.createButton(document, uiEngineContainer, "engineOnBtn2", "2", () => { this.setEngine(2); });
        uiEls.engineEl1 = this.createButton(document, uiEngineContainer, "engineOnBtn1", "1", () => { this.setEngine(1); });
        uiEls.engineEl0 = this.createButton(document, uiEngineContainer, "engineOffBtn", "0", () => { this.setEngine(0); });

        let uiManeuverContainer = document.createElement("div");
        uiManeuverContainer.classList.add('maneuver');
        uiContainer.appendChild(uiManeuverContainer);

        uiEls.manPortEl = this.createButton(document, uiManeuverContainer, "manPortBtn", "<", () => {
            this.setManeuver('l');
        });

        uiEls.manStarboardEl = this.createButton(document, uiManeuverContainer, "manStarboardBtn", ">", () => {
            this.setManeuver('r');
        });

        uiEls.uiDocking = document.createElement("div");
        uiEls.uiDocking.classList.add('ui-docking');
        uiEls.uiDocking.classList.add('inactive');
        uiContainer.appendChild(uiEls.uiDocking);

        uiEls.dockStartEl = this.createButton(document, uiEls.uiDocking, "dockStartBtn", "Start Docking", () => {
            docking.target = docking.dockable;
        });
        uiEls.dockCancelEl = this.createButton(document, uiEls.uiDocking, "dockCancelBtn", "Cancel Docking", () => {
            docking.id = null;
            docking.progress = 0;
            docking.target = null;
            docking.distance = null;
        });
        uiEls.dockDistanceEl = this.createLabel(document, uiEls.uiDocking, "dockDistanceEl", "Distance:");
        uiEls.dockClosingEl = this.createLabel(document, uiEls.uiDocking, "dockClosingEl", "Closing:");
        uiEls.dockProgressEl = this.createLabel(document, uiEls.uiDocking, "dockProgressEl", "Progress:");

        uiEls.dockUndockEl = this.createButton(document, uiContainer, "dockUndockBtn", "Undock", () => {
            // do the undock
            docking.id = null;
            docking.progress = 0;
            docking.target = null;
            docking.distance = null;
            client.undock();
        });
        uiEls.dockUndockEl.classList.add('ui-undock');
        uiEls.dockUndockEl.classList.add('inactive');


        uiEls.infoContainer = document.createElement("div");
        uiEls.infoContainer.classList.add('ui-container');
        uiEls.infoContainer.classList.add('helm');
        uiEls.infoContainer.classList.add('right');
        container.appendChild(uiEls.infoContainer);
    }

    createButton(document, container, id, innerHTML, onClick) {
        return UiUtils.addElement(container, document, "button", id, ['button', 'key'], innerHTML, onClick);
    }

    createLabel(document, container, id, innerHTML) {
        return UiUtils.addElement(container, document, "label", id, ['label'], innerHTML, null);
    }

    addSpriteToMap(sprite, alias, guid, addLabel, useSize) {

      mapObjects[guid] = sprite;
      mapContainer.addChild(sprite);

      if (addLabel) {
          sprites[guid+'-label'] = new PIXI.Text(alias, {fontFamily : 'Arial', fontSize: 12, fill : 0xFFFFFF, align : 'center'});
          sprites[guid+'-label'].filters = [ effects.hudGlow ];
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

      // create the engine sprite
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
            sprites[guid].filters = [ effects.waypointColor, effects.hudGlow ];
        } else {
            sprites[guid].filters = [ effects.hudGlow ];
        }
        // sprites[guid].tint = tint; // tint is rubbish - ships need color switch filters for palette

        return this.addSpriteToMap(sprites[guid], alias, guid, addLabel, useSize);
    }

    loadResources(loader, resources) {

        settings.loadedSprites = true;
        settings.resources = resources;

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

        gameObjects.forEach((obj) => {

            drawnObjects[obj.id] = true;
            drawnObjects[obj.id + '-label'] = true;

            let alias = obj.id;
            let texture = null;
            let zIndex = settings.zIndex.asteroid;
            let widthRatio = 1;
            if (obj instanceof Asteroid) {
                texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
                alias = 'asteroid';
            } else if (obj instanceof Planet) {
                texture = settings.resources[settings.baseUrl+Assets.Images[obj.texture]].texture;
                zIndex = settings.zIndex.planet;
                alias = obj.texture;
              } else if (obj instanceof Ship) {
                  let hullData = Hulls[obj.hull];
                  texture = settings.resources[settings.baseUrl+hullData.image].texture;
                  zIndex = settings.zIndex.ship;
                  alias = obj.hull;
                  widthRatio = hullData.width;
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

            if (!mapObjects[obj.id]) {
                if (obj instanceof Ship || obj instanceof Torpedo) {
                      let shipSprite = this.createShipSprite(obj, obj.size * widthRatio, obj.size, coord.x, coord.y, zIndex, 0.05, 12);
                      let useSize = UiUtils.getUseSize(settings.scale, obj.size * widthRatio, obj.size, 0.05, 12);
                      this.addSpriteToMap(shipSprite, alias, obj.id, false, useSize);
                    } else {
                      this.addToMap(alias,
                              obj.id,
                              texture,
                              obj.size * widthRatio, obj.size,
                              coord.x, coord.y,
                              zIndex, 0.05, 12, false);
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

            // if selected then highlight somehow
            if (playerShip.targetId === obj.id) {
                this.drawTarget(coord);
            }

            // display docking UI
            if (obj instanceof Ship) {
                let ourPos = Victor.fromArray(playerShip.physicsObj.position);
                let theirPos = Victor.fromArray(obj.physicsObj.position);
                let direction = theirPos.clone().subtract(ourPos);
                direction = new Victor(direction.x, 0 - direction.y);
                let distance = direction.magnitude();
                distance = distance - (obj.size + playerShip.size);// adjust disctance for size of two objects!
                if (distance < 0) {
                    distance = 0;
                }
                let ourVelocity = new Victor(playerShip.physicsObj.velocity[0], 0 - playerShip.physicsObj.velocity[1]);
                let theirVelocity = new Victor(obj.physicsObj.velocity[0], 0 - obj.physicsObj.velocity[1]);
                let closing = 0;
                if (distance != 0) {
                    closing = ((ourVelocity.clone().subtract(theirVelocity)).dot(direction) / distance);
                }
                let closingDesc = Math.round(closing);
                if (closing == Infinity || closing == -Infinity) {
                    closingDesc = "∞";
                }
                // let docking = {
                //     dockable: null, // closest id < 1000 - allows us to start dock
                //     distance: null, // distance to closest id, so we can start dock to closest
                //     target: null, // id we are trying to dock with
                //     id: null, // id docked with
                //     progress: 0 // percent progress
                // }
                if (docking.id == null && (playerShip.dockedId == null || playerShip.dockedId < 0)) {
                    if (docking.target == obj.id && distance <= 500 & Math.abs(closing) < 200) {

                        // dock if progress >= 100 (docking is instant on server)
                        if (docking.progress >= 100) {

                            client.setEngine(0); // stop engine

                            docking.id = docking.target;
                            docking.dockable = null;
                            docking.progress = 0;
                            docking.target = null;

                            uiEls.uiDocking.classList.add('inactive');

                            client.dock(docking.id);

                        } else {
                            // add progress (dt should = 16ms)
                            docking.progress = docking.progress + (dt / 50); // 100% is 10s

                            uiEls.dockDistanceEl.innerHTML = "Distance: "+Math.round(distance)+ "/500";
                            uiEls.dockClosingEl.innerHTML = "Closing: "+closingDesc+ "/200";
                            uiEls.dockProgressEl.innerHTML = "Progress: "+Math.round(docking.progress)+'%';
                        }


                    } else if (docking.target == obj.id && distance <= 1000) {

                        // reduce the progress
                        docking.progress = docking.progress - (dt / 100); // 100% is 10s
                        if (docking.progress < 0) {
                            docking.progress = 0;
                        }

                        uiEls.dockDistanceEl.innerHTML = "Distance: "+Math.round(distance)+ "/500";
                        uiEls.dockClosingEl.innerHTML = "Closing: "+closingDesc+ "/200";
                        uiEls.dockProgressEl.innerHTML = "Progress: "+Math.round(docking.progress)+'%';

                    } else if (docking.target == obj.id) {

                        // distance > 1000 so fail
                        docking.target = null;
                        docking.progress = 0;

                        // hide "cancel"/"progress"
                        uiEls.dockDistanceEl.innerHTML = "";
                        uiEls.dockClosingEl.innerHTML = "";
                        uiEls.dockProgressEl.innerHTML = "";

                    } else if (distance <= 1000) {

                        // docking.target == null // this will be always be the case due to prior ifs

                        // allow helm to "start docking procedure" with closest we are close to
                        if (docking.distance == null || distance < docking.distance) {
                            docking.distance = distance;
                            docking.dockable = obj.id;

                            // show "start" button
                            uiEls.uiDocking.classList.remove('inactive');

                        }

                    } else if (docking.dockable == obj.id) {

                        // distance > 1000 so remove from dockable
                        docking.distance = null;
                        docking.dockable = null;
                        docking.progress = 0;

                        // hide "start" button
                        uiEls.uiDocking.classList.add('inactive');
                        uiEls.dockDistanceEl.innerHTML = "";
                        uiEls.dockClosingEl.innerHTML = "";
                        uiEls.dockProgressEl.innerHTML = "";

                    }
                }
            } // not a ship, so can't dock


        });

        return drawnObjects;
    }

    drawTarget(coord) {
      // let useSize = UiUtils.getUseSize(settings.scale, obj.size + 4, obj.size + 4, 0.05, 16);
      if (sprites.target) {
          sprites.target.x = coord.x;
          sprites.target.y = coord.y;
      } else {
          sprites.target = new PIXI.Sprite(settings.waypointTexture);
          sprites.target.width = 16;
          sprites.target.height = 16;
          sprites.target.anchor.set(0.5);
          sprites.target.x = coord.x;
          sprites.target.y = coord.y;
          sprites.target.zIndex = settings.zIndex.waypoints;
          sprites.target.filters = [ effects.targetColor, effects.hudGlow ];
          mapContainer.addChild(sprites.target);
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

            this.addToMap(waypoint.name,
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
                    if (obj.helmPlayerId == game.playerId) {
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
                      return (dockedShip.helmPlayerId == game.playerId);
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
                // console.dir(playerShip);

                // check for damage
                if ((playerShip.damage & damage.HELM_CONSOLE_INTERFERENCE) > 0) {
                  mapContainer.filters = [effects.crt];
                } else {
                  mapContainer.filters = [];
                }

                // if we have no target - remove the target sprite
                if (playerShip.targetId < 0) {
                    if (sprites.target) {
                        sprites.target.destroy();
                        sprites.target = null;
                    }
                }

                if (!destroyed) {

                  serverObjects[playerShip.id] = true;
                  let hullData = Hulls[playerShip.hull];
                  let useSize = UiUtils.getUseSize(settings.scale, playerShip.size * hullData.width, playerShip.size, 0.01, 16);

                  // add the player ship sprite if we haven't got it
                  if (!mapObjects[playerShip.id]) {
                      settings.playerShipId = playerShip.id;
                      let playershipSprite = this.createShipSprite(playerShip, playerShip.size * hullData.width, playerShip.size, Math.floor(pixiApp.screen.width / 2), Math.floor(pixiApp.screen.height / 2), settings.zIndex.ship, 0.01, 16);
                      this.addSpriteToMap(playershipSprite, playerShip.name, playerShip.id, true, useSize);
                  } else {
                    this.updateShipEngine(playerShip, playerShip.id, useSize);
                  }

                  // set the player ship rotation
                  mapObjects[playerShip.id].rotation = UiUtils.adjustAngle(playerShip.physicsObj.angle);

                  // draw waypoints (remember distance and direction)
                  let helmUiWaypoints = [];
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
                          waypoint.closing = 0;
                          if (waypoint.distanceToWaypoint != 0) {
                              waypoint.closing = (ourSpeed.dot(waypoint.waypointDirection) / waypoint.distanceToWaypoint);
                          }

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

                  // update the grid
                  UiUtils.updateGrid(settings, sprites, playerShip.physicsObj.position[0], playerShip.physicsObj.position[1]);

                  // update engine
                  settings.engineLevel = playerShip.engine;

                  // set the engine buttons
                  if (playerShip.engine !== undefined) {
                      uiEls.engineEl0.classList.remove('active');
                      uiEls.engineEl1.classList.remove('active');
                      uiEls.engineEl2.classList.remove('active');
                      uiEls.engineEl3.classList.remove('active');
                      uiEls.engineEl4.classList.remove('active');
                      uiEls.engineEl5.classList.remove('active');
                      uiEls['engineEl'+playerShip.engine].classList.add('active');
                  }

                  if (isDocked) {
                      uiEls.dockUndockEl.classList.remove('inactive');
                  } else {
                      uiEls.dockUndockEl.classList.add('inactive');
                  }

                  // update the UI
                  let speedV = Victor.fromArray(playerShip.physicsObj.velocity);
                  let speed = Math.abs(Math.round(speedV.length()));

                  let course = speedV.angle();
                  let bearing = (playerShip.physicsObj.angle + (0.5 * Math.PI)) % (2 * Math.PI);
                  let gravity = null;
                  let gravityPath = null;
                  let predictedGravityPath = null;
                  if (playerShip.gravityData && playerShip.gravityData.direction) {
                      gravity = Victor.fromArray([playerShip.gravityData.direction.x, playerShip.gravityData.direction.y]);
                      // let orbitV = Math.sqrt((SolarObjects.constants.G * playerShip.gravityData.mass) / gravity.length() + 1);
                      // uiEls.gravOrbitV.innerHTML = "Grav V: " +  Math.round(orbitV) + " or " + Math.round(orbitV / 3);

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

                  // build a list of UI data for display
                  let uiDataItems = [];
                  let reversedSpeedV = new Victor(playerShip.physicsObj.velocity[0], 0 - playerShip.physicsObj.velocity[1]);
                  uiDataItems.push({
                    type: 'bearing',
                    bearing: Math.round(UiUtils.radiansToDegrees((bearing - (0.5 * Math.PI)) % (2 * Math.PI))) + "°"
                  });
                  uiDataItems.push({
                    type: 'heading',
                    Heading: ((Math.round(reversedSpeedV.verticalAngleDeg()) + 360) % 360) + "°",
                    speed: Math.round(speedV.magnitude()) + SolarObjects.units.speed
                  });

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
                          angularVelocity: playerShip.physicsObj.angularVelocity,
                          bearing: bearing,
                          course: course,
                          gravity: gravity ? gravity.angle() : null,
                          zIndex: settings.zIndex.ui,
                          waypoints: helmUiWaypoints
                      });
                      mapContainer.addChild(sprites.helmUi);
                  } else {
                      sprites.helmUi.update(bearing, course, gravity ? gravity.angle() : null, helmUiWaypoints, playerShip.physicsObj.angularVelocity, path);
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
                          sprites.waypoints[waypoint.name].filters = [ effects.hudGlow ];
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

                      uiDataItems.push({
                        type: 'waypoint',
                        name: waypoint.name,
                        bearing: Math.round(UiUtils.radiansToDegrees((waypoint.bearing - (0.5 * Math.PI)) % (2 * Math.PI))) + "°",
                        distance: Math.round(waypoint.distanceToWaypoint) + SolarObjects.units.distance,
                        closing: waypoint.closing.toPrecision(3) + SolarObjects.units.speed
                      });

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
                      sprites.speedText.filters = [ effects.hudGlow ];
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
                      let closing = 0;
                      if (gravity.length() != 0) {
                          closing = ((speedV.clone().subtract(gravityHeading)).dot(gravity) / gravity.length());
                      }

                      let gravText = gravityDistanceText + SolarObjects.units.distance + "\n" +
                                     closing.toPrecision(3) + SolarObjects.units.speed;

                      uiDataItems.push({
                        type: 'gravity',
                        bearing: ((Math.round(gravity.angleDeg()) + 450) % 360) + "°",
                        distance: gravityDistanceText + SolarObjects.units.distance,
                        closing: closing.toPrecision(3) + SolarObjects.units.speed
                      });

                      if (!sprites.gravityText) {
                          sprites.gravityText = new PIXI.Text(gravText, {
                              fontFamily : 'Arial',
                              fontSize: 9,
                              fill : 0xFFFFFF,
                              align : 'center'
                          });
                          sprites.gravityText.filters = [ effects.hudGlow ];
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
                          sprites.ColorsgravityText = null;
                      }
                  }

                  // update the data
                  morphdom(uiEls.infoContainer, UiUtils.helmDataItems(uiDataItems));

                } // !destroyed

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
