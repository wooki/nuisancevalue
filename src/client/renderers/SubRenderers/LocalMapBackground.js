const PIXI = require('pixi.js');
import Assets from '../Utils/images.js';
import UiUtils from '../Utils/UiUtils';
import {GlitchFilter} from '@pixi/filter-glitch';
import {PixelateFilter} from '@pixi/filter-pixelate';

export default class LocalMapBackground {

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
      backgroundAsset: 'space',
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
        lowPower: [new PixelateFilter([2, 2])],
        veryLowPower: [new PixelateFilter([3, 3]), new GlitchFilter({
          slices: 3,
          offset: 20
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

    // put everything in a container
    this.mapContainer = new PIXI.Container();
    this.mapContainer.sortableChildren = true;
    this.mapContainer.zIndex = this.parameters.zIndex;
    this.mapContainer.interactive = true;
    this.mapContainer.on('mousedown', this.canvasClick.bind(this));
    this.mapContainer.on('touchstart', this.canvasClick.bind(this));
    pixiContainer.addChild(this.mapContainer);

    this.centerX = this.parameters.x + (this.parameters.width/2);
    this.centerY = this.parameters.y + (this.parameters.height/2);

    // draw a border around the mask
    let borderGraphics = new PIXI.Graphics();
    borderGraphics.lineStyle(this.parameters.borderWidth, Assets.Colors.Dial, 1, 0.5);
    if (this.parameters.shape == "circle") {
      borderGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    } else {
      borderGraphics.drawRect(this.centerX - (this.parameters.width/2), this.centerY - (this.parameters.height/2), this.parameters.width, this.parameters.height);
    }

    let borderTexture = pixiApp.renderer.generateTexture(borderGraphics);
    borderGraphics.destroy();
    borderTexture = new PIXI.Sprite(borderTexture);
    borderTexture.anchor.set(0.5);
    borderTexture.x = this.centerX;
    borderTexture.y = this.centerY;
    borderTexture.zIndex = this.parameters.zIndex+1;
    pixiContainer.addChild(borderTexture);

    // prevent drawing outside the map
    let dashboardMaskBorderGraphics = new PIXI.Graphics();
    dashboardMaskBorderGraphics.beginFill(Assets.Colors.Black, 1);
    if (this.parameters.shape == "circle") {
      dashboardMaskBorderGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    } else {
      dashboardMaskBorderGraphics.drawRect(this.centerX - (this.parameters.width/2), this.centerY - (this.parameters.height/2), this.parameters.width, this.parameters.height);
    }
    this.mapContainer.mask = dashboardMaskBorderGraphics;

    // draw background
    let backgroundTexture = resources[this.parameters.baseUrl+Assets.Images[this.parameters.backgroundAsset]].texture;
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
  }

  canvasClick(event) {
      event.stopPropagation();
      this.renderer.updateSharedState({
    		selection: null
    	});
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

    }

    // focus has changed
    if ((state.focus || state.focus == 0) && state.focus != this.parameters.focus) {

      // update setting and position immediately
      this.parameters.focus = state.focus;
      this.focusObjectCoord = this.getFocusCoord();
    }
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

  updateObject(obj, renderer) {
    if (obj.id == this.parameters.focus) {
        this.focusObjectCoord = obj.physicsObj.position;
    }
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;

    // set the low power effect
    let actualPlayerShip = isDocked || playerShip;
    let consoleEfficiency = actualPlayerShip.getConsolesEfficiency();
    if (consoleEfficiency < 0.5) {
      this.mapContainer.filters = this.parameters.effects.veryLowPower;
    } else if (consoleEfficiency < 1) {
      this.mapContainer.filters = this.parameters.effects.lowPower;
    } else {
      this.mapContainer.filters = [];
    }

    // const position = playerShip.physicsObj.position;
    const position = this.getFocusCoord();
    if (position) {
      this.updateGrid(position[0], position[1]);
    }
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
