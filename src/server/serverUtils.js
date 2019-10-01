let Victor = require('victor');

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

			// THIS NEEDS TO ITERATE IN THOUSANDS TO GET ALL POSSIBLE COORDS!!
			for (let dx = (obj.x - obj.size); dx <= (obj.x + obj.size); dx = dx + 1000) {
				for (let dy = (obj.y - obj.size); dy <= (obj.y + obj.size); dy = dy + 1000) {
					coords.push({x: dx, y: dy});
				}
			}

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

		// merge all of the objects in the squares
		let objects = {};
		squares.forEach(function(square) {
			Object.keys(square).forEach(function(guid) {
				objects[square[guid].guid] = square[guid];
			});
		});

		// calculate the actual distance for each object
		let withinRange = [];
		let withinRangeHash = {}; // so we don't re-do calculations for stuff already found to be in range
		Object.keys(objects).forEach(function(guid) {

			if (withinRangeHash[guid] === undefined) {
				let obj = objects[guid];
				let dX = Math.abs(x - obj.x);
				let dY = Math.abs(y - obj.y);
				let d = Math.hypot(dX, dY);
				if (d <= (distance + (obj.size/2))) {
					withinRange.push(obj);
					withinRangeHash[guid] = true;
				}
			}
		});

		return withinRange;
	},

	// calculate the new vectors for two colliding objects,
	// method from here, thanls Chad Berchek! https://vobarian.com/collisions/
	// objects require dX, dY, mass
	// doesn't set the vectors - just returns them
	collisionVectors: function(obj1, obj2) {

		let v1 = new Victor((obj1.dX || 0), (obj1.dY || 0));
		let v2 = new Victor((obj2.dX || 0), (obj2.dY || 0));

		let normalVector = new Victor((v1.x - v2.x), (v1.y - v2.y));
		let unitNormalVector = normalVector.clone().norm();

		let unitTangentVector = new Victor(-1 * unitNormalVector.y, unitNormalVector.x);

		let v1n = unitNormalVector.dot(v1);
		let v2n = unitNormalVector.dot(v2);

		let v1t = unitTangentVector.dot(v1);
		let v2t = unitTangentVector.dot(v2);

		let _v1t = v1t;
		let _v2t = v2t;

		let _v1n = ((v1n * (obj1.mass - obj2.mass)) + (2 * obj2.mass * v2n)) / (obj1.mass + obj2.mass);
		let _v2n = ((v2n * (obj2.mass - obj1.mass)) + (2 * obj1.mass * v1n)) / (obj1.mass + obj2.mass);

		_v1n = new Victor(_v1n * unitNormalVector.x, _v1n * unitNormalVector.y);
		_v2n = new Victor(_v2n * unitNormalVector.x, _v2n * unitNormalVector.y);

		_v1t = new Victor(_v1t * unitNormalVector.x, _v1t * unitNormalVector.y);
		_v2t = new Victor(_v2t * unitNormalVector.x, _v2t * unitNormalVector.y);

		let _v1 = _v1n.add(_v1t);
		let _v2 = _v2n.add(_v2t);

		return {
			v1: _v1,
			v2: _v2
		}
	}



}