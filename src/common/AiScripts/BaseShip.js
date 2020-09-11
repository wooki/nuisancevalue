import Victor from 'victor';
import Utils from '../Utils/Utils';

// useful baseclass for ships - manages scanning, sensed objects and firing on
// enemies if armed..
// maybe more in the future - e.g. avoid torps
// maybe util methods such as orbit/dock etc
export default class BaseShip {

	// start checking for enemy ship in range and firing
	scanned(ship, target, mission, game) {
		console.log("TODO: BaseShip scanned");
	}

	// start attempting a scan
	sensed(ship, target, mission, game) {
		console.log("TODO: BaseShip sensed");
	}

	// check for scanned enemies and possibly fire
	// attempt scan of sensed objects
	execute(ship, game) {
		// console.log("TODO: BaseShip execute");

	}

};
