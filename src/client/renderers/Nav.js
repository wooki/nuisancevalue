const PIXI = require('pixi.js');

import KeyboardControls from '../NvKeyboardControls.js';
import Assets from './Utils/images.js';
import {GlowFilter} from '@pixi/filter-glow';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import {CRTFilter} from '@pixi/filter-crt';
import PDC from './../../common/PDC';
import Torpedo from './../../common/Torpedo';
import Ship from './../../common/Ship';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';
import Hulls from './../../common/Hulls';
import NavCom from './Utils/NavCom';
import SolarObjects from './../../common/SolarObjects';
import Victor from 'victor';
import UiUtils from './Utils/UiUtils';
import HelmPathUi from './Utils/HelmPathUi';

// import styles from './css/nav.scss';

let destroyed = false;
let backToLobby = false;
let navCom = new NavCom();
let el = null;
let uiEls = {};
let game = null;
let client = null;
let settings = {
    GridDefault: 50000,
    baseUrl: '/',
    mapSize: 500000, // this is set in setSizes
    zoom: 3, // 0-9, index for zoomLevels
    zoomLevels: [4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03123, 0.015625, 0.0078125],
    focus: [0, 0],
    loadedSprites: false,
    gridSize: 50000, // this is set in setSizes
    minimumScale: 0.001,
    minimumSpriteSize: 8,
    waypointSize: 16,
    zIndex: {
      background: 1,
      grid: 2,
      paths: 2,
      asteroid: 10,
      planet: 11,
      ship: 50,
      waypoints: 60,
      dashboard: 100,
      ui: 101
    },
    predictTime: 360
};
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
let aliases = {}; // keep track of everything added to map using easier address
let commandBuffer = [];
let commandBufferIndex = 0;
let scaleChange = false;

export default class NavRenderer {

    // create a PIXI app and add to the #game element, start load of resources
    constructor(gameEngine, clientEngine) {
        game = gameEngine;
        client = clientEngine;
        this.navComSavedData = null;

        let root = document.getElementById('game');
        root.innerHTML = '';
        el = document.createElement('div');
        root.append(el);

        // work out some sizes for UI - populates settings var
        this.setSizes();

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
        pixiApp.stage.addChild(pixiContainer);
        mapContainer = new PIXI.Container();
        mapContainer.interactive = true;
        mapContainer.on('mousedown', this.canvasClick);
        mapContainer.on('touchstart', this.canvasClick);
        // mapContainer.filters = [effects.crt];

        mapContainer.sortableChildren = true;
        mapContainer.zIndex = 1;
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
      let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                           obj.physicsObj.position[1],
           settings.focus[0],
           settings.focus[1],
           pixiApp.screen.width,
           pixiApp.screen.height,
           0,
           settings.scale);

