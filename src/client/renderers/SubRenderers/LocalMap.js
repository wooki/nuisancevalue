const PIXI = require('pixi.js');

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

    let dashboardMaskGraphics = new PIXI.Graphics();
    dashboardMaskGraphics.beginFill(Assets.Colors.Black, 1);
    dashboardMaskGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    dashboardMaskGraphics.endFill();
    this.mapContainer.mask = dashboardMaskGraphics;

    // draw background
    let backgroundTexture = resources[this.parameters.baseUrl+Assets.Images.space].texture;
    this.backgroundSprite = new PIXI.TilingSprite(backgroundTexture, 1024, 1024);
    this.backgroundSprite.anchor.set(0.5);
    this.backgroundSprite.x = this.centerX;
    this.backgroundSprite.y = this.centerY;
    this.backgroundSprite.width = this.parameters.width;
    this.backgroundSprite.height = this.parameters.height;
    this.backgroundSprite.zIndex = this.parameters.internalZIndex.background;
    this.mapContainer.addChild(this.backgroundSprite);

    // add the grid
    this.createGrid();

    setTimeout(() => {
      this.updateSharedState({zoom: 0.5});
    }, 3000);
    setTimeout(() => {
      this.updateSharedState({zoom: 2});
    }, 6000);
    setTimeout(() => {
      this.updateSharedState({zoom: 1});
    }, 9000);

  }

  // needed to listen for zoom
  updateSharedState(state, renderer) {

    // zoom has changed, this.parameters.zoom
    if (state.zoom && state.zoom != this.parameters.zoom) {

      // recalc scale
      this.parameters.zoom = state.zoom;
      this.parameters.scale = this.parameters.height * this.parameters.zoom / (this.parameters.mapSize);

      // update the grid and grid position
      this.createGrid();
      if (this.focus) {
        this.updateGrid(this.focus.x, this.focus.y);
      }

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
                                           this.playerShip.physicsObj.position[1],
                                           this.parameters.scale);


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
                                         this.playerShip.physicsObj.position[1],
                                         this.parameters.scale);

    if (isPDC) {
      // this.addPDC(coord.x, coord.y, obj.size, 200, 6);
      console.info("implement: addPDC");
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

    // if selected then highlight somehow
    if (this.playerShip.targetId === obj.id) {
        // this.drawTarget(coord);
        console.info("implement: drawTarget")
    }
  }

  updateObject(obj, renderer) {

    let sprite = this.sprites[obj.id];
    if (sprite) {

      // update position
      let coord = this.relativeScreenCoord(obj.physicsObj.position[0],
                                           obj.physicsObj.position[1],
                                           this.playerShip.physicsObj.position[0],
                                           this.playerShip.physicsObj.position[1],
                                           this.parameters.scale);
      sprite.x = coord.x;
      sprite.y = coord.y;
      sprite.rotation = UiUtils.adjustAngle(obj.physicsObj.angle);

      if (this.sprites[obj.id + '-label'] && this.sprites[obj.id]) {
          this.sprites[obj.id + '-label'].x = coord.x + (3 + Math.floor(this.sprites[obj.id].width/2));
          this.sprites[obj.id + '-label'].y = coord.y - (3 + Math.floor(this.sprites[obj.id].height/2));
      }

      if (obj instanceof Ship || obj instanceof Torpedo) {
        if (obj.engine || obj.engine == 0) {
          this.updateObjectScale(obj, obj.id);
        }
      }
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

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {

    this.playerShip = playerShip;
    const position = playerShip.physicsObj.position;
    if (position) {
      this.updateGrid(position[0], position[1]);

      // add or update the player ship
      if (!isDestroyed) {

        let coord = this.relativeScreenCoord(playerShip.physicsObj.position[0],
                                             playerShip.physicsObj.position[1],
                                             playerShip.physicsObj.position[0],
                                             playerShip.physicsObj.position[1],
                                             this.parameters.scale);

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

        if (hullData.enginePositions) {

          hullData.enginePositions.forEach((e, i) => {
            // scale based on ship engine level and sizes
            let exhaustSprite = sprite.getChildByName('exhaust-'+i);
            let exhaustSize = e[0] * (obj.engine || 0) * width;
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

  addSpriteToMap(sprite, guid) {

    this.sprites[guid] = sprite;
    this.mapContainer.addChild(sprite);
    return sprite;
  }

  createShipSprite(ship, coord, zIndex) {

    if (ship instanceof Torpedo) {
      console.log("createShipSprite Torpedo");
    }
    let hullData = Hulls[ship.hull];
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
    container.addChild(body);

    // create the engine sprite
    if (hullData.enginePositions) {
      let exhaustSheet = this.resources[this.parameters.baseUrl+Assets.Images[hullData.exhaustImage]].spritesheet;
((0 - width) / 2) +
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

  createGrid() {
      // remove old one
      if (this.gridSprite) {
          this.mapContainer.removeChild(this.gridSprite);
          this.gridSprite.destroy(true);
          this.gridSprite = null;
      }

      // work out how big to make everything and what divisions to draw (if any)
      let largeDivSize = this.parameters.gridSize * this.parameters.scale;
      let smallGridDivisions = this.parameters.subdivisions;
      let smallDivSize = (largeDivSize / smallGridDivisions);
      let largeDivColor = Assets.Colors.Grid;
      let smallDivColor = Assets.Colors.GridSmall;

      // constrain by using 1024 as biggest sprite we want to create
      if (largeDivSize <= 1024) {
        // we may not want small division unless large size is really big
        if (smallDivSize < 32) {
          smallDivSize = 0;
        }
      } else {
        // use small size only but as large
        largeDivSize = smallDivSize;
        smallDivSize = 0;
        largeDivColor = Assets.Colors.GridSmall;
      }

      // create a texture for the grid background
      const gridGraphics = new PIXI.Graphics();
      const lineWidth = 1;

      // draw small grid (if there is one)
      if (smallDivSize > 0) {
        gridGraphics.lineStyle(lineWidth, smallDivColor);
        for (let iX = 0; iX < (smallGridDivisions-1); iX++) {
          gridGraphics.moveTo(smallDivSize*iX, lineWidth); gridGraphics.lineTo(smallDivSize*iX, largeDivSize - lineWidth);
        }
        gridGraphics.moveTo(largeDivSize - smallDivSize, lineWidth); gridGraphics.lineTo(largeDivSize - smallDivSize, largeDivSize - lineWidth);
        for (let iY = 0; iY < (smallGridDivisions-1); iY++) {
          gridGraphics.moveTo(lineWidth, smallDivSize*iY); gridGraphics.lineTo(largeDivSize - lineWidth, smallDivSize*iY);
        }
        gridGraphics.moveTo(lineWidth, largeDivSize - smallDivSize); gridGraphics.lineTo(largeDivSize - lineWidth, largeDivSize - smallDivSize);
      }

      // add large grid (outline box)
      gridGraphics.lineStyle(lineWidth, largeDivColor);
      gridGraphics.drawRect(0, 0, largeDivSize, largeDivSize);

      // draw to texture and tile
      let gridTexture = this.pixiApp.renderer.generateTexture(gridGraphics);
      gridGraphics.destroy();
      this.gridSprite = new PIXI.TilingSprite(gridTexture, largeDivSize, largeDivSize);
      this.gridSprite.anchor.set(0.5);
      this.gridSprite.x = this.centerX;
      this.gridSprite.y = this.centerY;
      this.gridSprite.width = this.parameters.width;
      this.gridSprite.height = this.parameters.height;
      this.gridSprite.zIndex = this.parameters.internalZIndex.grid;
      this.mapContainer.addChild(this.gridSprite);
      this.mapContainer.sortChildren();
  }

  updateGrid(x, y) {
			if (this.gridSprite) {
        this.focus = new PIXI.Point(x * this.parameters.scale, y * this.parameters.scale);
        this.gridSprite.tilePosition.x = (0 - this.focus.x) + (this.gridSprite.width / 2);
				this.gridSprite.tilePosition.y = (0 - this.focus.y) + (this.gridSprite.height / 2);
			}
	}

}
