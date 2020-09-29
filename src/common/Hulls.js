import {default as Systems} from './Systems';

// bitwise stuff
const systems = new Systems();
const STANDARD_SYSTEMS = systems.getStandardSystems();
const STANDARD_SYSTEMS_LAYOUT = systems.getSystemLayout();

// some reference data for ships we can use in game
export default {

	"frigate": {
		name: 'Frigate',
		image: 'assets/frigate.png',
		size: 800, // used for height
		width: 0.4823, // ratio to height
		mass: 0.08,
		thrust: 0.5,
		maneuver: 3,
		damage: 2600,
		enginePositions: [[0.15, 0.21, 1.4], [0.15, 0.79, 1.4]],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		pdc: {
			range: 6000,
			size: 1400,
			rotationRate: 0.015
		},
		dockable: true,
		fuel: 40000,
		tubes: 8,
		systems: STANDARD_SYSTEMS, // this is a bit encoded set of valid systems that CAN BE damaged
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		maxWeaponStock: [6000, 80, 40],
		defaultWeaponStock: [4000, 60, 20],
		scanRanges: [8000, 120000], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
		ai: { // variables for the AI to behave diferently by hull
			refuel: 0.3, // amount of fuel to add every step
			scan: 0.15, // chance to scan a ship in range every plan (1/s)
			torpedo: {
				range: 70000, // range to fire at
				reload: 16, // ms
				volley: 4 // fire 2 of the 4 tubes, hence reload is half
			}
		}
	},

	"corvette-wreckage": {
		name: 'Corvette Wreckage',
		image: 'assets/corvette-wreckage.png',
		size: 600, // used for height
		width: 0.566, // ratio to height
		mass: 0.06,
		thrust: 0,
		maneuver: 0,
		damage: 1600,
		enginePositions: [],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		dockable: true,
		fuel: 10000,
		tubes: 6,
		systems: STANDARD_SYSTEMS, // this is a bit encoded set of valid systems that CAN BE damaged
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		maxWeaponStock: [6000, 40, 20],
		defaultWeaponStock: [4000, 10, 4],
		scanRanges: [0, 0], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
	},

	"spacebug": {
		name: 'Spacebug',
		image: 'assets/spacebug.png',
		size: 300, // used for height
		width: 0.78313253, // ratio to height
		mass: 0.012,
		thrust: 0.07,
		maneuver: 1.2,
		damage: 1600,
		enginePositions: [[0.3, 0.5, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		pdc: {
			range: 4000,
			size: 1000,
			rotationRate: 0.02
		},
		fuel: 10000,
		tubes: 2,
		systems: STANDARD_SYSTEMS, // this is a bit encoded set of valid systems that CAN BE damaged
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		maxWeaponStock: [3000, 20, 20],
		defaultWeaponStock: [1000, 12, 6],
		scanRanges: [6000, 100000], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
		ai: { // variables for the AI to behave diferently by hull
			refuel: 0.5, // amount of fuel to add every step
			scan: 0.15, // chance to scan a ship in range every plan (1/s)
			torpedo: {
				range: 60000, // range to fire at
				reload: 10, // ms
				volley: 2 // fire 2 of the 4 tubes, hence reload is half
			}
		}
	},

	"tug": {
		name: 'Tug',
		image: 'assets/ship.png',
		size: 280, // used for height
		width: 1, // ratio to height
		mass: 0.014,
		thrust: 0.05,
		maneuver: 1.4,
		damage: 1300,
		enginePositions: [[0.2, 0.35, 0.9], [0.2, 0.65, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust', // or exhaustflame
		fuel: 10000,
		tubes: 1,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		maxWeaponStock: [0, 10, 10],
		defaultWeaponStock: [0, 10, 10],
		scanRanges: [6000, 60000], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
		ai: { // variables for the AI to behave diferently by hull
			refuel: 0.5,
			scan: 0.7, // chance to scan a ship in range every plan (1/s)
			torpedo: {
				range: 40000, // range to fire at
				reload: 36, // ms
				volley: 1 // fire 2 of the 4 tubes, hence reload is half
			}
		}
	},

	"bushido": {
		name: 'Bushido',
		image: 'assets/bushido.png',
		size: 300, // used for height
		width: 0.93, // ratio to height
		mass: 0.012,
		thrust: 0.07,
		maneuver: 1.2,
		damage: 1800,
		enginePositions: [[0.3, 0.5, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust',
		pdc: {
			range: 4000,
			size: 1000,
			rotationRate: 0.02
		},
		fuel: 10000,
		tubes: 4,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		maxWeaponStock: [3000, 20, 20],
		defaultWeaponStock: [1000, 12, 6],
		scanRanges: [6000, 140000], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
		ai: { // variables for the AI to behave diferently by hull
			refuel: 0.5,
			scan: 0.16, // chance to scan a ship in range every plan (1/s)
			torpedo: {
				range: 60000, // range to fire at
				reload: 7, // ms
				volley: 2 // fire 2 of the 4 tubes, hence reload is half
			}
		}
	},

	"blockade-runner": {
		name: 'Blockade Runner',
		image: 'assets/blockade-runner.png',
		size: 440, // used for height
		width: 0.53, // ratio to height
		mass: 0.008,
		thrust: 0.07,
		maneuver: 0.8,
		damage: 1600,
		enginePositions: [[0.25, 0.1, 0.9], [0.25, 0.9, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust', // or exhaustflame
		pdc: {
			range: 5000,
			size: 800,
			rotationRate: 0.02
		},
		fuel: 10000,
		tubes: 2,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		maxWeaponStock: [2000, 12, 12],
		defaultWeaponStock: [1000, 8, 4],
		scanRanges: [5000, 100000], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
		ai: { // variables for the AI to behave diferently by hull
			refuel: 0.5,
			scan: 0.17, // chance to scan a ship in range every plan (1/s)
			torpedo: {
				range: 70000, // range to fire at
				reload: 10, // ms
				volley: 2 // fire 2 of the 4 tubes, hence reload is half
			}
		}
	},

	"station": {
		name: 'Station',
		image: 'assets/station.png',
		size: 560, // used for height
		width: 1.07, // ratio to height
		thrust: 0.1,
		maneuver: 0.4,
		mass: 0.1,
		damage: 2500,
		systems: STANDARD_SYSTEMS,
		systemLayout: STANDARD_SYSTEMS_LAYOUT,
		fuel: 10000,
		tubes: 1,
		dockable: true,
		scanRanges: [10000, 100000], // visual, sensor: visual=auto scan, sensor=can see bogey (scannable)
		ai: { // variables for the AI to behave diferently by hull
			refuel: 0.1,
			scan: 0.05, // chance to scan a ship in range every plan (1/s)
			torpedo: {
				range: 30000, // range to fire at
				reload: 36, // ms
				volley: 1 // fire 2 of the 4 tubes, hence reload is half
			}
		}
	},

	"torpedo": {
		name: 'Torpedo',
		image: 'assets/torpedo.png',
		size: 30, // used for height (artificially big so they show up!!)
		width: 0.1875, // ratio to height
		mass: 0.0001,
		thrust: 1.6,
		maneuver: 0.02,
		enginePositions: [[2, 0.5, 1.0]],// [scale, %x, %y] // also artificially big
		exhaustImage: 'exhaustflame', // or exhaust
		damage: 0, // has no systems to damage (although should never get checked)
		fuel: 40,
		payload: 400, // equivalent acceleration for damage
		maxClosing: 4000,
		scanRanges: [0, 10000], // visual, sensor: visual=auto scan
		types: [ // allow different torps to override any of these - image, size, exhaust
      {
        name: "Type I",
				desc: "Standard and reliable"
      },
      {
        fuel: 24,
        payload: 800,
        thrust: 2.5,
				maneuver: 0.005,
				maxClosing: 6000,
				name: "Type II",
				desc: "Fast and powerful, but erratic",
				exhaustImage: 'exhaust' // or exhaust
      }
		]
	},
}
