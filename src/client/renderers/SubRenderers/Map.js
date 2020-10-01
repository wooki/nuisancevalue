const PIXI = require('pixi.js');

import Victor from 'victor';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import {BevelFilter} from '@pixi/filter-bevel';
// import {GlowFilter} from '@pixi/filter-glow'; // produced odd bugs with color replace filter used on MapHud
// import {ColorOverlayFilter} from '@pixi/filter-color-overlay';
import {OutlineFilter} from '@pixi/filter-outline';
// import {CRTFilter} from '@pixi/filter-crt';
import {GlitchFilter} from '@pixi/filter-glitch';
import {PixelateFilter} from '@pixi/filter-pixelate';

import Assets from '../Utils/assets.js';
import Hulls from '../../../common/Hulls';
import UiUtils from '../Utils/UiUtils';
import Ship from '../../../common/Ship';
import PDC from '../../../common/PDC';
import Torpedo from '../../../common/Torpedo';
import Asteroid from '../../../common/Asteroid';
import Planet from '../../../common/Planet';
import Factions from '../../../common/Factions';

export default class Map {

  // keep track of where the renderer wants us to draw this
  constructor(params) {

    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      zIndex: 1,
      baseUrl: '/',
      mapSize: 10000, // how much to display across the width of the map
      zoom: 1,
      gridSize: 10000,
      subdivisions: 10,
      mimimumSpriteSize: 10,
      borderWidth: 4,
      focus: "player", // "player", [0,0], 0 = "the players ship, a coord, an object id"
      shape: "circle", // or "rectangle"
      internalZIndex: {
        background: 1,
        grid :2,
        paths: 3,
        asteroid: 10,
        planet: 11,
        torpedo: 49,
        ship: 50,
        playerShip: 55,
        waypoints: 60,
        explosion: 70,
        ui: 101
      },
      effects: {
        waypointColor: new ColorReplaceFilter([0, 0, 0], [1, 1, 0], 0.1),
        // targetColor: new ColorReplaceFilter([0, 0, 0], [0, 1, 0], 0.1),
        // friendGlow: new GlowFilter({
        //   distance: 3 * window.devicePixelRatio,
        //   color: 0x00FF00,
        //   quality: 0.6
        // }),
        // neutralGlow: new GlowFilter({
        //   distance: 3 * window.devicePixelRatio,
        //   color: 0x0000FF,
        //   quality: 0.6
        // }),
        // enemyGlow: new GlowFilter({
        //   distance: 3 * window.devicePixelRatio,
        //   color: 0xFF0000,
        //   quality: 0.6
        // }),
        // friendGlow: new ColorOverlayFilter(0x00FF00),
        // neutralGlow: new ColorOverlayFilter(0x0000FF),
        // enemyGlow: new ColorOverlayFilter(0xFF0000),
        friendFilter: new OutlineFilter(1, Assets.Colors.Friend, 0.6),
        neutralFilter: new OutlineFilter(1, Assets.Colors.Neutral, 0.6),
        enemyFilter: new OutlineFilter(1, Assets.Colors.Enemy, 0.6),
        unscannedFilter: new PixelateFilter([6, 6]),
        // crt: new CRTFilter({
        //   curvature: 8,
        //   lineWidth: 10,
        //   lineContrast: 0.8, // 0.4,
        //   noise: 0.4, // 0.2,
        //   noiseSize: 1.6, // 1.2,
        //   vignetting: 0,
        //   vignettingAlpha: 0,
        //   seed: 0,
        //   time: 0
        // })
        lowPower: [new PixelateFilter([2, 2])],
        veryLowPower: [new PixelateFilter([4, 4]), new GlitchFilter({
          offset: 30
        })],
      }
    }, params);

    // based on mapSize we want to display and size we
    // are drawing we can calculate scale
    this.parameters.scale = this.parameters.height / (this.parameters.mapSize * this.parameters.zoom);
  }

  // keep reference and draw what we can
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.pixiApp = pixiApp;
    this.pixiContainer = pixiContainer;
    this.resources = resources;
    this.renderer = renderer;

    this.focusObjectCoord = [];
    this.sprites = []; // keep track of sprites on the map
    this.mapObjects = []; // keep track of actual objects
    this.playerSprite = null;
    this.factions = new Factions();

    // put everything in a container
    this.mapContainer = new PIXI.Container();
    this.mapContainer.sortableChildren = true;
    this.mapContainer.zIndex = this.parameters.zIndex;
    pixiContainer.addChild(this.mapContainer);

    this.centerX = this.parameters.x + (this.parameters.width/2);
    this.centerY = this.parameters.y + (this.parameters.height/2);

    // prevent drawing outside the map
    let dashboardMaskBorderGraphics = new PIXI.Graphics();
    dashboardMaskBorderGraphics.beginFill(Assets.Colors.Black, 1);
    if (this.parameters.shape == "circle") {
      dashboardMaskBorderGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    } else {
      dashboardMaskBorderGraphics.drawRect(this.centerX - (this.parameters.width/2), this.centerY - (this.parameters.height/2), this.parameters.width, this.parameters.height);
    }
    this.mapContainer.mask = dashboardMaskBorderGraphics;
  }

  // get the coord depending on the focus type
  getFocusCoord() {
    if (this.parameters.focus == "player") {
      // get the playerShip coord
      if (this.playerShip) {
        this.focusObjectCoord = this.playerShip.physicsObj.position;
        return this.focusObjectCoord;
      }
    } else if (Array.isArray(this.parameters.focus)) {
      // coord
      this.focusObjectCoord = this.parameters.focus;
      return this.focusObjectCoord;
    } else {
      // get the coord of the object with that id
      return this.focusObjectCoord;
    }

    return [0, 0]; // shouldn't get here
  }

  // needed to listen for zoom
  updateSharedState(state, renderer) {

    // zoom has changed, this.parameters.zoom
    if (state.zoom && state.zoom != this.parameters.zoom) {

      // recalc scale
      this.parameters.zoom = state.zoom;
      this.parameters.scale = this.parameters.height * this.parameters.zoom / (this.parameters.mapSize);

      // resize objects
      this.mapObjects.forEach((obj) => {
        this.updateObjectScale(obj, obj.id);
      });
    }

    // focus has changed
    if ((state.focus || state.focus == 0) && state.focus != this.parameters.focus) {

      // update setting and position immediately
      this.parameters.focus = state.focus;
      this.focusObjectCoord = this.getFocusCoord();
    }

    // remember selected object
    this.selected = state.selection;
  }

  addExplosion(obj, renderer) {
    if (this.playerShip) {
      let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                           obj.physicsObj.position[1]);


      UiUtils.addExplosion(this.resources[this.parameters.baseUrl+Assets.Images.explosion].spritesheet,
        this.mapContainer,
        obj.size * this.parameters.scale, obj.size * this.parameters.scale,
        coord.x, coord.y, this.parameters.internalZIndex.explosion);
    }
  }

  addObject(obj, renderer) {

    this.mapObjects[obj.id] = obj;

    let isPDC = false;
    let alias = obj.id;
    let texture = null;
    let zIndex = this.parameters.internalZIndex.asteroid;
    let widthRatio = 1;
    if (obj instanceof Asteroid) {
        texture = this.resources[this.parameters.baseUrl+Assets.Images.asteroid].texture;
        alias = 'asteroid';
      } else if (obj instanceof PDC) {
          // instead of drawing - always create a load of random small explosions
          isPDC = true;
      } else if (obj instanceof Planet) {
        if (obj.texture == "sol") console.log("addObject");
        texture = this.resources[this.parameters.baseUrl+Assets.Images[obj.texture]].texture;
        zIndex = this.parameters.internalZIndex.planet;
        alias = obj.texture;
      } else if (obj instanceof Ship) {
          let hullData = obj.getHullData();
          texture = this.resources[this.parameters.baseUrl+hullData.image].texture;
          zIndex = this.parameters.internalZIndex.ship;
          alias = obj.hull;
          widthRatio = hullData.width;
      } else if (obj instanceof Torpedo) {
          let hullData = obj.getHullData();
          texture = this.resources[this.parameters.baseUrl+hullData.image].texture;
          zIndex = this.parameters.internalZIndex.torpedo;
          alias = obj.hull;
          widthRatio = hullData.width;
      }

    let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                         obj.physicsObj.position[1]);

    if (isPDC) {
      const explosionSize = 200;
      const numberPerSecond = 6;
      UiUtils.addPDC(this.resources[this.parameters.baseUrl+Assets.Images.explosion].spritesheet, this.mapContainer, coord.x, coord.y, obj.size, explosionSize, numberPerSecond, this.parameters.scale, 10, this.parameters.internalZIndex.explosion);
    } else if (obj instanceof Ship || obj instanceof Torpedo) {
        let shipSprite = this.createShipSprite(obj, coord, this.parameters.internalZIndex.ship);
        this.addSpriteToMap(shipSprite, obj.id);
    } else {

      this.addToMap(alias,
              obj.id,
              texture,
              obj.size * widthRatio, obj.size,
              coord.x, coord.y,
              zIndex, false);
    }
  }

  updateObject(obj, renderer) {

    if (obj.id == this.parameters.focus) {
        this.focusObjectCoord = obj.physicsObj.position;
    }

    // update position
    let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                         obj.physicsObj.position[1]);

    let sprite = this.sprites[obj.id];
    if (sprite) {

      sprite.x = coord.x;
      sprite.y = coord.y;

      let spriteAngle = UiUtils.adjustAngle(obj.physicsObj.angle);

      // cheat with the torp sprite - looks better if they simply always face their target
      if (obj instanceof Torpedo) {
        if (this.mapObjects[obj.targetId]) {
          let torpPos = Victor.fromArray(obj.physicsObj.position);
    			let targetPos = Victor.fromArray(this.mapObjects[obj.targetId].physicsObj.position);
    			let direction = torpPos.clone().subtract(targetPos);
    			direction = new Victor(0 - direction.x, direction.y);
          spriteAngle = direction.verticalAngle();
        }
      }
      sprite.rotation = spriteAngle;

      if (obj instanceof Ship || obj instanceof Torpedo) {
        if (obj.engine || obj.engine == 0) {
          this.updateObjectScale(obj, obj.id);
        }
      }

      // check if we have scanned - and if so, is it friend or foe?
      if (obj.isScannedBy) {

        let actualPlayerShip = this.dockedPlayerShip || this.playerShip;
        let isScanned = obj.isScannedBy(actualPlayerShip.faction);

        let hullSprite = sprite.getChildByName('hull');
        if (!hullSprite) {
          hullSprite = sprite;
        }

        if (isScanned) {

          // always un-blur
          sprite.filters = [];

          // maybe only highlight enemy ships??
          if (obj.faction && obj.isFriend) {
            if (obj.isFriend(actualPlayerShip.faction)) {
              hullSprite.filters = [ this.parameters.effects.friendFilter];

            } else if (obj.isHostile(actualPlayerShip.faction)) {
              hullSprite.filters = [ this.parameters.effects.enemyFilter];

            } else {
              // hullSprite.filters = [ this.parameters.effects.neutralFilter];
              hullSprite.filters = [];
            }

            // TODO: replace with color replace filter so we can have multi-color ships
            let tint = this.factions.getFaction(obj.faction).color;
            tint = PIXI.utils.hex2rgb(tint);
            tint[0] = Math.min(1, tint[0] + 0.5);
            tint[1] = Math.min(1, tint[1] + 0.5);
            tint[2] = Math.min(1, tint[2] + 0.5);
            tint = PIXI.utils.rgb2hex(tint);
            hullSprite.tint = tint;
          }

        } else {
          // not scanned so set filter to obscure
          // hullSprite.filters = [ this.parameters.effects.unscannedFilter ];
          sprite.filters = [ this.parameters.effects.unscannedFilter ];
          hullSprite.tint = 0xFFFFFF;
        }
      }

    } else if (obj instanceof PDC) {
        // instead of drawing - always create a load of random small explosions
        const explosionSize = 200;
        const numberPerSecond = 6;
        UiUtils.addPDC(this.resources[this.parameters.baseUrl+Assets.Images.explosion].spritesheet, this.mapContainer, coord.x, coord.y, obj.size, explosionSize, numberPerSecond, this.parameters.scale, 10, this.parameters.internalZIndex.explosion);
    }
  }

  removeObject(key, renderer) {

    let sprite = this.sprites[key];
    if (sprite) {
        this.mapContainer.removeChild(sprite);
        sprite.destroy();
        sprite = null;
        delete this.sprites[key];
        delete this.mapObjects[key];
    }

    // watch for current selection being removed
    if (this.selected && this.selected.id == key) {
      this.renderer.updateSharedState({
        selection: null
      });
    }

  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;
    let actualPlayerShip = playerShip;
    if (isDocked) {
      this.dockedPlayerShip = isDocked;
      actualPlayerShip = isDocked;
    } else {
      this.dockedPlayerShip = null;
    }

    const position = playerShip.physicsObj.position;
    if (position) {

      // add or update the player ship
      if (!isDestroyed) {

        // set the low power effect
        let consoleEfficiency = actualPlayerShip.getConsolesEfficiency();
        if (consoleEfficiency < 0.5) {
          this.mapContainer.filters = this.parameters.effects.veryLowPower;
        } else if (consoleEfficiency < 1) {
          this.mapContainer.filters = this.parameters.effects.lowPower;
        } else {
          this.mapContainer.filters = [];
        }

        let coord = this.relativeScreenCoord(playerShip.physicsObj.position[0],
                                             playerShip.physicsObj.position[1]);

        // add the player ship sprite if we haven't got it
        if (!this.playerSprite) {
            this.playerSprite = this.createShipSprite(playerShip, coord, this.parameters.internalZIndex.playerShip);
            this.addSpriteToMap(this.playerSprite, playerShip.id);
        } else {
          this.updateObjectScale(playerShip, playerShip.id); // also scales engines - which is why we do here
          this.playerSprite.x = coord.x;
          this.playerSprite.y = coord.y;
        }

        // set the player ship rotation
        this.playerSprite.rotation = UiUtils.adjustAngle(playerShip.physicsObj.angle);

      } else {
        // remove player sprite and add explosion
        this.addExplosion(playerShip);
        this.mapContainer.removeChild(this.playerSprite);
        this.playerSprite.destroy();
        this.playerSprite = null;
      }

    }
  }

  addToMap(alias, guid, texture, width, height, x, y, zIndex, addLabel) {

    let w = width * this.parameters.scale;
    let h = height * this.parameters.scale;

    if (h < this.parameters.mimimumSpriteSize) {
      w = w * (this.parameters.mimimumSpriteSize / h);
      h = this.parameters.mimimumSpriteSize;
    }

      let sprite = new PIXI.Sprite(texture);
      sprite.width = w;
      sprite.height = h;
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.zIndex = zIndex;
      sprite.hitArea = new PIXI.Circle(0, 0, Math.max(16/sprite.scale.x, sprite.texture.width/2, sprite.texture.height/2));
      if (guid.toString().startsWith('waypoint-')) {
        sprite.filters = [ this.parameters.effects.waypointColor ];
      }

      return this.addSpriteToMap(sprite, guid);
  }

  updateObjectScale(obj, guid) {

    let sprite = this.sprites[guid];

    if (sprite) {
      if (obj.hull) {

        let hullData = obj.getHullData();
        let height = hullData.size * this.parameters.scale;
        let width = height * hullData.width;

        // ships can be prevented from getting too small to see
        if (height < this.parameters.mimimumSpriteSize) {
          height = this.parameters.mimimumSpriteSize;
          width = height * hullData.width;
        } else if (width < this.parameters.mimimumSpriteSize) {
          width = this.parameters.mimimumSpriteSize;
          height = width / hullData.width;
        }

        let bodySprite = sprite.getChildByName('hull');
        bodySprite.scale.set(width / bodySprite.texture.width, height / bodySprite.texture.height);
        bodySprite.hitArea = new PIXI.Circle(0, 0, Math.max(16/bodySprite.scale.x, bodySprite.texture.width/2, bodySprite.texture.height/2));

        if (hullData.enginePositions) {

          hullData.enginePositions.forEach((e, i) => {
            // scale based on ship engine level and sizes
            let exhaustSprite = sprite.getChildByName('exhaust-'+i);
            let engineSize = obj.engine;

            // hack for torps to always show full engine when firing at all
            if (obj.hull == "torpedo" && engineSize > 0) {
              engineSize = engineSize * 5;
            }

            let exhaustSize = e[0] * (engineSize || 0) * width;
            let scale = exhaustSize / exhaustSprite.texture.width;
            exhaustSprite.x = (0 - (width/2)) + (width * e[1]);
            exhaustSprite.y = (0 - (width/2)) + (width * e[2]);
            exhaustSprite.scale.set(scale, scale);
          });
        }

      } else {
        sprite.width = obj.size * this.parameters.scale;
        sprite.height = obj.size * this.parameters.scale;

        // other stuff can be prevented from getting too small to see
        if (sprite.width < this.parameters.mimimumSpriteSize) {
          sprite.width = this.parameters.mimimumSpriteSize;
          sprite.height = this.parameters.mimimumSpriteSize;
        }

        sprite.hitArea = new PIXI.Circle(0, 0, Math.max(16/sprite.scale.x, sprite.texture.width/2, sprite.texture.height/2));
      }
    }

  }

  relativeScreenCoord(x, y) {

      const focus = this.getFocusCoord();
      const focusX = focus[0];
      const focusY = focus[1];

			let matrix = new PIXI.Matrix();
			matrix.translate(x, y);
			matrix.translate(0 - focusX, 0 - focusY);
			matrix.scale(this.parameters.scale, this.parameters.scale);
			matrix.translate(this.centerX, this.centerY);
			let p = new PIXI.Point(0, 0);
			p = matrix.apply(p);

			return p;
	}

  // clicked an object, do some stuff...
  objectClick(guid, eventData) {

      eventData.stopPropagation();

      // let selectedGuid = parseInt(guid);
      let obj = this.mapObjects[guid];

      // coud be the player ship
      if ((!obj) && this.playerShip && this.playerShip.id == guid) {
        obj = this.playerShip;

      } else if ((!obj) && this.dockedPlayerShip && this.dockedPlayerShip.id == guid) {
        obj = this.dockedPlayerShip;

      }

      if (obj) {
        this.renderer.playSound('click');
        this.renderer.updateSharedState({
      		selection: obj
      	});
      }
  }


  addSpriteToMap(sprite, guid) {

    // watch for clicks and set selected object
    sprite.interactive = true;
    sprite.on('mousedown', (e) => { this.objectClick(guid, e) });
    sprite.on('touchstart', (e) => { this.objectClick(guid, e) });

    this.sprites[guid] = sprite;
    this.mapContainer.addChild(sprite);
    return sprite;
  }

  createShipSprite(ship, coord, zIndex) {

    let hullData = ship.getHullData();
    if (ship instanceof Torpedo) {
      hullData = ship.torpData;
    }

    let texture = this.resources[this.parameters.baseUrl+hullData.image].texture;
    let height = hullData.size * this.parameters.scale;
    let width = height * hullData.width;

    // ships can be prevented from getting too small to see
    if (height < this.parameters.mimimumSpriteSize) {
      height = this.parameters.mimimumSpriteSize;
      width = height * hullData.width;
    } else if (width < this.parameters.mimimumSpriteSize) {
      width = this.parameters.mimimumSpriteSize;
      height = width / hullData.width;
    }

    // build in a container (which allows for scaling afterwards)
    let container = new PIXI.Container();
    container.x = coord.x;
    container.y = coord.y;
    container.sortableChildren = true;
    container.zIndex = zIndex;

    // add hull
    let body = new PIXI.Sprite(texture);
    body.scale.set(width / body.texture.width, height / body.texture.height);
    body.anchor.set(0.5);
    body.x = 0;
    body.y = 0;
    body.zIndex = zIndex + 2;
    body.name = 'hull';
    body.hitArea = new PIXI.Circle(0, 0, Math.max(16/body.scale.x, body.texture.width/2, body.texture.height/2));
    container.addChild(body);

    // create the engine sprite
    if (hullData.enginePositions) {
      let exhaustSheet = this.resources[this.parameters.baseUrl+Assets.Images[hullData.exhaustImage]].spritesheet;
      hullData.enginePositions.forEach(function(e, i) {
        let exhaust = new PIXI.AnimatedSprite(exhaustSheet.animations[hullData.exhaustImage]);
        exhaust.width = 0;
        exhaust.height = 0; // sprite needs to be square
        exhaust.anchor.set(0.5, 0);
        exhaust.x = (0 - (width/2)) + (width * e[1]);
        exhaust.y = (0 - (width/2)) + (width * e[2]);
        exhaust.loop = true;
        exhaust.play();
        exhaust.zIndex = zIndex + 1;
        exhaust.name = 'exhaust-'+i;
        container.addChild(exhaust);

      });
    }

    return container;
  }

}
