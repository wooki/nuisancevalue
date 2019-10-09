const PIXI = require('pixi.js');
const Victor = require('victor');

// function called to run the server - re-calls itself unless paused
module.exports = function(game, gameRef, mission, api) {

	let utils = require('./serverUtils.js');
	let last_timestamp = 0;
	let stationRefs = {};

	// watch for changes
	gameRef.on("value", (snapshot) => {
		game = snapshot.val();
	});

	let update = function(timestamp) {

		let delta = 0;
		if (last_timestamp > 0) {
			delta = timestamp - last_timestamp;
		}
		last_timestamp = timestamp;

		// create structure to make getting close by objects and hit tests etc. much faster
		let objectsMap = utils.createObjectsMap(game.objects);

		// util for keeping track of ongoing collisions
		let collisions = {};

		// deal with moving and stuff
		Object.keys(game.objects).forEach((key) => {
			// console.log("key:"+key);

			let obj = game.objects[key];

			// *** SHIP SYSTEMS - e.g. engine on will accelerate
			if (obj.engine == "active") {

				// create a vector based on acceleration for delta and angle
				// negative because coords are from top left but we want 0 heading
				// to be NORTH
				let acceleration = new PIXI.Point(0, 0 - (delta * obj.acceleration));
				let accelerationMatrix = new PIXI.Matrix();
				accelerationMatrix.rotate(utils.degreesToRadians(obj.angle));
				acceleration = accelerationMatrix.apply(acceleration);
				obj.dX = obj.dX + acceleration.x;
				obj.dY = obj.dY + acceleration.y;
			}

			// instantly add to angularVelocity then set to inactive
			if (obj.port == "active") {

				obj.angularVelocity = obj.angularVelocity - obj.angularAcceleration;
				obj.port = "inactive";
			}

			if (obj.starboard == "active") {

				obj.angularVelocity = obj.angularVelocity + obj.angularAcceleration;
				obj.starboard = "inactive";
			}

			// *** GRAVITY
			// only check objects within a range of
			// find the biggest pull of gravity on this object and apply it
			let gravSource = null;
			let gravSourceAmount = 0;

			// possible more efficient way of checking (but might be worse - so try it if problems later)
			// let gravityObjects = utils.getObjectsWithinRange(obj.x, obj.y, 100000, objectsMap);
			// gravityObjects.forEach((gravObj) => {

			Object.keys(game.objects).forEach((gravKey) => {
				if (gravKey != obj.guid) {
					let gravObj = game.objects[gravKey];
					if (gravObj.gravity && gravObj.mass >= obj.mass) {

						let d = new Victor(obj.x, obj.y).distance(new Victor(gravObj.x, gravObj.y));
						let g = Math.floor((gravObj.gravity / (d*d)) * 10000000) / 10000000;

						if (g > gravSourceAmount) {
							gravSourceAmount = g;
							gravSource = gravObj;
						}
					}
				}
			});

			if (gravSource) {
				// accelerate towards the gravity source
				let dX = gravSource.x - obj.x;
				let dY = gravSource.y - obj.y;
				let radians = Math.atan2(dX, -1 * dY);
				if (radians < 0) { radians = radians + (2*Math.PI); }

				let acceleration = new PIXI.Point(0, 0 - (delta * gravSourceAmount));
				let accelerationMatrix = new PIXI.Matrix();
				accelerationMatrix.rotate(radians);
				acceleration = accelerationMatrix.apply(acceleration);

				obj.dX = obj.dX + acceleration.x;
				obj.dY = obj.dY + acceleration.y;

				// report on the gravity source
				obj.gavityEffect = {
					x: gravSource.x,
					y: gravSource.y,
					g: gravSourceAmount
				};
			} else {
				obj.gavityEffect = null;
			}


			// *** MOVE
			if ((obj.dX && obj.dX != 0) || (obj.dY && obj.dY != 0)) {

				// apply objects vector to it's position
				obj.x = obj.x + (delta * obj.dX);
				obj.y = obj.y + (delta * obj.dY);
			}

			// *** ROTATE
			if (obj.angularVelocity != 0) {
				obj.angle = (obj.angle + (delta * obj.angularVelocity)) % 360;
			}

			// *** COLLISIONS
			// check every other object to watch for an overlap: do damage AND modify vectors
			// only check collisions when not already colliding
			let collidingObjects = utils.getObjectsWithinRange(obj.x, obj.y, (obj.size/2), objectsMap);
			collidingObjects = collidingObjects.filter(function(cobj) {
				return obj.guid != cobj.guid;
			});
			if (collidingObjects.length > 0) {
				if (collisions[obj.guid] === undefined && obj.collision === undefined) {
					collidingObjects.forEach(function(c) {
						let cobj = game.objects[c.guid];

						// TODO: if one side is a gravity object and the other isn't
						// just detroy it.  Both gravity (or neither) is a collision

						// Immediately move them to be 1+ pixels apart
						// Works but this moves them away directly, not in the direction of
						// the new vector.. worst bit is the jump because of the delay between
						// client and server.  implement this on the client?
						let v1 = new Victor(obj.x, obj.y);
						let v2 = new Victor(cobj.x, cobj.y);
						let v1mixed = v1.clone().mix(v2, (obj.size / (obj.size + cobj.size)));
						let v1diff = v1mixed.clone().subtract(v1);
						let v2mixed = v2.clone().mix(v1, (cobj.size / (obj.size + cobj.size)));
						let v2diff = v2mixed.clone().subtract(v2);

						// until we are destroying non-gravity objects double move the
						// non gravity object
						if (obj.gravity && !cobj.gravity) {
							v2.subtract(v2diff);
							v2.subtract(v2diff);
						} else if (cobj.gravity && !obj.gravity) {
							v1.subtract(v1diff);
							v1.subtract(v1diff);
						} else {
							// neithor or both are gravity
							v1.subtract(v1diff);
							v2.subtract(v2diff);
						}

						obj.x = v1.x;
						obj.y = v1.y;
						cobj.x = v2.x;
						cobj.y = v2.y;

						// work out new vectors
						let cVectors = utils.collisionVectors(obj, cobj);
						obj.dX = cVectors.v1.x;
						obj.dY = cVectors.v1.y;
						cobj.dX = cVectors.v2.x;
						cobj.dY = cVectors.v2.y;

						// shouldn't need this now we move them apart
						obj.collision = cobj.guid;
						cobj.collision = obj.guid;

						// don't check these two objects again this iteration
						collisions[obj.guid] = true;
						collisions[cobj.guid] = true;
					});
				}
			} else {
				obj.collision = null;
			}

			// *** WRITE BACK TO DB
			obj.updatedAt = firebase.database.ServerValue.TIMESTAMP;
			// utils.updateData(game, gameRef, ['objects', key], obj);

		}); // move, gravity etc.

		// update objects in one go
		utils.updateData(game, gameRef, ['objects'], game.objects);

		// rebuilt (after collisions) (maybe not needed?)
		objectsMap = utils.createObjectsMap(game.objects);

		// read and write stations
		Object.keys(game.stations).forEach((key) => {

			let station = game.stations[key];
			let yourShip = game.objects[station.ship];
			let stationData = station.data || {};

			// *** READ STATION CONTROLS (e.g. start/stop ending - but don't apply that to ship vector)
			if (station.type == "prototype") {

				// prototype can fire engine
				if (station.commands && station.commands.engine && station.commands.engine != yourShip.engine) {
					utils.updateData(game, gameRef, ['objects', station.ship, 'engine'], station.commands.engine);
				}

				// prototype can fire port and starboard thrust
				if (station.commands && station.commands.port && station.commands.port != yourShip.port) {
					utils.updateData(game, gameRef, ['objects', station.ship, 'port'], station.commands.port);
					utils.updateData(game, gameRef, ['stations', key, 'commands', 'port'], 'inactive');

				}
				if (station.commands && station.commands.starboard && station.commands.starboard != yourShip.starboard) {
					utils.updateData(game, gameRef, ['objects', station.ship, 'starboard'], station.commands.starboard);
					utils.updateData(game, gameRef, ['stations', key, 'commands', 'starboard'], 'inactive');
				}

			}

			// *** WRITE STATION (e.g. add scanned objects to the map etc.)
			// write own ship data
			// process objetcs that can be seen
			if (station.type == "prototype") {

				// write simple ship details
				let ship = {
					name: yourShip.name || '[no name]',
					x: yourShip.x || 0,
					y: yourShip.y || 0,
					dX: yourShip.dX || 0,
					dY: yourShip.dY || 0,
					angle: yourShip.angle || 0,
					acceleration: yourShip.acceleration || 0,
					updatedAt: yourShip.updatedAt || firebase.database.ServerValue.TIMESTAMP,
					engine: yourShip.engine || 'inactive',
					port: yourShip.port || 'inactive',
					starboard: yourShip.starboard || 'inactive',
					angularVelocity: yourShip.angularVelocity || 0,
					angularAcceleration: yourShip.angularAcceleration || 0,
					size: yourShip.size
				};

				if (yourShip.gavityEffect && yourShip.gavityEffect.g > 0) {
					ship.gavityEffect = yourShip.gavityEffect;
				}

				// utils.updateData(game, gameRef, ['stations', key, 'shipData'], ship);
				stationData.shipData = ship;

				// write other objects that this station can see
				let objects = utils.getObjectsWithinRange(ship.x, ship.y, 4000, objectsMap).filter(function(obj) {
					return obj.guid != yourShip.guid;
				});

				// utils.updateData(game, gameRef, ['stations', key, 'objects'], objects);
				stationData.objects = objects;
			}

			// update game state, if we need to
			if (game.state != game.stations[key].gameState) {
				// utils.updateData(game, gameRef, ['stations', key, 'gameState'], game.state);
				stationData.gameState = game.state;
			}

			// update station in one go
			utils.updateData(game, gameRef, ['stations', key, 'data'], stationData);
		});


		if (game.state == 'running') {
			setTimeout(function() {
				update(performance.now());
			}, 250);
		}
	};

	// call itself
	window.requestAnimationFrame(update);
}
