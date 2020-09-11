import TorpedoAi from './AiScripts/Torpedo';
import Traveller from './AiScripts/Traveller';

// ai scripts are stored an UINT8 so we have 0-255 possible scripts,
// which are named here
const scripts = [null, new TorpedoAi(), new Traveller()];

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

		plan(ship, mission) {

			// load the AI script for that ship
			if (ship.aiScript) {
				let script = scripts[ship.aiScript];
				if (script && script.plan) {
					script.plan(ship, mission, game);
				}
			}
		}

		scanned(ship, target, mission) {

			// load the AI script for that ship
			if (ship.aiScript) {
				let script = scripts[ship.aiScript];
				if (script && script.scanned) {
					script.scanned(ship, target, mission, game);
				}
			}
		}

		sensed(ship, target, mission) {

			// load the AI script for that ship
			if (ship.aiScript) {
				let script = scripts[ship.aiScript];
				if (script && script.sensed) {
					script.sensed(ship, target, mission, game);
				}
			}
		}

}
