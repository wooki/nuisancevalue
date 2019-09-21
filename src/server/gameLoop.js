const PIXI = require('pixi.js');

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

				let collidingObjects = utils.getObjectsWithinRange(obj.x, obj.y, obj.size, objectsMap);
				collidingObjects = collidingObjects.filter(function(cobj) {
					return obj.guid != cobj.guid;
				});
				if (collidingObjects.length > 0) {
					if (collisions[obj.guid] !== true && !obj.collision) {
						console.log("collision: "+obj.guid);
						console.log("(!obj.collision): "+(!obj.collision));
						console.log("collisions[obj.guid]: "+(collisions[obj.guid]));
						console.dir(collisions);
						collidingObjects.forEach(function(cobj) {
							let cVectors = utils.collisionVectors(obj, cobj);
							obj.dX = cVectors.v1.x;
							obj.dY = cVectors.v1.y;
							obj.collision = cobj.guid;
							cobj.dX = cVectors.v2.x;
							cobj.dY = cVectors.v2.y;
							cobj.collision = obj.guid;
							game.objects[key].collision = obj.guid;
							collisions[obj.guid] = true;
							collisions[cobj.guid] = true;
						});
					}
				} else {
					obj.collision = null;
				}

			// *** WRITE BACK TO DB
			obj.updatedAt = firebase.database.ServerValue.TIMESTAMP;
			utils.updateData(game, gameRef, ['objects', key], obj);

		}); // move, gravity etc.

		// rebuilt (after collisions) (maybe not needed?)
		objectsMap = utils.createObjectsMap(game.objects);


		// read and write stations
		Object.keys(game.stations).forEach((key) => {

			let station = game.stations[key];
			let yourShip = game.objects[station.ship];

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
				utils.updateData(game, gameRef, ['stations', key, 'shipData'], ship);

				// write other objects that this station can see
				let objects = utils.getObjectsWithinRange(ship.x, ship.y, 2000, objectsMap).filter(function(obj) {
					return obj.guid != yourShip.guid;
				});

				utils.updateData(game, gameRef, ['stations', key, 'objects'], objects);
			}

			// update game state, if we need to
			if (game.state != game.stations[key].gameState) {
				utils.updateData(game, gameRef, ['stations', key, 'gameState'], game.state);
			}
		});


		if (game.state == 'running') {
			// window.requestAnimationFrame(update);
			setTimeout(function() {
				update(performance.now());
			}, 200);
		}
	};

	// call itself
	window.requestAnimationFrame(update);
}