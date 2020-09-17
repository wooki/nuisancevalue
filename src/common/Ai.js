import TorpedoAi from './AiScripts/Torpedo';

// AI Ships - which can switch between themselves as well

// maybe useful to give sensor and firing to ships - maybe their behaviour could
// be static, or set by the mission
import BaseShip from './AiScripts/BaseShip';

// travel from one orbit to another then notify mission script on arrival
import Traveller from './AiScripts/Traveller';

// move to orbit the same object as an object and close with them
// that works for attack/guard and escort
import Hunter from './AiScripts/Hunter';

// possible suggestions
// fighter, move differently in combat?
// dock, move, dock (docking will be hard!)
// one that will run away from a target

// ai scripts are stored an UINT8 so we have 0-255 possible scripts,
// which are named here
const scripts = [null,
								 new TorpedoAi(),
								 new BaseShip(),
								 new Traveller(),
								 new Hunter()
							 ];

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