      let useSize = UiUtils.getUseSize(settings.scale, obj.size, obj.size, settings.minimumScale, settings.minimumSpriteSize);
      UiUtils.addExplosion(settings.resources[settings.baseUrl+Assets.Images.explosion].spritesheet,
        mapContainer,
        useSize.useWidth, useSize.useHeight,
        coord.x, coord.y, settings.zIndex.explosion);
    }

    destroyed() {
      if (destroyed) return;
      destroyed = true;

      // remove some stuff
      if (mapObjects[settings.playerShipId]) {
          UiUtils.removeFromMap(mapObjects, sprites, settings.playerShipId);
      }

      let root = document.getElementById('game');
      UiUtils.leaveTimer("YOU WERE DESTROYED", root).then(function() {
        backToLobby = true;
      });
    }

    canvasClick(event) {

        event.stopPropagation();

        let pos = event.data.getLocalPosition(mapContainer);
        var input = document.getElementById("consoleInput");

        // reverse the pos coords into game space from screen space
        // scale, focus, centre-screen
        let v = new Victor(pos.x, pos.y);
        let scale = new Victor(settings.scale, settings.scale);
        let focus = Victor.fromArray(settings.focus);
        let screen = new Victor(pixiApp.screen.width / 2, pixiApp.screen.height / 2);

        v = v.subtract(screen);
        v = v.divide(scale);
        v = focus.add(v);

        let currentVal = input.value;
        if (!currentVal.endsWith(' ')) {
            currentVal = currentVal + ' ';
        }
        currentVal = currentVal + Math.round(v.x) + "," + Math.round(v.y);
        this.navComSavedData = Math.round(v.x) + "," + Math.round(v.y);
        input.value = currentVal;
    }

    addWaypoint(name, x, y) {
        client.addWaypoint(name, x, y);
    }

    removeWaypoint(name) {
        client.removeWaypoint(name);
    }

    consoleInput(event) {
        let input = document.getElementById("consoleInput");

        if (event.keyCode == 38 || event.code == 'ArrowUp') { // up
            commandBufferIndex = commandBufferIndex + 1;
            if (commandBufferIndex > commandBuffer.length) {
                commandBufferIndex = commandBuffer.length;
            } else {
                input.value = commandBuffer[commandBufferIndex - 1];
            }

        } else if (event.keyCode == 40 || event.code == 'ArrowDown') { // down
            commandBufferIndex = commandBufferIndex - 1;
            if (commandBufferIndex < 1) {
                commandBufferIndex = 0;
                input.value = '';
            } else {
                input.value = commandBuffer[commandBufferIndex - 1];
            }

        } else if (event.keyCode == 27 || event.code == 'Escape') { // escape
            input.value = '';

        } else if (event.keyCode == 13 || event.code == 'Enter') { // enter
            let log = document.getElementById("console");
            let val = input.value;
            commandBuffer.unshift(val);
            commandBufferIndex = 0;
            if (commandBuffer.length > 30) {
                commandBuffer.pop();
            }
            input.value = '';

            let result = navCom.parse(val, this.navComSavedData);
            log.innerHTML = log.innerHTML + "\nNAV:COM$ " + val + (result.error ? "\n" + result.error : '');

            if (!result.error) {

                if (result.execute) {
                    result.execute(log, aliases, settings, this, game);
                    console.log("navComSavedData:"+this.navComSavedData);
                }
            }
        }
    }

    // draw some controls
    drawUi(container) {
        let uiContainer = document.createElement("div");
        uiContainer.classList.add('ui-container');
        uiContainer.classList.add('nav');
        container.appendChild(uiContainer);

        uiEls.consoleInputDiv = document.createElement("div");
        uiEls.consoleInputDiv.classList.add('console-input-container');
        uiContainer.appendChild(uiEls.consoleInputDiv);

        uiEls.consoleInput = document.createElement("div");
        uiEls.consoleInput.classList.add('console-input-prefix');
        uiEls.consoleInput.innerHTML = 'NAV:COM$ ';
        uiEls.consoleInputDiv.appendChild(uiEls.consoleInput);

        uiEls.consoleInput = document.createElement("input");
        uiEls.consoleInput.id = 'consoleInput';
        uiEls.consoleInput.classList.add('console-input');
        uiEls.consoleInput.addEventListener('keydown', (e) => { this.consoleInput(e); });
        uiEls.consoleInputDiv.appendChild(uiEls.consoleInput);
        uiEls.consoleInput.focus();

        uiEls.console = document.createElement("pre");
        uiEls.console.id = 'console';
        window.addEventListener('click', (e) => {
            var input = document.getElementById("consoleInput");
            input.focus();
        } );
        uiEls.console.classList.add('console');
        uiEls.console.innerHTML = navCom.help();
        uiContainer.appendChild(uiEls.console);
    }

    // read window sizes and set scale etc.
    setSizes() {

        settings.UiWidth = window.innerWidth;
        settings.UiHeight = window.innerHeight;
        settings.narrowUi = settings.UiHeight; // assume landscape!

        // decide how much "game space" is represented by the narrowUI dimension
        let zoomedMapSize = settings.mapSize * settings.zoomLevels[settings.zoom];
        settings.scale = (settings.narrowUi / zoomedMapSize);
        scaleChange = true;

        // grid is always 1000 but scaled
        settings.gridSize = Math.floor(settings.GridDefault * settings.scale);
    }

    // clicked an object, do some stuff...
    objectClick(guid, eventData) {

        eventData.stopPropagation();

        var input = document.getElementById("consoleInput");
        let obj = game.world.queryObject({ id: parseInt(guid) });

        let currentVal = input.value;
        if (!currentVal.endsWith(' ')) {
            currentVal = currentVal + ' ';
            currentVal = currentVal + Math.round(obj.physicsObj.position[0]) + "," + Math.round(obj.physicsObj.position[1]);
        }
        this.navComSavedData = Math.round(obj.physicsObj.position[0]) + "," + Math.round(obj.physicsObj.position[1]);
        input.value = currentVal;

    }

    addToMap(name, guid, texture, width, height, x, y, angle, zIndex, minimumScale, minimumSize) {

        // give anything added to the map an alias
        let alias = name;
        if (aliases[alias]) {
            alias = name + guid;
        }
        aliases[alias] = guid; // alias just keeps actual guid

        let useSize = UiUtils.getUseSize(settings.scale, width, height, minimumScale, minimumSize);

        sprites[guid] = new PIXI.Sprite(texture);
        // sprites[guid].filters = [ effects.hudGlow ];
        if (guid.toString().startsWith('waypoint-')) {
            // sprites[guid].filters = [ effects.waypointColor, effects.hudGlow ];
            sprites[guid].filters = [ effects.waypointColor ];
        }
        sprites[guid].width = useSize.useWidth;
        sprites[guid].height = useSize.useHeight;
        sprites[guid].anchor.set(0.5);
        sprites[guid].x = x;
        sprites[guid].y = y;
        sprites[guid].rotation = angle;
        sprites[guid].zIndex = zIndex;
        sprites[guid].interactive = true;
        sprites[guid].on('mousedown', (e) => { this.objectClick(guid, e) });
        sprites[guid].on('touchstart', (e) => { this.objectClick(guid, e) });

        mapObjects[guid] = sprites[guid];
        mapContainer.addChild(sprites[guid]);

        sprites[guid+'-label'] = new PIXI.Text(alias, {fontFamily : 'Arial', fontSize: 12, fill : 0xFFFFFF, align : 'center'});
        sprites[guid+'-label'].filters = [ effects.hudGlow ];
        sprites[guid+'-label'].anchor.set(0, 0.5);
        sprites[guid+'-label'].x = x + (3 + Math.floor(useSize.useWidth));
        sprites[guid+'-label'].y = y - (3 + Math.floor(useSize.useHeight));
        // sprites[guid+'-label'].pivot = new PIXI.Point(0, (Math.floor(settings.narrowUi / 2) - 16));
        sprites[guid+'-label'].rotation = (-0.25 * Math.PI);
        sprites[guid+'-label'].zIndex = settings.zIndex.ui;

        mapObjects[guid+'-label'] = sprites[guid+'-label'];
        mapContainer.addChild(sprites[guid+'-label']);

        mapContainer.sortChildren();
        return sprites[guid];
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
        let smallGridDivisions = 0
        settings.smallGridDimenion = null;
        if (settings.gridSize >= 800) {
          smallGridDivisions = 10;
          settings.smallGridDimenion = settings.GridDefault / 10;
        }
        if (settings.gridSize >= 1800) {
          smallGridDivisions = 50;
          settings.smallGridDimenion = settings.GridDefault / 50;
        }

        // draw grid depending on sizes
        if (smallGridDivisions > 0) {

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
        }

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

        // set the grid to the 0,0 point at the start
        UiUtils.updateGrid(settings, sprites, settings.focus[0], settings.focus[1]);

        pixiApp.stage.sortChildren();
    }

    updateGrid() {
        UiUtils.updateGrid(settings, sprites, settings.focus[0], settings.focus[1]);
    }

    // convert an array of points
    relativeScreenCoords(points, focusX, focusY, screenWidth, screenHeight, angle, scale) {
        let convertedPoints = [];
        if (points) {
            points.forEach(function(p) {
                let x = p.x;
                let y = p.y;
                if (x === undefined) { x = p[0]; }
                if (y === undefined) { y = p[1]; }

                convertedPoints.push(this.relativeScreenCoord(x, y, focusX, focusY, screenWidth, screenHeight, angle, scale));

            }.bind(this));
        }
        return convertedPoints;
    }

    // convert a game coord to the coord on screen ie. relative to the focus point
    relativeScreenCoord(x, y, focusX, focusY, screenWidth, screenHeight, angle, scale) {

        let screenX = Math.floor(screenWidth / 2);
        let screenY = Math.floor(screenHeight / 2);

        let matrix = new PIXI.Matrix();
        matrix.translate(x, y);
        matrix.translate(0 - focusX, 0 - focusY);
        matrix.scale(scale, scale);
        matrix.rotate(angle);
        matrix.translate(screenX, screenY);
        let p = new PIXI.Point(0, 0);
        p = matrix.apply(p);

        return p;
    }

    drawWaypoint(wp) {

        let gameObjects = {};

        let waypointTexture = settings.resources[settings.baseUrl+Assets.Images.waypoint].texture;
        let waypointParams = wp.split(',');
        let waypoint = {
            name: waypointParams[0],
            x: parseInt(waypointParams[1]),
            y: parseInt(waypointParams[2])
        }
        gameObjects["waypoint-"+waypoint.name] = true;
        gameObjects["waypoint-"+waypoint.name+'-label'] = true;

        let coord = this.relativeScreenCoord(waypoint.x,
             waypoint.y,
             settings.focus[0],
             settings.focus[1],
             pixiApp.screen.width,
             pixiApp.screen.height,
             0,
             settings.scale);

        if (!mapObjects["waypoint-"+waypoint.name]) {

            this.addToMap(waypoint.name,
                          "waypoint-"+waypoint.name,
                          waypointTexture,
                          settings.waypointSize, settings.waypointSize,
                          coord.x, coord.y,
                          0,
                          settings.zIndex.waypoints, 1, settings.waypointSize)
        } else {
            // update position
            mapObjects["waypoint-"+waypoint.name].x = coord.x;
            mapObjects["waypoint-"+waypoint.name].y = coord.y;
            if (mapObjects["waypoint-"+waypoint.name + '-label'] && mapObjects["waypoint-"+waypoint.name]) {

                mapObjects["waypoint-"+waypoint.name + '-label'].x = coord.x + (3 + Math.floor(mapObjects["waypoint-"+waypoint.name].width/2));
                mapObjects["waypoint-"+waypoint.name + '-label'].y = coord.y - (3 + Math.floor(mapObjects["waypoint-"+waypoint.name].height/2));
            }
        }

        return gameObjects;
    }

    // update grid to reflect current position and
    // create/update/delete PIXI objects to match the world
    draw(t, dt) {

        if (settings.loadedSprites) {

            let playerShip = null;
            let gameObjects = {};
            let isDocked = false;
            let predictedPaths = [];
            game.world.forEachObject((objId, obj) => {

                // remember all objects in this loop (to remove old objects later)
                gameObjects[objId] = true;
                gameObjects[objId+'-label'] = true;

                // keep track of the player object
                let isPlayer = false;
                let alias = obj.id;
                let predictThisPath = false;
                if (obj instanceof Ship && obj.navPlayerId == game.playerId) {
                    playerShip = obj;
                    isPlayer = true;
                    predictThisPath = true;

                    // hard-code alias for self
                    aliases['self'] = obj.id;
                    aliases['me'] = obj.id;
                } else if (obj instanceof Ship && obj.docked && obj.docked.length > 0) {
                  // check docked if we haven't found yet
                  let dockedMatch = obj.docked.find(function(dockedShip) {
                    return (dockedShip.navPlayerId == game.playerId);
                  });
                  if (dockedMatch) {
                    isDocked = true;
                    playerShip = obj;
                    predictThisPath = true;

                    // hard-code alias for self
                    aliases['self'] = obj.id;
                    aliases['me'] = obj.id;
                  }
                }

                let ignore = false;
                let texture = null;
                let zIndex = settings.zIndex.asteroid;
                let widthRatio = 1;
                let predictColor = Assets.Colors.ForTexture[obj.texture];
                if (obj instanceof Ship) {
                    let hullData = Hulls[obj.hull];
                    texture = settings.resources[settings.baseUrl+hullData.image].texture;
                    zIndex = settings.zIndex.ship;
                    alias = obj.hull;
                    widthRatio = hullData.width;

                    if (isPlayer) {
                      predictColor = 0x00FF00;
                    }
                    // draw waypoints
                    if (isPlayer && obj.waypoints) {

                        obj.waypoints.forEach((wp) => {
                            let waypointObjects = this.drawWaypoint(wp);
                            gameObjects = Object.assign(gameObjects, waypointObjects);
                        });
                    }

                  } else if (obj instanceof Torpedo || obj instanceof PDC) {
                    ignore = true;
                  } else if (obj instanceof Asteroid) {
                      texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
                    zIndex = settings.zIndex.asteroid;
                    alias = 'asteroid';

                } else if (obj instanceof Planet) {
                    texture = settings.resources[settings.baseUrl+Assets.Images[obj.texture]].texture;
                    zIndex = settings.zIndex.planet;
                    alias = obj.texture;
                    predictThisPath = true;
                }
                if (predictColor === undefined) {
                  predictColor = Assets.Colors.GridSmall;
                }

                if (isPlayer) {
                    alias = obj.name;
                }

                if (!ignore) {
                  let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                                       obj.physicsObj.position[1],
                                                       settings.focus[0],
                                                       settings.focus[1],
                                                       pixiApp.screen.width,
                                                       pixiApp.screen.height,
                                                       0, // obj.physicsObj.angle, // might need to add Math.PI
                                                       settings.scale);

                  let angle = UiUtils.adjustAngle(obj.physicsObj.angle);

                  if (!mapObjects[obj.id]) {
                      this.addToMap(alias,
                                    obj.id,
                                    texture,
                                    obj.size * widthRatio, obj.size,
                                    coord.x, coord.y,
                                    angle,
                                    zIndex, settings.minimumScale, settings.minimumSpriteSize)
                  } else {
                      // update position & scale
                      mapObjects[obj.id].x = coord.x;
                      mapObjects[obj.id].y = coord.y;
                      let angle = UiUtils.adjustAngle(obj.physicsObj.angle);
                      mapObjects[obj.id].rotation = angle;
                      if (scaleChange) {
                          let useSize = UiUtils.getUseSize(settings.scale, obj.size, obj.size, settings.minimumScale, settings.minimumSpriteSize);
                          mapObjects[obj.id].width = useSize.useWidth;
                          mapObjects[obj.id].height = useSize.useHeight;
                      }

                      if (mapObjects[obj.id + '-label'] && mapObjects[obj.id]) {
                          gameObjects[obj.id + '-label'] = true;

                          mapObjects[obj.id + '-label'].x = coord.x + (3 + Math.floor(mapObjects[obj.id].width/2));
                          mapObjects[obj.id + '-label'].y = coord.y - (3 + Math.floor(mapObjects[obj.id].height/2));
                      }
                  }
                }

                // predict the path for this object
                if (predictThisPath) {
                    let predictedPath = UiUtils.predictPath(obj, settings.predictTime, 1);

                    // adjust the path to be relative to the gravity source
                    if (obj.gravityData) {

                      let predictedGravityPath = UiUtils.predictPath({
                          physicsObj: {
                              position: obj.gravityData.source,
                              velocity: obj.gravityData.velocity,
                              mass: obj.gravityData.mass
                          }
                      }, settings.predictTime, 1);

                      let gravitySourcePosition = Victor.fromArray(obj.gravityData.source);
                      for (let pathIndex = 0; pathIndex < predictedPath.length; pathIndex++) {
                        // subtract the difference from the grav objects current position from position at same step
                        let gravitySourceDelta = predictedGravityPath[pathIndex].clone().subtract(gravitySourcePosition);
                        predictedPath[pathIndex] = predictedPath[pathIndex].clone().subtract(gravitySourceDelta);
                      }
                    }

                    let path = this.relativeScreenCoords(predictedPath,
                                                     settings.focus[0],
                                                     settings.focus[1],
                                                     pixiApp.screen.width,
                                                     pixiApp.screen.height,
                                                     0, // obj.physicsObj.angle, // might need to add Math.PI
                                                     settings.scale);
                    predictedPaths.push({
                      color1: predictColor,
                      color2: predictColor,
                      points: path,
                    });
                }


            });

            // spot any objects we no longer have and remove them
            Object.keys(mapObjects).forEach((key) => {
                if (!gameObjects[key]) {
                    UiUtils.removeFromMap(mapObjects, sprites, key);
                    Object.keys(aliases).forEach(function(k) {
                      if (key == aliases[k]) {
                        delete aliases[k];
                      }
                    });
                }
            });

            // predict a path for x seconds into the future
            // draw predicted paths
            if (!sprites.helmPathUi) {
                sprites.helmPathUi = new HelmPathUi({
                    uiSize: settings.narrowUi,
                    uiWidth: settings.UiWidth,
                    uiHeight: settings.UiHeight,
                    scale: settings.scale,
                    zIndex: settings.zIndex.paths,
                    paths: predictedPaths,
                    alpha: 0.5
                });
                mapContainer.addChild(sprites.helmPathUi);
            } else {
                sprites.helmPathUi.update(predictedPaths);
            }

            if (!playerShip) {
              // must have been destroyed, keep original ship but flag as such
              this.destroyed();
            }

        } // settings.loadedSprites

        mapContainer.sortChildren();
        scaleChange = false;
        return backToLobby;
    } // draw

}
