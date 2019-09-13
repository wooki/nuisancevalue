// unpause the game
module.exports = function(game, gameRef, mission, api, server) {

	let utils = require('./serverUtils.js');

	if (game.state == 'paused') {
		// update the state and start the game loop
		utils.updateData(game, gameRef, ['state'], "running");

		// start the gameLoop
		server.gameLoop(game, gameRef, mission, api);
	}
}