import KeyboardControls from '../NvKeyboardControls.js';
const PIXI = require('pixi.js');
const Assets = require('./images.js');
import {GlowFilter} from '@pixi/filter-glow';

import Ship from './../../common/Ship';
import Asteroid from './../../common/Asteroid';
import Planet from './../../common/Planet';
import NavCom from './Utils/NavCom';
import SolarObjects from './../../common/SolarObjects';
import Victor from 'victor';

let navCom = new NavCom();
let el = null;
let uiEls = {};
let game = null;
let client = null;
let settings = {
    baseUrl: '/',
    mapSize: 500000, // this is set in setSizes
    zoom: 3, // 0-9, index for zoomLevels
    zoomLevels: [4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03123, 0.015625, 0.0078125],
    focus: [0, 0],
    loadedSprites: false,
    gridSize: 50000, // this is set in setSizes
    minimumScale: 0.001,
    minimumSpriteSize: 8,
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
let mapContainer = null;
let sprites = {};
let mapObjects = {}; // keep track of what we have added
let effects = {
    hudGlow: new GlowFilter(3, 5, 0, 0x000000, 0.5)
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
        pixiApp.stage.addChild(pixiContainer);
        mapContainer = new PIXI.Container();
        mapContainer.sortableChildren = true;
        mapContainer.zIndex = 1;
        pixiApp.stage.addChild(mapContainer);
        el.append(pixiApp.view); // add to the page

        // prepare to load resources
        const loader = PIXI.Loader.shared;

        // load sprites
        pixiApp.loader.add(settings.baseUrl+Assets.Images.starfury);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.ship);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.asteroid);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.sol);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.earth);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.mars);
        pixiApp.loader.add(settings.baseUrl+Assets.Images.explosion);

        // manage loading of resources
        pixiApp.loader.load(this.loadResources.bind(this));

        // add ui might as well use html for the stuff it's good at
        this.drawUi(root);
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
            let result = navCom.parse(val);
            log.innerHTML = log.innerHTML + "\nNAV:COM$ " + val + (result.error ? "\n" + result.error : '');
