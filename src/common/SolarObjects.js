// some reference data for objects we can use in game
// units are...
// diameter km
// mass 10²⁴ kg
// orbit 10⁶ km
// ¹²³⁴⁵⁶⁷⁸⁹⁰
module.exports = {

	// use a formula to scale down
	adjustedDiameter: function(key) {
		return Math.floor(Math.sqrt(this[key].diameter)*10);
	},

	adjustedMass: function(key) {
		// return Math.floor(Math.sqrt(this[key].mass)*100);
		return Math.floor(Math.sqrt(this[key].mass)) * 100000;
	},

	adjustedOrbit: function(key) {
		return Math.floor(Math.sqrt(this[key].orbit)*10);
	},

	Sol: {
		diameter: 1391000,
		mass: 1989100 / 2,
		orbit: 0
	},

	Earth: {
		diameter: 12756,
		mass: 5.97,
		orbit: 149.6 * Math.pow(10, 6)
	},

	Jupiter: {
		diameter: 142984,
		mass: 1898,
		orbit: 778.6 * Math.pow(10, 6)
	},

	Neptune: {
		diameter: 49528,
		mass: 102,
		orbit: 4495.1 * Math.pow(10, 6)
	}

}
