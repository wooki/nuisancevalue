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
	},


	// add objects to groups that make it simpler to shortlist objects that are close to each other
	// for hit tests, scans etc.
	createObjectsMap: function(objects) {

		let map = {};
		if (!objects) { return map; }

		// split by 1000x1000 squares
		Object.keys(objects).forEach(function(objKey) {

			let obj = objects[objKey];
			let coords = [];
			coords.push({x: obj.x, y: obj.y});
			coords.push({x: obj.x - obj.size, y: obj.y - obj.size});
			coords.push({x: obj.x - obj.size, y: obj.y});
			coords.push({x: obj.x - obj.size, y: obj.y + obj.size});
			coords.push({x: obj.x + obj.size, y: obj.y - obj.size});
			coords.push({x: obj.x + obj.size, y: obj.y});
			coords.push({x: obj.x + obj.size, y: obj.y + obj.size});
			coords.push({x: obj.x - obj.size, y: obj.y - obj.size});
			coords.push({x: obj.x, y: obj.y - obj.size});
			coords.push({x: obj.x + obj.size, y: obj.y - obj.size});
			coords.push({x: obj.x - obj.size, y: obj.y + obj.size});
			coords.push({x: obj.x, y: obj.y + obj.size});
			coords.push({x: obj.x + obj.size, y: obj.y + obj.size});

			coords.forEach(function(coord) {

				let key = (Math.floor(coord.x / 1000)*1000)+'x'+(Math.floor(coord.y / 1000)*1000);
				if (!map[key]) { map[key] = {}; }

				map[key][obj.guid] = obj;
			});

		});

		return map;
	},

	// get objects within a certain distance of a point,
	// shortlist from objectMap before calculating exact distance
	getObjectsWithinRange: function(x, y, distance, objectsMap) {

		let squares = [];

		// iterate in chunks of a thousand from -/+ distance from xy
		for (let dx = (x - distance); dx <= (x + distance); dx = dx + 1000) {
			for (let dy = (y - distance); dy <= (y + distance); dy = dy + 1000) {

				let key = (Math.floor(dx / 1000)*1000)+'x'+(Math.floor(dy / 1000)*1000);
				if (objectsMap[key]) {
					squares.push(objectsMap[key]);
				}
			}
		}
		// console.dir(squares);

		// merge all of the objects in the squares
		let objects = {};
		squares.forEach(function(square) {
			Object.keys(square).forEach(function(guid) {
				objects[square[guid].guid] = square[guid];
			});
		});

		// calculate the actual distance for each object
		let withinRange = [];
		Object.keys(objects).forEach(function(guid) {

			let obj = objects[guid];
			let dX = Math.abs(x - obj.x);
			let dY = Math.abs(y - obj.y);
			let d = Math.hypot(dX, dY);
			if (d <= distance) {
				withinRange.push(obj);
			}
		});

		return withinRange;
	}



}