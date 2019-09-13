// pause the game
module.exports = function(game, gameRef, mission, api) {

	let utils = require('./serverUtils.js');

	if (game.state == 'running') {
		// just update the state - the game loop stops itself when state = 'paused'
		utils.updateData(game, gameRef, ['state'], "paused");
	}
}