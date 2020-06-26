import TorpedoAi from './AiScripts/Torpedo';

// ai scripts are stored an UINT8 so we have 0-255 possible scripts,
// which are named here
const scripts = [null, new TorpedoAi()];

let game = null;

export default class Ai {

	constructor(gameEngine) {
        game = gameEngine;
    }

		execute(ship) {

    	// load the AI script for that ship
    	if (ship.aiScript) {
    		let script = scripts[ship.aiScript];
				if (script && script.execute) {
    			script.execute(ship, game);
				}
    	}
    }

		plan(ship) {

			// load the AI script for that ship
			if (ship.aiScript) {
				let script = scripts[ship.aiScript];
				if (script && script.plan) {
					script.plan(ship, game);
				}
			}
		}

}
