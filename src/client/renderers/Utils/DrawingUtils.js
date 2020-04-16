const Assets = require('./images.js');
const Hulls = require('../../../common/Hulls');

// common functions used across multiple stations
module.exports = {

  // iterate all our assets in the images
	loadAllAssets: function(loader, baseUrl) {

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
  }

}
