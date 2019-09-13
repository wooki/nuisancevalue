// access to server data and utils for missions through a simple
// api - so we don't have to expose the entire data structure
module.exports = function(server, game, gameRef) {

	let utils = require('./serverUtils.js');

	return {

		generateGuid: utils.generateGuid,

		// createPlanet: function(guid, x, y) {

		// },

		// createAsteroid: function(guid, x, y) {

		// },

		createPlayerShip: function(guid, x, y, name) {

			return {
				guid: guid,
				acceleration: 0.00001, // 1 unit per millisecond
				angularAcceleration: 0.005,
				x: x,
				y: y,
				dX: 0,
				dY: 0,
				angle: 0,
				angularVelocity: 0,
				name: name,
				stations: ['prototype']
			};

		},


		addObject: function(obj) {

			utils.updateData(game, gameRef, ['objects', obj.guid], obj);
		},

		addStation: function(station, obj) {

		},

		addPlayerShip: function(playerShip) {

			this.addObject(playerShip);

			// add stations to game
			playerShip.stations.forEach((station) => {

				let newStation = {
					guid: utils.generateGuid(),
					ship: playerShip.guid,
					type: station
				};

				utils.updateData(game, gameRef, ['stations', newStation.guid], newStation);

			});
		}




	}

}