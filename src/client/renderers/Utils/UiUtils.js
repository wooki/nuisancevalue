const PIXI = require('pixi.js');

import Assets from './images.js';
import Hulls from '../../../common/Hulls';
import Victor from 'victor';
import SolarObjects from '../../../common/SolarObjects';
import Utils from '../../../common/Utils/Utils';

// common functions used across multiple stations
export default {

  // iterate all our assets in the images, returns count of assets
	loadAllAssets(loader, baseUrl) {

		let count = 0;

    // load from assets
    Object.keys(Assets.Images).forEach(function(key) {
				count = count + 1;
				if (Assets.Images[key].endsWith('.json')) count = count + 1;
        loader.add(baseUrl+Assets.Images[key]);
    });

    // load for all Hulls
    for (let [hullKey, hullData] of Object.entries(Hulls)) {
			count = count + 1;
			if (hullData.image.endsWith('.json')) count = count + 1;
			loader.add(baseUrl+hullData.image);
    }

		return count;
  },

	// // build some caches of sprites
	// loadedAssets(loader, resources) {
	//
	// 	// cache explosions
	// 	explosionCache.push(this.createExplosion(resources));
	// 	explosionCache.push(this.createExplosion(resources));
	// 	explosionCache.push(this.createExplosion(resources));
	//
	// },
	//
	// createExplosion(resources) {
	// 	console.log("createExplosion");
	// 	// create explosion sprite
	// 	let explosionSheet = resources['/assets/explosion.json'].spritesheet;
	// 	let explosion = new PIXI.AnimatedSprite(explosionSheet.animations['explosion']);
	// 	explosion.anchor.set(0.5);
	// 	explosion.loop = false;
	// 	return explosion;
	// },
	//
	// addExplosion(resources, pixiContainer, width, height, x, y, zIndex) {
	//
	// 	// get from cache (or create)
	// 	let explosion = explosionCache.pop();
	// 	if (!explosion) explosion = this.createExplosion(resources);
	// 	explosion.x = x;
	// 	explosion.y = y;
	// 	explosion.width = width;
	// 	explosion.height = height;
	// 	explosion.play();
	// 	explosion.onComplete = function() {
	// 		pixiContainer.removeChild(explosion);
	// 		explosionCache.push(explosion);
	// 	};
	// 	explosion.zIndex = zIndex;
	// 	pixiContainer.addChild(explosion);
	// 	// return explosion;
	// },
	//
	addExplosion(explosionSheet, pixiContainer, width, height, x, y, zIndex) {

		// create explosion sprite
		let explosion = new PIXI.AnimatedSprite(explosionSheet.animations['explosion']);
		explosion.x = x;
		explosion.y = y;
		explosion.width = width;
		explosion.height = height;
		explosion.anchor.set(0.5);
		explosion.loop = false;
		explosion.play();
		explosion.onComplete = function() {
			explosion.destroy();
		}.bind(this);
		explosion.zIndex = zIndex;
		pixiContainer.addChild(explosion);
		return explosion;
	},

	addPDC(explosionSheet, pixiContainer, x, y, area, explosionSize, numberPerSecond, scale, minSize, zIndex) {

		console.warn("DEPRICATED: UiUtils.addPDC");

		let useSize = this.getUseSize(scale, explosionSize, explosionSize, 0.01, minSize);

		// recuce below 1 per frame by statisticallyadjusting
		const frameRate = 1/60;
		const number = 1/numberPerSecond;
		const chance = frameRate / number;

		// create a position a random distance from the x,y and a random rotation
		for (let i = 0; i < number; i++) {

			if (Math.random() < chance) {
				let offset = (Math.random()*area*scale);
				let explosionCoord = new Victor(0, offset);
				explosionCoord = explosionCoord.rotateDeg(Math.random()*360);
				explosionCoord = explosionCoord.add(new Victor(x, y));


				this.addExplosion(explosionSheet,
					pixiContainer,
					useSize.useWidth, useSize.useHeight,
					explosionCoord.x, explosionCoord.y, zIndex);
			}
		}
	},

	leaveTimer(message, rootEl) {

		let p = new Promise(function(resolve, reject) {

		let uiDestroyed = document.createElement("div");
		uiDestroyed.classList.add('ui-leaving');
		uiDestroyed.innerHTML = "<div>"+message+"</div>";
		let root = document.getElementById('game');
		rootEl.append(uiDestroyed);
		let leaveTimer = 10;
		let countDown = function() {
			uiDestroyed.innerHTML = "<div>"+leaveTimer+"</div>";
			leaveTimer = leaveTimer - 1;
			if (leaveTimer < 0) {
				resolve();
			} else {
				setTimeout(() => {
					countDown();
				}, 1000);
			}
		};

		// go back to the lobby after a bit
		setTimeout(() => {
				countDown();
			}, 3000);
		});

		return p;
	},

  getUseSize(scale, width, height, minimumScale, minimumSize) {

		console.warn("DEPRICATED: UiUtils.getUseSize");

      let useScale = scale;
      if (useScale < minimumScale) {
          useScale = minimumScale;
      }

      let useWidth = Math.floor(width * useScale);
      let useHeight = Math.floor(height * useScale);

      // ensure ONE of the dimensions is larger than minimum size (but no need for both)
      if (useWidth > useHeight) {
      	// use width (if needed)
      	if (useWidth < minimumSize) {
      		let ratio = minimumSize / width;
      		useWidth = minimumSize;
      		useHeight = height * ratio;
      	}
      } else {
  		// use height (if needed)
      	if (useHeight < minimumSize) {
      		let ratio = minimumSize / height;
      		useHeight = minimumSize;
      		useWidth = width * ratio;
      	}
	  }
      // if (useHeight < minimumSize) { useHeight = minimumSize; }

      return {
          useWidth: useWidth,
          useHeight: useHeight
      };
  },

  createElement(document, tag, id, classes, innerHTML, onClick) {

		console.warn("DEPRICATED: UiUtils.createElement");

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

		console.warn("DEPRICATED: UiUtils.addElement");

      let el = this.createElement(document, tag, id, classes, innerHTML, onClick);
      container.append(el);
      return el;
  },

  setSizes(settings, window, gridSize) {

			console.warn("DEPRICATED: UiUtils.setSizes");

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

	// update settings with recalcuated scale
	setZoom(settings, gridSize, zoom) {

		console.warn("DEPRICATED: UiUtils.setZoom");

		settings.zoom = zoom;
		settings.scale = (settings.narrowUi / settings.mapSize) * zoom;
		settings.gridSize = Math.floor(gridSize * settings.scale);
	},


	removeFromMap(mapObjects, sprites, guid) {

		console.warn("DEPRICATED: UiUtils.removeFromMap");

			if (mapObjects[guid]) {
					mapObjects[guid].destroy();
					delete mapObjects[guid];
					delete sprites[guid];
			}
	},

	// convert a game coord to the coord on screen ie. relative to the player ship in the centre
	relativeScreenCoord(x, y, focusX, focusY, screenWidth, screenHeight, angle, scale) {

		console.warn("DEPRICATED: UiUtils.relativeScreenCoord");

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

	// convert an array of points
	relativeScreenCoords(points, focusX, focusY, screenWidth, screenHeight, angle, scale) {

		console.warn("DEPRICATED: UiUtils.relativeScreenCoords");

		let convertedPoints = [];
		if (points) {
			points.forEach(function(p) {
				let x = p.x;
				let y = p.y;
				if (x === undefined) { x = p[0]; }
				if (y === undefined) { y = p[1]; }

				convertedPoints.push(this.relativeScreenCoord(x, y, focusX, focusY, screenWidth, screenHeight, angle, scale));

			}.bind(this));
		}
		return convertedPoints;
	},

	// update includes scaling of offset, so nothing else should scale (except size) of player ship
	// additional objects position will need to be scaled (player ship is always centre)
	updateGrid(settings, sprites, x, y) {

		console.warn("DEPRICATED: UiUtils.updateGrid");

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

		console.warn("DEPRICATED: UiUtils.radiansToDegrees");

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

		console.warn("DEPRICATED: UiUtils.helmDataItem");


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

		console.warn("DEPRICATED: UiUtils.helmDataItems");


    let el = document.createElement('div');
    el.classList.add('ui-container');
    el.classList.add('helm');
    el.classList.add('right');

    items.forEach(function(item) {
      el.append(this.helmDataItem(item));
    }.bind(this));

    return el;
  },

	predictPath(obj, s, predictionsPerSecond) {
		return Utils.predictPath(obj, s, predictionsPerSecond);
	}

}
