const Torpedo = require('./AiScripts/Torpedo');

// ai scripts are stored an UINT8 so we have 0-255 possible scripts,
// which are named here
const scripts = [Torpedo];

let game = null;

export default class Ai {

	constructor(gameEngine) {
        game = gameEngine;
    }

    execute(ship) {

    	// load the AI script for that ship
    	if (ship.aiScript || ship.aiScript === 0) {
    		let script = scripts[ship.aiScript];
    		script(ship, game);
    	}
    }

}