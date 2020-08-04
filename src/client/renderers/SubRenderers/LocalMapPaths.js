const PIXI = require('pixi.js');

import HelmPathUi from '../Utils/HelmPathUi';
import UiUtils from '../Utils/UiUtils';
import Assets from '../Utils/images';
import Ship from '../../../common/Ship';
import Torpedo from '../../../common/Torpedo';
import Asteroid from '../../../common/Asteroid';
import Planet from '../../../common/Planet';
import Victor from 'victor';

export default class LocalMapPaths {

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
      predictTime: 60,
      trackObjects: true,
      relativeToGravity: true,
      focus: "player", // "player", [0,0], 0 = "the players ship, a coord, an object id"
      shape: "circle", // or "rectangle"
      colors: {
        gravity: 0x3333FF,
        heading: 0x00FF00,
        // waypoint: 0xFFFF00,
        target: 0x00FFFF,
        other: 0xCCCCCC
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

    // keep a reference to the objects we are tracking and turn into array when we update
    this.predictedPaths = {};
    this.createHelmPathUi();
  }

  createHelmPathUi() {

    if (this.helmPathUi) {
      this.mapContainer.removeChild(this.helmPathUi);
      this.helmPathUi.destroy();
      this.helmPathUi = null;
    }

    // create a helmPathUi to draw the paths that we'll add/update later
    this.helmPathUi = new HelmPathUi({
          uiSize: this.parameters.height,
          uiWidth: this.parameters.width,
          uiHeight: this.parameters.height,
          scale: this.parameters.scale,
          zIndex: 1,
          paths: this.getPredictedPathsArray()
      });
      this.mapContainer.addChild(this.helmPathUi);
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
      this.createHelmPathUi();
    }

    // focus has changed
    if ((state.focus || state.focus == 0) && state.focus != this.parameters.focus) {

      this.predictedPaths = {}; // when we move, remove old lines

      // update setting and position immediately
      this.parameters.focus = state.focus;
      this.focusObjectCoord = this.getFocusCoord();
    }
  }

  // predictedPaths is an object keyed with the id of objects we follow so
  // we can maintain a list, this turns that back into a simple array
  getPredictedPathsArray() {
    return Object.keys(this.predictedPaths).map((key) => {
      return this.predictedPaths[key];
    });
  }

  updateObject(obj, renderer) {

    if (obj.id == this.parameters.focus) {
        this.focusObjectCoord = obj.physicsObj.position;
    }

    if (this.parameters.trackObjects) {
      // decide if we want to plot it's path
      if (obj instanceof Ship ||
          obj instanceof Planet ||
          obj instanceof Asteroid ||
          obj instanceof Torpedo) {

        // check if object is on the map
        let distance = Math.abs(Victor.fromArray(this.getFocusCoord()).subtract(Victor.fromArray(obj.physicsObj.position)).magnitude());
        if (obj instanceof Planet || distance < Math.min(100000, (this.parameters.mapSize / this.parameters.zoom)/2)) { // max 100000 range

          // predict object path and adjust to gravity path
          let predictedPath = UiUtils.predictPath(obj, this.parameters.predictTime);

          // adjust our path to be relative to our gravity
          if (this.parameters.relativeToGravity && this.predictedPaths.gravity && this.predictedPaths.gravity.path) {
              predictedPath = this.makeRelativePath(predictedPath, this.predictedPaths.gravity.path);
          }

          this.predictedPaths['object'+obj.id] = {
            color: this.parameters.colors.other,
            points: this.relativeScreenCoords(predictedPath)
          };
        } else {
          // remove it
          delete this.predictedPaths['object'+obj.id];
        }
      }
    }
  }

  removeObject(key, renderer) {

    // if we're tracking that object remove it's path
    if (this.predictedPaths['object'+key]) {
      delete this.predictedPaths['object'+key];
    }
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;

    // plot the path of our gravity object if there is one
    let predictedGravityPath = null;
    if (this.parameters.relativeToGravity && playerShip.gravityData && playerShip.gravityData.direction) {
      predictedGravityPath = UiUtils.predictPath({
        physicsObj: {
          position: playerShip.gravityData.source,
          velocity: playerShip.gravityData.velocity,
          mass: playerShip.gravityData.mass
        }
      }, this.parameters.predictTime);

      this.predictedPaths.gravity = {
        color: this.parameters.colors.gravity,
        points: this.relativeScreenCoords(predictedGravityPath),
        path: predictedGravityPath // used for adjusting other paths
      };
    } else {
      delete this.predictedPaths.gravity;
    }

    // always plot your own ships path and adjust to gravity path
    let ourPredictedPath = UiUtils.predictPath(playerShip, this.parameters.predictTime);

    // adjust our path to be relative to our gravity
    if (this.parameters.relativeToGravity && predictedGravityPath) {
      ourPredictedPath = this.makeRelativePath(ourPredictedPath, predictedGravityPath);
    }

    this.predictedPaths.playerShip = {
      color: this.parameters.colors.heading,
      points: this.relativeScreenCoords(ourPredictedPath)
    };

    // we get this updated every tick, so redraw here
    this.helmPathUi.update(this.getPredictedPathsArray());
  }

  makeRelativePath(relativePath, relativeToPath) {

    let adjustedPath = [];
    let currentPosition = Victor.fromObject(relativeToPath[0]);
    for (let pathIndex = 0; pathIndex < relativePath.length; pathIndex++) {
      // subtract the difference from the grav objects current position from position at same step
      let delta = relativeToPath[pathIndex].clone().subtract(currentPosition);
      adjustedPath[pathIndex] = relativePath[pathIndex].clone().subtract(delta);
    }
    return adjustedPath;
  }

  relativeScreenCoord(x, y) {

      const focus = this.getFocusCoord();
      const focusX = focus[0];
      const focusY = focus[1];

      let matrix = new PIXI.Matrix();
			matrix.translate(x, y);
			matrix.translate(0 - focusX, 0 - focusY);

      // take off the difference between player position and focus position
      // matrix.translate(0 - focusX, 0 - focusY);

			matrix.scale(this.parameters.scale, this.parameters.scale);
			matrix.translate(this.centerX, this.centerY);
			let p = new PIXI.Point(0, 0);
			p = matrix.apply(p);

			return p;
	}

  relativeScreenCoords(points) {
		let convertedPoints = [];
		if (points) {
			points.forEach(function(p) {
				let x = p.x;
				let y = p.y;
				if (x === undefined) { x = p[0]; }
				if (y === undefined) { y = p[1]; }

				convertedPoints.push(this.relativeScreenCoord(x, y));

			}.bind(this));
		}
		return convertedPoints;
	}


}
