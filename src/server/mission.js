// simply default mission for testing
module.exports = {

	// objects for the game
	getObjects: function(api) {

	},

	// create player ships
	getPlayerShips: function(api) {

		// just one to start with
		return [api.createPlayerShip('playerShip', 0, 0, 'Nuisance Value')];
	}


}