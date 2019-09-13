// create the initial game state
module.exports = function(game, gameRef, mission, api) {

	let utils = require('./serverUtils.js');

	// set-up the game data in firebase
	utils.updateData(game, gameRef, ['stations'], {});
	utils.updateData(game, gameRef, ['objects'], {});

	// add stuff according to mission
	let objects = mission.getObjects(api) || [];
	objects.forEach((obj) => {

		// validate?

		api.addObject(obj);
	});

	// create stations for player ships and watch for changes
	let playerShips = mission.getPlayerShips(api) || [];
	playerShips.forEach((playerShip) => {

		// validate?

		// add to objects
		api.addPlayerShip(playerShip);
	});


	// move to paused state
	utils.updateData(game, gameRef, ['state'], "paused");
}


// example game data
// {
// 	host: "Jim",
// 	hostId: "gNr7Iy2dqEMsiuqhj7WF7ni5VBX2",
// 	name: "Some Game",
// 	state: "initialise",
// 	stations: {
// 		someGuid: {
// 			ship: "playerShip1",
// 			type: 'protoype',
// 			claimed: 'playerId'
// 		}
// 	},
// 	objects: {
// 		planet1: {
// 			x: 0,
// 			y: 0,
// 			gravity: 100,
// 			size: 100
// 			color: '#red',
// 			name: 'Red Planet'
// 		},
// 		playerShip1: {
// 			x: 1000,
// 			y: 1000,
// 			name: 'Player Ship'
// 		}
// 	}
// }
