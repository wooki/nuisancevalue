// some reference data for objects we can use in game
// units are...
// diameter km
// mass 10²⁴ kg
// orbit 10⁶ km
// ¹²³⁴⁵⁶⁷⁸⁹⁰
module.exports = {

	units: {
		speed: ' Mm/s',
		distance: ' Mm',
		force: ' N',
		mass: ' kg'
	},

	constants: {
		G: 6.673 * Math.pow(10, -11)
	},

	Sol: {
		// diameter: 1391000,
		// mass: 1989100 * Math.pow(10, 24),
		// orbit: 0
		diameter: Math.sqrt(1391000) * 10,
		mass: Math.sqrt(1989100 / 4000) * Math.pow(10, 18),
		orbit: 0
	},

	Mercury: {
		diameter: Math.sqrt(4879) * 10,
		mass: Math.sqrt(0.33) * Math.pow(10, 18),
		orbit: Math.sqrt(57.9 * Math.pow(10, 6)) * 10
	},

	Venus: {
		diameter: Math.sqrt(12104) * 10,
		mass: Math.sqrt(4.87) * Math.pow(10, 18),
		orbit: Math.sqrt(108.8 * Math.pow(10, 6)) * 10
	},

	Earth: {
		// diameter: 12756,
		// mass: 5.97 * Math.pow(10, 24),
		// orbit: 149.6 * Math.pow(10, 6)
		diameter: Math.sqrt(12756) * 10,
		mass: Math.sqrt(5.97) * Math.pow(10, 18),
		orbit: Math.sqrt(149.6 * Math.pow(10, 6)) * 10
	},

	Mars: {
		// diameter: 12756,
		// mass: 5.97 * Math.pow(10, 24),
		// orbit: 149.6 * Math.pow(10, 6)
		diameter: Math.sqrt(6792) * 10,
		mass: Math.sqrt(0.642) * Math.pow(10, 18),
		orbit: Math.sqrt(227.9 * Math.pow(10, 6)) * 10
	},

	Jupiter: {
		// diameter: 142984,
		// mass: 1898 * Math.pow(10, 8),
		// orbit: 778.6 * Math.pow(10, 6)
		diameter: Math.sqrt(142984) * 10,
		mass: Math.sqrt(1898) * Math.pow(10, 18),
		orbit: Math.sqrt(778.6 * Math.pow(10, 6)) * 10
	},

	Saturn: {
		diameter: Math.sqrt(268000) * 10,
		mass: Math.sqrt(568) * Math.pow(10, 18),
		orbit: Math.sqrt(1433.5 * Math.pow(10, 6)) * 10
	},

	Uranus: {
		diameter: Math.sqrt(51118) * 10,
		mass: Math.sqrt(86.8) * Math.pow(10, 18),
		orbit: Math.sqrt(2872.5 * Math.pow(10, 6)) * 10
	},

	Neptune: {
		diameter: Math.sqrt(49528) * 10,
		mass: Math.sqrt(102) * Math.pow(10, 18),
		orbit: Math.sqrt(4495.1 * Math.pow(10, 6)) * 10
	},

	Pluto: {
		diameter: Math.sqrt(2370) * 10,
		mass: Math.sqrt(0.015) * Math.pow(10, 18),
		orbit: Math.sqrt(5906.4 * Math.pow(10, 6)) * 10
	}

}
