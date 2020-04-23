const Assets = require('./images.js');
const Hulls = require('../../../common/Hulls');
const PIXI = require('pixi.js');
const Victor = require('victor');

// common functions used across multiple stations
module.exports = {

  // iterate all our assets in the images
	loadAllAssets(loader, baseUrl) {

    // load from assets
    Object.keys(Assets.Images).forEach(function(key) {
        loader.add(baseUrl+Assets.Images[key]);
    });

    // load for all Hulls
    for (let [hullKey, hullData] of Object.entries(Hulls)) {
        loader.add(baseUrl+hullData.image);
    }
  },

  getUseSize(scale, width, height, minimumScale, minimumSize) {

      let useScale = scale;
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
  },

  createElement(document, tag, id, classes, innerHTML, onClick) {

      let button = document.createElement(tag);
      button.id = id;
      classes.forEach(function(c) {
        button.classList.add(c);
      });

      button.innerHTML = innerHTML;
      if (onClick) {
        button.addEventListener('click', onClick);
      }
      return button;
  },

  addElement(container, document, tag, id, classes, innerHTML, onClick) {
      let el = this.createElement(document, tag, id, classes, innerHTML, onClick);
      container.append(el);
      return el;
  },

  setSizes(settings, window, gridSize) {

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

      // grid is always 1000 but scaled
      settings.gridSize = Math.floor(gridSize * settings.scale);
  },

	removeFromMap(mapObjects, sprites, guid) {
			if (mapObjects[guid]) {
					mapObjects[guid].destroy();
					delete mapObjects[guid];
					delete sprites[guid];
			}
	},

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
	},

	// update includes scaling of offset, so nothing else should scale (except size) of player ship
	// additional objects position will need to be scaled (player ship is always centre)
	updateGrid(settings, sprites, x, y) {
			if (sprites.gridSprite) {
					let positionChange = new PIXI.Point(x * settings.scale, y * settings.scale);
					sprites.gridSprite.tilePosition.x = Math.floor(settings.UiWidth / 2) - (positionChange.x);
					sprites.gridSprite.tilePosition.y = Math.floor(settings.UiHeight / 2) - (positionChange.y);
			}
	},

	// because y axis is flipped, all rotations are 180 off
	adjustAngle(angle) {
      return (angle + Math.PI) % (2 * Math.PI);
  },

  radiansToDegrees(radians) {
      if (radians < 0) {
        return this.radiansToDegrees((radians + (Math.PI*2)));
      } else if (radians > (Math.PI*2)) {
        return this.radiansToDegrees((radians - (Math.PI*2)));
      } else {
        return ((radians + Math.PI) % (2 * Math.PI)) * (180 / Math.PI);
      }
  },

  // UI for a helm item (name, target closing speed etc.)
  helmDataItem(item) {

    let el = document.createElement('div');
    el.classList.add('helm-data-item');

    if (item.type) {
      el.classList.add('type-'+item.type);
    }
    Object.keys(item).forEach(function(key) {
      let line = document.createElement('div');

      if (key == 'type') {
        line.classList.add('LED');
        line.classList.add('type-'+item[key]);
      } else {
        line.classList.add('line');
        let name = document.createElement('label');
        name.innerHTML = key;
        line.append(name);
        let value = document.createElement('data');
        value.innerHTML = item[key];
        line.append(value);
      }

      el.append(line);
    });

    return el;
  },

  // UI for a list of helm items (names, and details)
  helmDataItems(items) {

    let el = document.createElement('div');
    el.classList.add('ui-container');
    el.classList.add('helm');
    el.classList.add('right');

    items.forEach(function(item) {
      el.append(this.helmDataItem(item));
    }.bind(this));

    return el;
  },

	// using the velocity and gravity effecting the object, predict a path
	// for the next s seconds
	predictPath(obj, s) {

		// ignore if we don't have a physicsObj
		if (!obj.physicsObj) {
			return [];
		}

		let predictionsPerSecond = 1;
		let timeStep = (1 / predictionsPerSecond);
		let predictions = [new Victor(obj.physicsObj.position[0], obj.physicsObj.position[1])]; // start at the current position

		// data we may have in obj.gravityData
		//  {
		// 		source: gravSource.physicsObj.position,
		// 		direction: direction,
		// 		amount: gravSourceAmount,
		// 		vector: gravVector,
		// 		mass: gravSource.physicsObj.mass,
		// 		velocity: gravSource.physicsObj.velocity
		// }

		// if we have a gravity source, predict it's path first
		if (obj.gravityData) {
			// let gravitySource

		}

		// keep track of velocity, as that can change with gravity and engine
		let currentVelocity = new Victor(obj.physicsObj.velocity[0], obj.physicsObj.velocity[1]);

		// iterate timeStep for duration
		let currentTime = 0;
		while (currentTime < s) {

			// start 1 timeStep into the future
			currentTime = currentTime + timeStep;

			// start at the previous position
			let lastPrediction = predictions[predictions.length - 1]; // we always have at least one, so no need to check
			let currentPos = lastPrediction.clone();

			// apply engine to velocity
			// TODO: engine

			// apply gravity (from predicted gravity position) to velocity
			// TODO: gravity

			// multiply current velocity to adjust for our step time
			let v = currentVelocity.clone().multiply(new Victor(timeStep, timeStep));

			// apply current velocity
			currentPos = currentPos.add(v);

			// then add
			predictions.push(currentPos);
		}

		// return
		return predictions;
	}



}
