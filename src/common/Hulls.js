import {default as Systems} from './Systems';

// bitwise stuff
const systems = new Systems();
const STANDARD_SYSTEMS = systems.getStandardSystems();
const STANDARD_SYSTEMS_LAYOUT = systems.getSystemLayout();

// some reference data for ships we can use in game
export default {

	"spacebug": {
		name: 'Spacebug',
		image: 'assets/spacebug.png',
		size: 300, // used for height
		width: 0.78313253, // ratio to height
		mass: 0.012,
		thrust: 0.05,
		maneuver: 1.2,
		enginePositions: [[0.3, 0.5, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		pdc: {
			range: 4000,
			size: 1000
		},
		fuel: 10000,
		tubes: 2,
		systems: STANDARD_SYSTEMS, // this is a bit encoded set of valid systems that CAN BE damaged
		systemLayout: STANDARD_SYSTEMS_LAYOUT
	},

	"tug": {
		name: 'Tug',
		image: 'assets/ship.png',
		size: 280, // used for height
		width: 1, // ratio to height
		mass: 0.014,
		thrust: 0.045,
		maneuver: 1.4,
		enginePositions: [[0.2, 0.35, 0.9], [0.2, 0.65, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust', // or exhaustflame
		fuel: 10000,
		tubes: 1,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT
	},

	"torpedo": {
		name: 'Torpedo',
		image: 'assets/torpedo.png',
		size: 100, // used for height (artificially big so they show up!!)
		width: 0.1875, // ratio to height
		mass: 0.0001,
		thrust: 2,
		enginePositions: [[3, 0.5, 1.0]],// [scale, %x, %y] // also artificially big
		exhaustImage: 'exhaustflame', // or exhaust
		damage: 0, // has no systems to damage (although should never get checked)
		fuel: 100,
		payload: 600, // equivalent acceleration for damage
		maxClosing: 1000,
		types: [ // allow different torps to override any of these - image, size, exhaust
      {
        fuel: 100,
        payload: 100,
        thrust: 2,
        maxClosing: 100,
        name: "Type I",
				desc: "Some info about this torp"
      },
      {
        fuel: 100,
        payload: 1000,
        thrust: 4,
        maxClosing: 100,
				name: "Type II",
				desc: "Some info about this torp"
      }
		]
	},

	"bushido": {
		name: 'Bushido',
		image: 'assets/bushido.png',
		size: 300, // used for height
		width: 0.93, // ratio to height
		mass: 0.012,
		thrust: 0.05,
		maneuver: 1.2,
		enginePositions: [[0.3, 0.5, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		pdc: {
			range: 4000,
			size: 1000
		},
		fuel: 10000,
		tubes: 4,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT
	},

	"blockade-runner": {
		name: 'Blockade Runner',
		image: 'assets/blockade-runner.png',
		size: 440, // used for height
		width: 0.53, // ratio to height
		mass: 0.008,
		thrust: 0.07,
		maneuver: 0.8,
		enginePositions: [[0.25, 0.1, 0.9], [0.25, 0.9, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust', // or exhaustflame
		pdc: {
			range: 5000,
			size: 800
		},
		fuel: 10000,
		tubes: 2,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT
	},

	"station": {
		name: 'Station',
		image: 'assets/station.png',
		size: 560, // used for height
		width: 1.07, // ratio to height
		thrust: 0,
		maneuver: 0,
		mass: 0.1,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		fuel: 10000,
		dockable: true
	}
}