console.log(">>> command");
console.dir(result);

            if (!result.error) {
                if (result.command == 'clear') { // clear
                    log.innerHTML = '';

                } else if (result.command == 'help') { // help
                    let cmd = null;
                    if (result.parameters && result.parameters.command) {
                        cmd = result.parameters.command;
                    }
                    let help = navCom.help(cmd);
                    log.innerHTML = log.innerHTML + help;

                } else if (result.command == 'focus') { // focus

                    let focusX = 0;
                    let focusY = 0;
                    if (result.parameters.centre.includes(',')) {
                        let coords = result.parameters.centre.split(',');
                        focusX = parseInt(coords[0].replace('k', '000')) || 0;
                        focusY = parseInt(coords[1].replace('k', '000')) || 0;
                    } else {
                        if (aliases[result.parameters.centre]) {
                            let obj = game.world.queryObject({id: parseInt(aliases[result.parameters.centre])})
                            if (obj) {
                                focusX = obj.physicsObj.position[0];
                                focusY = obj.physicsObj.position[1];
                            }
                        }
                    }
                    settings.focus = [focusX, focusY];
                    this.updateGrid(settings.focus[0], settings.focus[1]);

                } else if (result.command == 'zoom') { // zoom

                    settings.zoom = parseInt(result.parameters.level);
                    this.setSizes();
                    this.createGrid()
                    this.updateGrid(settings.focus[0], settings.focus[1]);

                } else if (result.command == 'waypoint') { // waypoint
// "name", test: testString, help: "Name for the waypoint" },
// "target", test: testFocus, optional: true, help: "One of: an object; a coordinate in the form x,y (can use k for thousands); a direction and distance in the form distance@degrees e.g. 100k@30." }
// "Set a waypoint on the map, if the target is ommitted it removes the waypoint."


                } else if (result.command == 'orbit') { // orbit

                    let obj = null;
                    if (!(aliases[result.parameters.alias] === null)) {
                        obj = game.world.queryObject({id: parseInt(aliases[result.parameters.alias])})
                    }
                    if (obj && obj instanceof Planet) {

                        let us = game.world.queryObject({id: parseInt(aliases['self'])})
                        let radius = obj.size + parseInt(result.parameters.distance);
                        // log.innerHTML = log.innerHTML + "\nOrbit Radius: "+radius;
                        if (us.gravityData && us.gravityData.direction) {
                            let gravity = Victor.fromArray([us.gravityData.direction.x, us.gravityData.direction.y]);
                            let orbitV = Math.sqrt((SolarObjects.constants.G * us.gravityData.mass) / gravity.length() + 1);
                            log.innerHTML = log.innerHTML + "\nOrbit radius "+Math.round(radius)+" at "+Math.round(orbitV) + SolarObjects.units.speed;
                        }

                    } else {
                        log.innerHTML = log.innerHTML + "\nInvalid target";
                    }

                } else if (result.command == 'info') { // info

                    let obj = null;
                    if (!(aliases[result.parameters.alias] === null)) {
                        obj = game.world.queryObject({id: parseInt(aliases[result.parameters.alias])})
                    }
                    if (obj) {

                        if (obj instanceof Ship) {
                            log.innerHTML = log.innerHTML + "\nDesignation: Ship";
                        } else if (obj instanceof Planet) {
                            log.innerHTML = log.innerHTML + "\nDesignation: Planet";
                        } else if (obj instanceof Asteroid) {
                            log.innerHTML = log.innerHTML + "\nDesignation: Asteroid";
                        }

                        // vector of object
                        let v = new Victor(obj.physicsObj.velocity[0], 0 - obj.physicsObj.velocity[1]);

                        log.innerHTML = log.innerHTML + "\nMass: " + obj.physicsObj.mass.toPrecision(3) + SolarObjects.units.mass;
                        log.innerHTML = log.innerHTML + "\nHeading: " + ((Math.round(v.verticalAngleDeg()) + 360) % 360) + "°";
                        log.innerHTML = log.innerHTML + "\nSpeed: " + Math.round(v.magnitude()) + SolarObjects.units.speed;
                        log.innerHTML = log.innerHTML + "\nRadius: " + Math.round(obj.size / 2) + SolarObjects.units.distance;

                        // bearing & distance
                        let us = game.world.queryObject({id: parseInt(aliases['self'])})
                        if (us && us.id != obj.id) {

                            let ourPos = Victor.fromArray(us.physicsObj.position);
                            let theirPos = Victor.fromArray(obj.physicsObj.position);
                            let direction = theirPos.clone().subtract(ourPos);
                            direction = new Victor(direction.x, 0 - direction.y);

                            log.innerHTML = log.innerHTML + "\nBearing: " + ((Math.round(direction.verticalAngleDeg()) + 360) % 360) + "°";
                            log.innerHTML = log.innerHTML + "\nDistance: " + direction.magnitude().toPrecision(3) + SolarObjects.units.distance;

                            if (obj instanceof Planet) {
                                let g = Math.round(((SolarObjects.constants.G * obj.physicsObj.mass) / Math.pow((obj.size / 2), 2)) * 100) / 100;
                                log.innerHTML = log.innerHTML + "\nSurface G: " + g + SolarObjects.units.force;
                            }

                            // closing speed
                            // https://gamedev.stackexchange.com/questions/118162/how-to-calculate-the-closing-speed-of-two-objects
                            // val tmp = a.position - b.position
                            // return -((a.velocity - b.velocity).dot(tmp)/tmp.length)
                            let ourVelocity = new Victor(us.physicsObj.velocity[0], 0 - us.physicsObj.velocity[1]);
                            let closing = ((ourVelocity.clone().subtract(v)).dot(direction) / direction.length());
                            log.innerHTML = log.innerHTML + "\nClosing: " + closing.toPrecision(3) + SolarObjects.units.speed;

                        }


                    } else {
                        log.innerHTML = log.innerHTML + "\nobject '" + result.parameters.alias + "' not found.";
                    }
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
        uiEls.console.innerHTML = 'This is test console content.';
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
        settings.gridSize = Math.floor(50000 * settings.scale);
    }

    // clicked an object, do some stuff...
    objectClick(guid, eventData) {

        console.log("guid: "+guid);

        let obj = game.world.queryObject({ id: parseInt(guid) });
        console.dir(obj);

    }

    getUseSize(width, height, minimumScale, minimumSize) {

        console.log({
            width: width,
            height: height,
            minimumScale: minimumScale,
            minimumSize: minimumSize,
            settingsScale: settings.scale
        });
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

    addToMap(name, guid, texture, width, height, x, y, angle, zIndex, minimumScale, minimumSize) {

        // give anything added to the map an alias
        let alias = name;
        if (aliases[alias]) {
            alias = name + guid;
        }
        aliases[alias] = guid; // alias just keeps actual guid

        let useSize = this.getUseSize(width, height, minimumScale, minimumSize);

        sprites[guid] = new PIXI.Sprite(texture);
        sprites[guid].filters = [ effects.hudGlow ];
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

    removeFromMap(guid) {
        mapObjects[guid].destroy();
        mapObjects[guid] = null;
        sprites[guid] = null;
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

        // set the grid to the 0,0 point at the start
        this.updateGrid(settings.focus[0], settings.focus[1]);

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
                let alias = obj.id;
                if (obj instanceof Ship && obj.navPlayerId == game.playerId) {
                    playerShip = obj;
                    isPlayer = true;

                    // hard-code alias for self
                    aliases['self'] = obj.id;
                    aliases['me'] = obj.id;
                }

                let texture = null;
                let zIndex = settings.zIndex.asteroid;
                if (obj instanceof Ship) {
                    texture = settings.resources[settings.baseUrl+Assets.Images[obj.hull]].texture;
                    zIndex = settings.zIndex.ship;
                    alias = obj.hull;
                } if (obj instanceof Asteroid) {
                    texture = settings.resources[settings.baseUrl+Assets.Images.asteroid].texture;
                    zIndex = settings.zIndex.asteroid;
                    alias = 'asteroid';
                } else if (obj instanceof Planet) {
                    texture = settings.resources[settings.baseUrl+Assets.Images[obj.texture]].texture;
                    zIndex = settings.zIndex.planet;
                    alias = obj.texture;
                }

                if (isPlayer) {
                    alias = obj.name;
                }

                let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                                     obj.physicsObj.position[1],
                                                     settings.focus[0],
                                                     settings.focus[1],
                                                     pixiApp.screen.width,
                                                     pixiApp.screen.height,
                                                     0, // obj.physicsObj.angle, // might need to add Math.PI
                                                     settings.scale);

                let angle = this.adjustAngle(obj.physicsObj.angle);

                if (!mapObjects[obj.id]) {
                    this.addToMap(alias,
                                  obj.id,
                                  texture,
                                  obj.size, obj.size,
                                  coord.x, coord.y,
                                  angle,
                                  zIndex, settings.minimumScale, settings.minimumSpriteSize)
                } else {
                    // update position & scale
                    mapObjects[obj.id].x = coord.x;
                    mapObjects[obj.id].y = coord.y;
                    let angle = this.adjustAngle(obj.physicsObj.angle);
                    mapObjects[obj.id].rotation = angle;
                    if (scaleChange) {
                        let useSize = this.getUseSize(obj.size, obj.size, settings.minimumScale, settings.minimumSpriteSize);
                        mapObjects[obj.id].width = useSize.useWidth;
                        mapObjects[obj.id].height = useSize.useHeight;
                    }

                    if (mapObjects[obj.id + '-label'] && mapObjects[obj.id]) {

                        mapObjects[obj.id + '-label'].x = coord.x + (3 + Math.floor(mapObjects[obj.id].width/2));
                        mapObjects[obj.id + '-label'].y = coord.y - (3 + Math.floor(mapObjects[obj.id].height/2));
                    }
                }
            });

        }

        mapContainer.sortChildren();
        scaleChange = false;
    }

}