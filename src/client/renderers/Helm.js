import KeyboardControls from '../NvKeyboardControls.js';
const PIXI = require('pixi.js');
const Assets = require('./images.js');

import Ship from './../../common/Ship';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';
import Victor from 'victor';
import HelmUi from './Utils/HelmUi';

let el = null;
let uiEls = {};
let game = null;
let client = null;
let settings = {
    baseUrl: '/',
    mapSize: 4000,
    loadedSprites: false,
    gridSize: 1024,
    zIndex: {
        grid: 1,
        asteroid: 10,
        planet: 11,
        ship: 50,
        dashboard: 100,
        ui: 101
    }
};
let pixiApp = null;
let pixiContainer = null;
let sprites = {};
let mapObjects = {}; // keep track of what we have added

export default class HelmRenderer {

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
        pixiApp.stage.addChild(pixiContainer);
        el.append(pixiApp.view); // add to the page

        // prepare to load resources
        const loader = PIXI.Loader.shared;

        // load sprites
        pixiApp.loader.add(settings.baseUrl+Assets.Images.starfury);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.ship);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.asteroid);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.sol);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.earth);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.explosion);

        // manage loading of resources
        pixiApp.loader.load(this.loadResources.bind(this));

        // add ui might as well use html for the stuff it's good at
        this.drawUi(root);

        this.controls = new KeyboardControls(client);
        this.controls.bindKey('0', 'engine', { }, { level: 0 });
        this.controls.bindKey('1', 'engine', { }, { level: 1 });
        this.controls.bindKey('2', 'engine', { }, { level: 2 });
        this.controls.bindKey('3', 'engine', { }, { level: 3 });
        this.controls.bindKey('4', 'engine', { }, { level: 4 });
        this.controls.bindKey('5', 'engine', { }, { level: 5 });
        this.controls.bindKey('left', 'maneuver', { }, { direction: 'l' });
        this.controls.bindKey('right', 'maneuver', { }, { direction: 'r' });
        this.controls.bindKey('up', 'maneuver', { }, { direction: 'f' });
        this.controls.bindKey('down', 'maneuver', { }, { direction: 'b' });
    }

    setEngine(level) {
        settings.engineLevel = level;
        client.setEngine(level);
    }

    setManeuver(direction) {
        client.setManeuver(direction);
    }

    // draw some controls
    drawUi(container) {
        let uiContainer = document.createElement("div");
        uiContainer.classList.add('ui-container');
        container.appendChild(uiContainer);

        uiEls.engineEl5 = this.createButton(document, uiContainer, "engineOnBtn5", "Engine Burn 5", () => { this.setEngine(5); });
        uiEls.engineEl4 = this.createButton(document, uiContainer, "engineOnBtn4", "Engine Burn 4", () => { this.setEngine(4); });
        uiEls.engineEl3 = this.createButton(document, uiContainer, "engineOnBtn3", "Engine Burn 3", () => { this.setEngine(3); });
        uiEls.engineEl2 = this.createButton(document, uiContainer, "engineOnBtn2", "Engine Burn 2", () => { this.setEngine(2); });
        uiEls.engineEl1 = this.createButton(document, uiContainer, "engineOnBtn1", "Engine Burn 1", () => { this.setEngine(1); });
        uiEls.engineEl0 = this.createButton(document, uiContainer, "engineOffBtn", "Cease Burn", () => { this.setEngine(0); });

        uiEls.speedEl = this.createLabel(document, uiContainer, "speedEl", "Speed: ?");
        // this.vectorEl = GameUtils.createLabel(document, uiContainer, uiStyles, "vectorEl", "Vector: ?");
        // this.angleEl = GameUtils.createLabel(document, uiContainer, uiStyles, "angleEl", "Angle: ?");
        // this.rotationEl = GameUtils.createLabel(document, uiContainer, uiStyles, "rotationEl", "Rotation: ?");
        // this.gravityEl = GameUtils.createLabel(document, uiContainer, uiStyles, "gravityEl", "Gravity: ?");


        let uiManeuverContainer = document.createElement("div");
        uiManeuverContainer.classList.add('maneuver');
        uiContainer.appendChild(uiManeuverContainer);

        uiEls.manPortEl = this.createButton(document, uiManeuverContainer, "manPortBtn", "<", () => {
            this.setManeuver('l');
        });

        uiEls.manStarboardEl = this.createButton(document, uiManeuverContainer, "manStarboardBtn", ">", () => {
            this.setManeuver('r');
        });

        uiEls.manForwardEl = this.createButton(document, uiManeuverContainer, "manForwardBtn", "^", () => {
            this.setManeuver('f');
        });

        uiEls.manBackEl = this.createButton(document, uiManeuverContainer, "manBackBtn", "v", () => {
            this.setManeuver('b');
        });

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
        console.log("scale="+settings.scale);

        // grid is always 1000 but scaled
        settings.gridSize = Math.floor(1000 * settings.scale);
    }

    addToMap(guid, texture, width, height, x, y, zIndex, minimulScale) {

        sprites[guid] = new PIXI.Sprite(texture);
        sprites[guid].width = Math.floor(width * settings.scale);
        sprites[guid].height = Math.floor(height * settings.scale);
        sprites[guid].anchor.set(0.5);
        sprites[guid].x = x;
        sprites[guid].y = y;
        sprites[guid].zIndex = zIndex;

        mapObjects[guid] = sprites[guid];
        pixiContainer.addChild(sprites[guid]);

        return sprites[guid];
    }

    removeFromMap(guid) {
        mapObjects[guid].destroy();
        mapObjects[guid] = null;
        sprites[guid] = null;
    }

    loadResources(loader, resources) {

        settings.loadedSprites = true;
        settings.resources = resources;

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
        pixiContainer.addChild(sprites.gridSprite);
        // this.updateGrid(0, 0);

        // player ship
        // sprites.ship = new PIXI.Sprite(resources[settings.baseUrl+Assets.Images.ship].texture);
        // sprites.ship.anchor.set(0.5);
        // sprites.ship.scale.x = settings.scale; // scale the ship
        // sprites.ship.scale.y = settings.scale;
        // if (sprites.ship.scale.x < 0.2) {
        //     sprites.ship.scale.x = 0.2;
        //     sprites.ship.scale.y = 0.2;
        // }
        // sprites.ship.x = Math.floor(pixiApp.screen.width / 2);
        // sprites.ship.y = Math.floor(pixiApp.screen.height / 2);
        // sprites.ship.zIndex = settings.zIndex.ship;
        // pixiContainer.addChild(sprites.ship);

        // UI create a texture to overlay on top of the background
        let dashboardGraphics = new PIXI.Graphics();
        dashboardGraphics.beginFill(Assets.Colors.Dashboard, 1);
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

        // add ui might as well use html for the stuff it's good at
        // this.drawUi(this.body, this.stationRoot);

        // make changes to scene in tick
        // this.pixiApp.ticker.add(this.tick.bind(this));

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

        gameObjects.forEach((obj) => {

            let texture = null;
            let zIndex = settings.zIndex.asteroid;
            if (obj instanceof Asteroid) {
                texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
            } else if (obj instanceof Planet) {
                texture = settings.resources[settings.baseUrl+Assets.Images[obj.texture]].texture;
                zIndex = settings.zIndex.planet;
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
                this.addToMap(obj.id,
                              texture,
                              obj.size, obj.size,
                              coord.x, coord.y,
                              zIndex, 0.2)
            } else {
                // update position
                mapObjects[obj.id].x = coord.x;
                mapObjects[obj.id].y = coord.y;
                mapObjects[obj.id].rotation = obj.physicsObj.angle;
            }
        });
    }

    // update grid to reflect current position and
    // create/update/delete PIXI objects to match the world
    draw(t, dt) {

        if (settings.loadedSprites) {

            // find the player ship first, so we can set objects positions relative to it
            let playerShip = null;
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

            if (playerShip) {

                // add the player ship sprite if we haven't got it
                if (!mapObjects[playerShip.id]) {
                    settings.playerShipId = playerShip.id;
                    this.addToMap(playerShip.id,
                                  settings.resources[settings.baseUrl+Assets.Images[playerShip.hull]].texture,
                                  playerShip.size, playerShip.size,
                                  Math.floor(pixiApp.screen.width / 2), Math.floor(pixiApp.screen.height / 2),
                                  settings.zIndex.ship, 0.2)
                }

                // update the grid
                this.updateGrid(playerShip.physicsObj.position[0], playerShip.physicsObj.position[1]);

                // set the player ship rotation
                mapObjects[playerShip.id].rotation = this.adjustAngle(playerShip.physicsObj.angle);

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

                // update the UI
                let speedV = Victor.fromArray(playerShip.physicsObj.velocity);
                uiEls.speedEl.innerHTML = "Speed: " + Math.abs(Math.round(speedV.length()));

                let course = Victor.fromArray(playerShip.physicsObj.velocity).angle();
                // let bearing = this.adjustAngle(playerShip.physicsObj.angle);
                let bearing = playerShip.physicsObj.angle;
                let gravity = null;
                if (playerShip.gravityData.direction) {
                    gravity = Victor.fromArray([playerShip.gravityData.direction.x, playerShip.gravityData.direction.y]).angle();
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
                        zIndex: settings.zIndex.ui
                    });
                    pixiContainer.addChild(sprites.helmUi);
                } else {
                    sprites.helmUi.update(bearing, course, gravity);
                }

                // draw stuff on the map
                this.drawObjects(gameObjects, playerShip, t, dt);

            } else if (settings.playerShipId) {
                if (mapObjects[settings.playerShipId]) {
                    this.removeFromMap(settings.playerShipId);
                }
            }
        }
    }

}