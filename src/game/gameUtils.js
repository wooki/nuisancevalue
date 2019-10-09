const PIXI = require('pixi.js');

// utils for managing the client
module.exports = {

	// update local copy of data from a path and then write
	// immediately to firebase
	updateData: function(game, gameRef, path, data) {

		let obj = game;
		let ref = gameRef;

		// gameRef needs to iterate every path
		path.forEach(function(p) {
			ref = ref.child(p);
		});
		ref.set(data);

		// actual data path needs to stop one before
		let last = path.pop();
		path.forEach(function(p) {
			obj = obj[p];
		});
		if (obj[last] != data) { // only update with changes
			obj[last] = data;
		}
	},

	degreesToRadians: function(degrees) {
	  return degrees * (Math.PI/180);
	},

	radiansToDegrees: function(radians) {
	  return radians * (180/Math.PI);
	},

	// add an effect to the scene as specified
	// addEffect: function() {

	// },

	// assuming the camera if focussed on the centre of the app window and we are proivided the coordinates
	// in game of that position then where on screen should the x, y we positioned
	// scale 2 means 1 game units (x, focusX) = 2 screenWidth units
	// scale 0.1 means 10 game units (x, focusX) = 1 screenWidth unit
	relativeScreenCoord: function(x, y, focusX, focusY, screenWidth, screenHeight, angle, scale) {

		let screenX = Math.floor(screenWidth / 2);
		let screenY = Math.floor(screenHeight / 2);

		let matrix = new PIXI.Matrix();
		matrix.translate(x, y);
		matrix.translate(0 - focusX, 0 - focusY);
		matrix.scale(scale, scale);
		matrix.rotate(this.degreesToRadians(angle));
		matrix.translate(screenX, screenY);
		let p = new PIXI.Point(0, 0);
		p = matrix.apply(p);
		return p;
	}



}
