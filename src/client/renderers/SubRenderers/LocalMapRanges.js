const PIXI = require('pixi.js');

import MapSensorRangeUi from '../Utils/MapSensorRangeUi';
import UiUtils from '../Utils/UiUtils';
import Assets from '../Utils/images';
import Ship from '../../../common/Ship';
import Torpedo from '../../../common/Torpedo';
import Asteroid from '../../../common/Asteroid';
import Planet from '../../../common/Planet';
import Victor from 'victor';

export default class LocalMapRanges {

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
      focus: "player", // "player", [0,0], 0 = "the players ship, a coord, an object id"
      shape: "circle", // or "rectangle"
      colors: {
        visual: 0xFFFFFF,
        sensors: 0xFFFFFF
      },
      alphas: {
        visual: 0.02,
        sensors: 0.02
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

    this.focusObjectCoord = [];

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

    this.createMapSensorRangeUi();
  }

  createMapSensorRangeUi() {

    if (this.mapSensorRangeUi) {
      this.mapContainer.removeChild(this.mapSensorRangeUi);
      this.mapSensorRangeUi.destroy();
      this.mapSensorRangeUi = null;
    }

    // create a helmPathUi to draw the paths that we'll add/update later
    this.mapSensorRangeUi = new MapSensorRangeUi({
          uiSize: this.parameters.height,
          uiWidth: this.parameters.width,
          uiHeight: this.parameters.height,
          scale: this.parameters.scale,
          zIndex: 1,
          ranges: this.getRangesArray()
      });
      this.mapContainer.addChild(this.mapSensorRangeUi);
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
      this.parameters.scale = this.parameters.height * this.parameters.zoom / this.parameters.mapSize;

      // recreate with new scale
      this.createMapSensorRangeUi();
    }

    // focus has changed
    if ((state.focus || state.focus == 0) && state.focus != this.parameters.focus) {

      this.predictedPaths = {}; // when we move, remove old lines

      // update setting and position immediately
      this.parameters.focus = state.focus;
      this.focusObjectCoord = this.getFocusCoord();
    }
  }

  getRangesArray() {

    let ranges = [];

    if (this.playerShip) {

      let hullData = this.playerShip.getHullData();
      let p = this.relativeScreenCoord(this.playerShip.physicsObj.position[0], this.playerShip.physicsObj.position[1]);

      // visual range
      let visualRange = hullData.scanRanges[0] * this.parameters.scale;
      if (visualRange) {
        ranges.push({
          x: p.x,
          y: p.y,
          radius: visualRange,
          color: this.parameters.colors.visual,
          alpha: this.parameters.alphas.visual
        })
      }

      // sensor range
      let sensorRange = hullData.scanRanges[1] * this.parameters.scale;
      if (sensorRange) {
        ranges.push({
          x: p.x,
          y: p.y,
          radius: sensorRange,
          color: this.parameters.colors.sensors,
          alpha: this.parameters.alphas.sensors
        })
      }
    }

    return ranges;
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;

    // we get this updated every tick, so redraw here
    this.mapSensorRangeUi.update(this.getRangesArray());
  }

  updateObject(obj, renderer) {

    if (obj.id == this.parameters.focus) {
        this.focusObjectCoord = obj.physicsObj.position;
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

}
