import KeyboardControls from '../NvKeyboardControls.js';
const PIXI = require('pixi.js');
const Assets = require('./images.js');
import {GlowFilter} from '@pixi/filter-glow';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import {BevelFilter} from '@pixi/filter-bevel';

import Ship from './../../common/Ship';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';
import Hulls from './../../common/Hulls';
import Victor from 'victor';
import HelmUi from './Utils/HelmUi';
import Comms from './../../common/Comms';
import SolarObjects from './../../common/SolarObjects';
// import {CRTFilter} from '@pixi/filter-crt';

let el = null;
let uiEls = {};
let game = null;
let client = null;
let settings = {
    baseUrl: '/',
    mapSize: 12000, // this is set in setSizes
    loadedSprites: false,
    gridSize: 10000, // this is set in setSizes
    waypointTexture: null,
    minimumScale: 0.001,
    minimumSpriteSize: 8,
    zIndex: {
        grid: 1,
        asteroid: 10,
        planet: 11,
        ship: 50,
        waypoints: 60,
        dashboard: 100,
        ui: 101
    }
};
let pixiApp = null;
let pixiContainer = null;
let mapContainer = null;
let sprites = {};
let mapObjects = {}; // keep track of what we have added
let effects = {
    hudGlow: new GlowFilter(3, 5, 0, 0x000000, 0.5),
    waypointColor: new ColorReplaceFilter([0, 0, 0], [1, 1, 0], 0.1),
    selectionColor: new ColorReplaceFilter([0, 0, 0], [0, 1, 0], 0.1),
    bevel: new BevelFilter({lightAlpha: 0.1, shadowAlpha: 0.9})
};
let selectedObjId = null;

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
        this.setSizes();

        // create pixie app and container
        pixiApp = new PIXI.Application({
            width: settings.UiWidth,
            height: settings.UiHeight,
            backgroundColor: Assets.Colors.Black,
            resolution: window.devicePixelRatio || 1
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
        // mapContainer.filters = [new CRTFilter({ // doesn't really work with black background
        //     lineWidth: 10,
        //     lineContrast: 0.75
        // })];
        pixiApp.stage.addChild(pixiContainer);
        pixiApp.stage.addChild(mapContainer);
        el.append(pixiApp.view); // add to the page

        // prepare to load resources
        const loader = PIXI.Loader.shared;

        // load sprites
        pixiApp.loader.add(settings.baseUrl+Assets.Images.asteroid);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.sol);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.earth);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.mars);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.jupiter);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.explosion);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.dashboard);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.waypoint);

        // load sprites for all hulls
        for (let [hullKey, hullData] of Object.entries(Hulls)) {
            pixiApp.loader.add(settings.baseUrl+hullData.image);
        }

        // manage loading of resources
        pixiApp.loader.load(this.loadResources.bind(this));

        // add ui might as well use html for the stuff it's good at
        this.drawUi(root);
    }

    canvasClick(event) {

        event.stopPropagation();

        // unselect selection
        selectedObjId = null;
        this.removeCommsUi();
    }

    // draw some controls
    drawUi(container) {
        uiEls.uiContainer = document.createElement("div");
        uiEls.uiContainer.classList.add('ui-container');
        uiEls.uiContainer.classList.add('signals');
        container.appendChild(uiEls.uiContainer);

        // torps

        // counter-measures / decoys

    }

    createButton(document, container, id, innerHTML, onClick) {

        let button = document.createElement("button");
        button.id = id;
        button.classList.add('button');
        button.innerHTML = innerHTML;
        button.addEventListener('click', onClick);
        container.appendChild(button);
        return button;
    }

    createLabel(document, container, id, innerHTML) {

        let label = document.createElement("label");
        label.id = id;
        label.classList.add('label');
        label.innerHTML = innerHTML;
        container.appendChild(label);
        return label;
    }

    // read window sizes and set scale etc.
    setSizes() {

        // get the smaller of the two dimensions, work to that
        // size for the map etc. so we can draw a circle
        settings.UiWidth = window.innerWidth;
        settings.UiHeight = window.innerHeight;
        settings.narrowUi = window.innerWidth;
        if (settings.UiHeight < settings.narrowUi) {
            settings.narrowUi = settings.UiHeight;
        }

        // decide how much "game space" is represented by the narrowUI dimension
        settings.scale = (settings.narrowUi / settings.mapSize);

        // grid is always 10000 but scaled
        settings.gridSize = Math.floor(10000 * settings.scale);
    }

    // clicked an object, do some stuff...
    objectClick(guid, eventData) {

        eventData.stopPropagation();

        let selectedGuid = parseInt(guid);
        let obj = game.world.queryObject({ id: selectedGuid });
        if (obj && obj.signalsPlayerId != game.playerId) {

            if (selectedObjId != selectedGuid) {
                this.removeCommsUi();
                selectedObjId = selectedGuid; // keep reference
                this.createInitialCommsUi(obj);
            }
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

    createInitialCommsUi(obj) {

        // container
        uiEls.uiComms = document.createElement("div");
        uiEls.uiComms.classList.add('ui-comms');
        uiEls.uiContainer.appendChild(uiEls.uiComms);

        let objects = this.getPlayerAndSelected();
        if (objects) {

            // open comms button
            uiEls.uiCommsOpen = this.createButton(document, uiEls.uiComms, "openComms", "Open Comms", this.openComms.bind(this));
        }

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

    getPlayerAndSelected() {
        if (selectedObjId) {

            let selectedObj = game.world.queryObject({ id: selectedObjId });
            if (selectedObj && selectedObj.commsScript !== undefined) {

                let playerShip = null;
                game.world.forEachObject((objId, obj) => {
                    if (obj instanceof Ship && obj.playable == 1) {
                        if (obj.signalsPlayerId == game.playerId) {
                            playerShip = obj;
                        }
                    }
                });

                if (playerShip) {
                    return {
                        selectedObj: selectedObj,
                        playerShip: playerShip
                    }
                }
            }
        }
        return false;
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

        }  // !selectedObjId
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



    getUseSize(width, height, minimumScale, minimumSize) {

        let useScale = settings.scale;
        if (useScale < minimumScale) {
            useScale = minimumScale;
        }

        let useWidth = Math.floor(width * useScale);
        let useHeight = Math.floor(height * useScale);
        if (useWidth < minimumSize) { useWidth = minimumSize; }
        if (useHeight < minimumSize) { useHeight = minimumSize; }

        return {
            useWidth: useWidth,
            useHeight: useHeight
        };
    }

    addToMap(alias, guid, texture, width, height, x, y, zIndex, minimumScale, minimumSize, addLabel) {

        let useSize = this.getUseSize(width, height, minimumScale, minimumSize);

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
        sprites[guid].interactive = true;
        sprites[guid].on('mousedown', (e) => { this.objectClick(guid, e) });
        sprites[guid].on('touchstart', (e) => { this.objectClick(guid, e) });

        mapObjects[guid] = sprites[guid];
        mapContainer.addChild(sprites[guid]);

        if (addLabel) {
            sprites[guid+'-label'] = new PIXI.Text(alias, {fontFamily : 'Arial', fontSize: 12, fill : 0xFFFFFF, align : 'center'});
            sprites[guid+'-label'].filters = [ effects.hudGlow ];
            sprites[guid+'-label'].anchor.set(0, 0.5);
            sprites[guid+'-label'].x = x + (3 + Math.floor(useSize.useWidth));
            sprites[guid+'-label'].y = y - (3 + Math.floor(useSize.useHeight));
            sprites[guid+'-label'].rotation = (-0.25 * Math.PI);
            sprites[guid+'-label'].zIndex = settings.zIndex.ui;

            mapObjects[guid+'-label'] = sprites[guid+'-label'];
            mapContainer.addChild(sprites[guid+'-label']);
        }

        mapContainer.sortChildren();
        return sprites[guid];
    }

    removeFromMap(guid) {
        if (mapObjects[guid]) {
            mapObjects[guid].destroy();
            mapObjects[guid] = null;
            sprites[guid] = null;
        }
    }

    createGrid() {

        // remove old one
        if (sprites.gridSprite) {
            mapContainer.removeChild(sprites.gridSprite);
            sprites.gridSprite.destroy(true);
            sprites.gridSprite = null;
        }

        // create a texture for the grid background
        let gridGraphics = new PIXI.Graphics();
        // once the grid is large draw extra lines
        if (settings.gridSize >= 500) {

            let smallGridSize = Math.round(settings.gridSize/5);

            gridGraphics.lineStyle(1, Assets.Colors.GridSmall);
            gridGraphics.moveTo(smallGridSize, 1); gridGraphics.lineTo(smallGridSize, settings.gridSize - 1);
            gridGraphics.moveTo(smallGridSize*2, 1); gridGraphics.lineTo(smallGridSize*2, settings.gridSize - 1);
            gridGraphics.moveTo(smallGridSize*3, 1); gridGraphics.lineTo(smallGridSize*3, settings.gridSize - 1);
            gridGraphics.moveTo(settings.gridSize - smallGridSize, 1); gridGraphics.lineTo(settings.gridSize - smallGridSize, settings.gridSize - 1);

            gridGraphics.moveTo(1, smallGridSize); gridGraphics.lineTo(settings.gridSize - 1, smallGridSize);
            gridGraphics.moveTo(1, smallGridSize*2); gridGraphics.lineTo(settings.gridSize - 1, smallGridSize*2);
            gridGraphics.moveTo(1, smallGridSize*3); gridGraphics.lineTo(settings.gridSize - 1, smallGridSize*3);
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

    // update includes scaling of offset, so nothing else should scale (except size) of player ship
    // additional objects position will need to be scaled (player ship is always centre)
    updateGrid(x, y) {

        if (sprites.gridSprite) {
            let positionChange = new PIXI.Point(x * settings.scale, y * settings.scale);
            sprites.gridSprite.tilePosition.x = Math.floor(settings.UiWidth / 2) - (positionChange.x);
            sprites.gridSprite.tilePosition.y = Math.floor(settings.UiHeight / 2) - (positionChange.y);
        }
    }

    // because y axis is flipped, all rotations are 180 off
    adjustAngle(angle) {
        return (angle + Math.PI) % (2 * Math.PI);
    }

    // convert a game coord to the coord on screen ie. relative to the player ship in the centre
    relativeScreenCoord(x, y, focusX, focusY, screenWidth, screenHeight, angle, scale) {

        let screenX = Math.floor(screenWidth / 2);
        let screenY = Math.floor(screenHeight / 2);

        let matrix = new PIXI.Matrix();
        matrix.translate(x, y);
        matrix.translate(0 - focusX, 0 - focusY);
        matrix.scale(scale, scale);
        // matrix.rotate(angle);
        matrix.translate(screenX, screenY);
        let p = new PIXI.Point(0, 0);
        p = matrix.apply(p);

        return p;
    }

    drawObjects(gameObjects, playerShip, t, dt) {

        // keep track of and return ids of stuff we have
        let drawnObjects = {};

        // if we have no selection - remove the selection sprite
        if (selectedObjId == null) {
            if (sprites.selection) {
                sprites.selection.destroy();
                sprites.selection = null;
            }
        }

        gameObjects.forEach((obj) => {

            drawnObjects[obj.id] = true;
            drawnObjects[obj.id + '-label'] = true;

            let alias = obj.id;
            let texture = null;
            let zIndex = settings.zIndex.asteroid;
            let widthRatio = 1;
            let labelObj = false;
            if (obj instanceof Asteroid) {
                texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
                alias = 'asteroid';
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
            }

            let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                                 obj.physicsObj.position[1],
                                                 playerShip.physicsObj.position[0],
                                                 playerShip.physicsObj.position[1],
                                                 pixiApp.screen.width,
                                                 pixiApp.screen.height,
                                                 playerShip.physicsObj.angle,
                                                 settings.scale);

            if (!mapObjects[obj.id]) {
                this.addToMap(alias,
                              obj.id,
                              texture,
                              obj.size * widthRatio, obj.size,
                              coord.x, coord.y,
                              zIndex, 0.05, 0, labelObj)
            } else {
                // update position
                mapObjects[obj.id].x = coord.x;
                mapObjects[obj.id].y = coord.y;
                mapObjects[obj.id].rotation = obj.physicsObj.angle;
                if (mapObjects[obj.id + '-label'] && mapObjects[obj.id]) {
                    mapObjects[obj.id + '-label'].x = coord.x + (3 + Math.floor(mapObjects[obj.id].width/2));
                    mapObjects[obj.id + '-label'].y = coord.y - (3 + Math.floor(mapObjects[obj.id].height/2));
                }
            }

            // if selected then highlight somehow
            if (selectedObjId == obj.id) {
                // let useSize = this.getUseSize(obj.size + 4, obj.size + 4, 0.05, 16);

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
                    sprites.selection.filters = [ effects.selectionColor, effects.hudGlow ];
                    mapContainer.addChild(sprites.selection);
                }
            }

        });

        return drawnObjects;
    }

    drawWaypoint(waypoint, playerShip) {

        let coord = this.relativeScreenCoord(waypoint.x,
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

            if (playerShip) {

                serverObjects[playerShip.id] = true;

                // add the player ship sprite if we haven't got it
                if (!mapObjects[playerShip.id]) {
                    settings.playerShipId = playerShip.id;
                    let hullData = Hulls[playerShip.hull];
                    this.addToMap(playerShip.name,
                                  playerShip.id,
                                  settings.resources[settings.baseUrl+hullData.image].texture,
                                  playerShip.size * hullData.width, playerShip.size ,
                                  Math.floor(pixiApp.screen.width / 2), Math.floor(pixiApp.screen.height / 2),
                                  settings.zIndex.ship, 0.01, 16, false)
                }

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

                // update the grid
                this.updateGrid(playerShip.physicsObj.position[0], playerShip.physicsObj.position[1]);

                // set the player ship rotation
                mapObjects[playerShip.id].rotation = this.adjustAngle(playerShip.physicsObj.angle);

                // update engine
                settings.engineLevel = playerShip.engine;

                // // set the engine buttons
                // if (playerShip.engine !== undefined) {
                //     uiEls.engineEl0.classList.remove('active');
                //     uiEls.engineEl1.classList.remove('active');
                //     uiEls.engineEl2.classList.remove('active');
                //     uiEls.engineEl3.classList.remove('active');
                //     uiEls.engineEl4.classList.remove('active');
                //     uiEls.engineEl5.classList.remove('active');
                //     uiEls['engineEl'+playerShip.engine].classList.add('active');
                // }

                // update the UI
                let speedV = Victor.fromArray(playerShip.physicsObj.velocity);
                let speed = Math.abs(Math.round(speedV.length()));

                let course = Victor.fromArray(playerShip.physicsObj.velocity).angle();
                let bearing = (playerShip.physicsObj.angle + (0.5 * Math.PI)) % (2 * Math.PI);
                let gravity = null;
                if (playerShip.gravityData && playerShip.gravityData.direction) {
                    gravity = Victor.fromArray([playerShip.gravityData.direction.x, playerShip.gravityData.direction.y]);
                    // let orbitV = Math.sqrt((SolarObjects.constants.G * playerShip.gravityData.mass) / gravity.length() + 1);
                    // uiEls.gravOrbitV.innerHTML = "Grav V: " +  Math.round(orbitV) + " or " + Math.round(orbitV / 3);
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
                        sprites.gravityText = null;
                    }
                }

                // draw stuff on the map
                let drawnObjects = this.drawObjects(gameObjects, playerShip, t, dt);
                serverObjects = Object.assign(serverObjects, drawnObjects);

                // remove any objects that we no-longer have
                Object.keys(mapObjects).forEach((key) => {
                    if (!serverObjects[key]) {
                        this.removeFromMap(key);
                    }
                });


            } else if (settings.playerShipId) {
                if (mapObjects[settings.playerShipId]) {
                    this.removeFromMap(settings.playerShipId);
                }
            }
        }
    }

}