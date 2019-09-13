// utils for managing the game state
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
	  var pi = Math.PI;
	  return degrees * (pi/180);
	},

	// guid used for station ids and unique ids for ships and objects
	generateGuid: function() {

		let S4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		}
		guid = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
		return guid;
	}



}