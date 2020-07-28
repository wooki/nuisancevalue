const PIXI = require('pixi.js');

import Victor from 'victor';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import {BevelFilter} from '@pixi/filter-bevel';
import {CRTFilter} from '@pixi/filter-crt';

import Assets from '../Utils/images.js';
import Hulls from '../../../common/Hulls';
import UiUtils from '../Utils/UiUtils';
import Ship from '../../../common/Ship';
import PDC from '../../../common/PDC';
import Torpedo from '../../../common/Torpedo';
import Asteroid from '../../../common/Asteroid';
import Planet from '../../../common/Planet';

const effects = {
  waypointColor: new ColorReplaceFilter([0, 0, 0], [1, 1, 0], 0.1),
  targetColor: new ColorReplaceFilter([0, 0, 0], [0, 1, 0], 0.1),
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
  })
};

export default class LocalMap {

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

    this.sprites = []; // keep track of sprites on the map
    this.mapObjects = []; // keep track of actual objects
    this.playerSprite = null;

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
    dashboardMaskBorderGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    this.mapContainer.mask = dashboardMaskBorderGraphics;
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
  }

  addExplosion(obj, renderer) {
    if (this.playerShip) {
      let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                           obj.physicsObj.position[1],
                                           this.playerShip.physicsObj.position[0],
                                           this.playerShip.physicsObj.position[1]);


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
        texture = this.resources[this.parameters.baseUrl+Assets.Images[obj.texture]].texture;
        zIndex = this.parameters.internalZIndex.planet;
        alias = obj.texture;
      } else if (obj instanceof Ship) {
          let hullData = Hulls[obj.hull];
          texture = this.resources[this.parameters.baseUrl+hullData.image].texture;
          zIndex = this.parameters.internalZIndex.ship;
          alias = obj.hull;
          widthRatio = hullData.width;
      } else if (obj instanceof Torpedo) {
          let hullData = Hulls[obj.hull];
          texture = this.resources[this.parameters.baseUrl+hullData.image].texture;
          zIndex = this.parameters.internalZIndex.torpedo;
          alias = obj.hull;
          widthRatio = hullData.width;
      }

    let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                         obj.physicsObj.position[1],
                                         this.playerShip.physicsObj.position[0],
                                         this.playerShip.physicsObj.position[1]);

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

    // update position
    let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                         obj.physicsObj.position[1],
                                         this.playerShip.physicsObj.position[0],
                                         this.playerShip.physicsObj.position[1]);

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

      // if (this.sprites[obj.id + '-label'] && this.sprites[obj.id]) {
      //     this.sprites[obj.id + '-label'].x = coord.x + (3 + Math.floor(this.sprites[obj.id].width/2));
      //     this.sprites[obj.id + '-label'].y = coord.y - (3 + Math.floor(this.sprites[obj.id].height/2));
      // }

      if (obj instanceof Ship || obj instanceof Torpedo) {
        if (obj.engine || obj.engine == 0) {
          this.updateObjectScale(obj, obj.id);
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
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;
    const position = playerShip.physicsObj.position;
    if (position) {

      // add or update the player ship
      if (!isDestroyed) {

        let coord = this.relativeScreenCoord(playerShip.physicsObj.position[0],
                                             playerShip.physicsObj.position[1],
                                             playerShip.physicsObj.position[0],
                                             playerShip.physicsObj.position[1]);

        // add the player ship sprite if we haven't got it
        if (!this.playerSprite) {
            this.playerSprite = this.createShipSprite(playerShip, coord, this.parameters.internalZIndex.playerShip);
            this.addSpriteToMap(this.playerSprite, playerShip.id);
        } else {
          this.updateObjectScale(playerShip, playerShip.id); // also scales engines - which is why we do here
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

      let sprite = new PIXI.Sprite(texture);
      sprite.width = width * this.parameters.scale;
      sprite.height = height * this.parameters.scale;
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.zIndex = zIndex;
      sprite.hitArea = new PIXI.Circle(0, 0, Math.max(16/sprite.scale.x, sprite.texture.width/2, sprite.texture.height/2));
      if (guid.toString().startsWith('waypoint-')) {
        sprite.filters = [ effects.waypointColor ];
      }

      return this.addSpriteToMap(sprite, guid);
  }

  updateObjectScale(obj, guid) {

    let sprite = this.sprites[guid];

    if (sprite) {
      if (obj.hull) {

        let hullData = Hulls[obj.hull];
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

  relativeScreenCoord(x, y, focusX, focusY) {

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
      if (obj) {
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

    let hullData = Hulls[ship.hull];
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
