const Assets = require('./images.js');
const Hulls = require('../../../common/Hulls');

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
          mapObjects[guid] = null;
          sprites[guid] = null;
      }
  }

}
