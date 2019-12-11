import KeyboardControls from '../NvKeyboardControls.js';
const PIXI = require('pixi.js');
const Assets = require('./images.js');

import Ship from './../../common/Ship';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';

let el = null;
let uiEls = {};
let game = null;
let client = null;
let settings = {
    baseUrl: '/',
    mapSize: 400000,
    zoom: 0,
    zoomLevels: [1, 0.66, 0.5, 0.33, 0.2],
    focus: [0, 0],
    loadedSprites: false,
    gridSize: 50000,
    zIndex: {
        grid: 1,
        asteroid: 10,
        planet: 11,
        ship: 50,
        dashboard: 100
    }
};
let pixiApp = null;
let pixiContainer = null;
let sprites = {};
let mapObjects = {}; // keep track of what we have added

export default class NavRenderer {

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

        // this.controls = new KeyboardControls(client);
        // this.controls.bindKey('0', 'engine', { }, { level: 0 });
        // this.controls.bindKey('1', 'engine', { }, { level: 1 });
        // this.controls.bindKey('2', 'engine', { }, { level: 2 });
        // this.controls.bindKey('3', 'engine', { }, { level: 3 });
        // this.controls.bindKey('4', 'engine', { }, { level: 4 });
        // this.controls.bindKey('5', 'engine', { }, { level: 5 });
        // this.controls.bindKey('left', 'maneuver', { }, { direction: 'l' });
        // this.controls.bindKey('right', 'maneuver', { }, { direction: 'r' });
        // this.controls.bindKey('up', 'maneuver', { }, { direction: 'f' });
        // this.controls.bindKey('down', 'maneuver', { }, { direction: 'b' });
    }

    // draw some controls
    drawUi(container) {
        let uiContainer = document.createElement("div");
        uiContainer.classList.add('ui-container');
        container.appendChild(uiContainer);

        // uiEls.engineEl5 = this.createButton(document, uiContainer, "engineOnBtn5", "Engine Burn 5", () => { this.setEngine(5); });

        // uiEls.manPortEl = this.createButton(document, uiManeuverContainer, "manPortBtn", "<", () => {
        //     this.setManeuver('l');
        // });
    }

    // createButton(document, container, id, innerHTML, onClick) {

    //     let button = document.createElement("button");
    //     button.id = id;
    //     button.classList.add('button');
    //     button.innerHTML = innerHTML;
    //     button.addEventListener('click', onClick);
    //     container.appendChild(button);
    //     return button;
    // }

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
        let zoomedMapSize = settings.mapSize * settings.zoomLevels[settings.zoom];
        settings.scale = (settings.narrowUi / zoomedMapSize);

        // grid is always 1000 but scaled
        settings.gridSize = Math.floor(40000 * settings.scale);
    }

    addToMap(guid, texture, width, height, x, y, zIndex, minimulScale, minimulSize) {

        let useScale = settings.scale;
        if (useScale < minimulScale) {
            useScale = minimulScale;
        }

        let useWidth = Math.floor(width * useScale);
        let useHeight = Math.floor(height * useScale);
        if (useWidth < minimulSize) { useWidth = minimulSize; }
        if (useHeight < minimulSize) { useHeight = minimulSize; }

        sprites[guid] = new PIXI.Sprite(texture);
        sprites[guid].width = useWidth;
        sprites[guid].height = useHeight;
        sprites[guid].anchor.set(0.5);
        sprites[guid].x = x;
        sprites[guid].y = y;
        sprites[guid].zIndex = zIndex;

        console.log("addToMap:");
        console.dir(arguments);
        console.dir(sprites[guid]);

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
        sprites.gridSprite = new PIXI.TilingSprite(gridTexture, settings.gridSize, settings.gridSize);
        sprites.gridSprite.anchor.set(0.5);
        sprites.gridSprite.x = Math.floor(settings.UiWidth / 2);
        sprites.gridSprite.y = Math.floor(settings.UiHeight / 2);
        sprites.gridSprite.width = settings.UiWidth;
        sprites.gridSprite.height = settings.UiHeight;
        sprites.gridSprite.zIndex = settings.zIndex.grid;
        pixiContainer.addChild(sprites.gridSprite);

        // UI create a texture to overlay on top of the background
        // let dashboardGraphics = new PIXI.Graphics();
        // dashboardGraphics.beginFill(Assets.Colors.Dashboard, 1);
        // dashboardGraphics.drawRect(0, 0, settings.UiWidth, settings.UiHeight);
        // dashboardGraphics.endFill();
        // let dashboardTexture = pixiApp.renderer.generateTexture(dashboardGraphics);
        // sprites.dashboardSprite = new PIXI.Sprite(dashboardTexture);
        // sprites.dashboardSprite.anchor.set(0.5);
        // sprites.dashboardSprite.x = Math.floor(settings.UiWidth / 2);
        // sprites.dashboardSprite.y = Math.floor(settings.UiHeight / 2);
        // sprites.dashboardSprite.width = settings.UiWidth;
        // sprites.dashboardSprite.height = settings.UiHeight;
        // sprites.dashboardSprite.zIndex = settings.zIndex.dashboard;

        // let dashboardMaskGraphics = new PIXI.Graphics();
        // dashboardMaskGraphics.beginFill(Assets.Colors.Black, 1);
        // dashboardMaskGraphics.drawRect(0, 0, settings.UiWidth, settings.UiHeight);
        // dashboardMaskGraphics.endFill();
        // dashboardMaskGraphics.beginHole();
        // dashboardMaskGraphics.drawRect(0, 0, Math.floor(settings.narrowUi), Math.floor(settings.narrowUi));
        // dashboardMaskGraphics.endHole();
        // sprites.dashboardSprite.invertMask = true;
        // sprites.dashboardSprite.mask = dashboardMaskGraphics;
        // pixiContainer.addChild(sprites.dashboardSprite);

        // sort the z-index
        pixiContainer.sortChildren();
        pixiApp.stage.sortChildren();
    }

    // update includes scaling of offset, so nothing else should scale (except size) of player ship
    // additional objects position will need to be scaled (player ship is always centre)
    updateGrid(x, y) {

        if (sprites.gridSprite) {

            let positionChange = new PIXI.Point(x * settings.scale, y * settings.scale);
            let positionMatrix = new PIXI.Matrix();
            positionChange = positionMatrix.apply(positionChange);

            sprites.gridSprite.tilePosition.x = Math.floor(settings.UiWidth / 2) - (positionChange.x);
            sprites.gridSprite.tilePosition.y = Math.floor(settings.UiHeight / 2) - (positionChange.y);
        }
    }

    // because y axis is flipped, all rotations are 180 off
    adjustAngle(angle) {
        return (angle + Math.PI) % (2 * Math.PI);
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

    // update grid to reflect current position and
    // create/update/delete PIXI objects to match the world
    draw(t, dt) {

        if (settings.loadedSprites) {

            let playerShip = null;
            game.world.forEachObject((objId, obj) => {

                // keep track of the player object
                let isPlayer = false;
                if (obj instanceof Ship && obj.navPlayerId == game.playerId) {
                    playerShip = obj;
                    isPlayer = true;
                }

                let texture = null;
                let zIndex = settings.zIndex.asteroid;
                if (obj instanceof Ship) {
                    texture = settings.resources[settings.baseUrl+Assets.Images[obj.hull]].texture;
                    zIndex = settings.zIndex.ship;
                } if (obj instanceof Asteroid) {
                    texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
                    zIndex = settings.zIndex.asteroid;
                } else if (obj instanceof Planet) {
                    texture = settings.resources[settings.baseUrl+Assets.Images[obj.texture]].texture;
                    zIndex = settings.zIndex.planet;
                }

                let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                                     obj.physicsObj.position[1],
                                                     settings.focus[0],
                                                     settings.focus[1],
                                                     pixiApp.screen.width,
                                                     pixiApp.screen.height,
                                                     0, // obj.physicsObj.angle, // might need to add Math.PI
                                                     settings.scale);

// console.log("obj.physicsObj.position= "+obj.physicsObj.position.toString()+", coord= "+coord.toString());

                if (!mapObjects[obj.id]) {
                    this.addToMap(obj.id,
                                  texture,
                                  obj.size, obj.size,
                                  coord.x, coord.y,
                                  zIndex, 0.01, 12)
                } else {
                    // update position
                    mapObjects[obj.id].x = coord.x;
                    mapObjects[obj.id].y = coord.y;
                    let angle = obj.physicsObj.angle + this.adjustAngle(angle);
                    mapObjects[obj.id].rotation = angle;
                }
            });

        }

        pixiContainer.sortChildren();
    }

}