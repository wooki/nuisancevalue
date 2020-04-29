import {default as GameDamage} from './Damage';

// bitwise stuff
const gd = new GameDamage();
const STANDARD_SYSTEMS = gd.HELM_CONSOLE_INTERFERENCE |
													gd.NAV_CONSOLE_INTERFERENCE |
													gd.SIGNALS_CONSOLE_INTERFERENCE |
													gd.ENGINE_OFFLINE |
													gd.MANEUVER_OFFLINE;

// some reference data for ships we can use in game
export default {

	"tug": {
		name: 'Tug',
		image: 'assets/ship.png',
		size: 100, // used for height
		width: 1, // ratio to height
		mass: 0.011,
		thrust: 0.04,
		maneuver: 1.4,
		enginePositions: [[0.2, 0.4, 0.9], [0.2, 0.6, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust', // or exhaustflame
		damage: STANDARD_SYSTEMS
	},

	"bushido": {
		name: 'Bushido',
		image: 'assets/bushido.png',
		size: 120, // used for height
		width: 0.93, // ratio to height
		mass: 0.012,
		thrust: 0.05,
		maneuver: 1.2,
		enginePositions: [[0.4, 0.5, 0.8]],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		damage: STANDARD_SYSTEMS // this is a bit encoded set of valid systems that CAN BE damaged
	},

	"blockade-runner": {
		name: 'Blockade Runner',
		image: 'assets/blockade-runner.png',
		size: 200, // used for height
		width: 0.53, // ratio to height
		mass: 0.008,
		thrust: 0.07,
		maneuver: 0.8,
		enginePositions: [[0.25, 0.1, 0.9], [0.25, 0.9, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust', // or exhaustflame
		damage: STANDARD_SYSTEMS
	},

	"station": {
		name: 'Station',
		image: 'assets/station.png',
		size: 280, // used for height
		width: 1.07, // ratio to height
		thrust: 0,
		maneuver: 0,
		mass: 0.1,
		damage: STANDARD_SYSTEMS
	}
}
