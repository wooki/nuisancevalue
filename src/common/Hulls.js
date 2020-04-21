// some reference data for ships we can use in game
module.exports = {

	"tug": {
		name: 'Tug',
		image: 'assets/ship.png',
		size: 100, // used for height
		width: 1, // ratio to height
		mass: 0.011,
		thrust: 0.04,
		maneuver: 1.4,
		enginePositions: [[0.2, 0.4, 0.9], [0.2, 0.6, 0.9]],// [scale, %x, %y]
		exhaustImage: 'exhaust' // or exhaustflame
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
		exhaustImage: 'exhaust'
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
		exhaustImage: 'exhaust'
	},

	"station": {
		name: 'Station',
		image: 'assets/station.png',
		size: 280, // used for height
		width: 1.07, // ratio to height
		thrust: 0,
		maneuver: 0,
		mass: 0.1
	}
}
