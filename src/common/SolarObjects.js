const Victor = require('victor');
const DIAMETER_ADJUSTMENT =  10;
const DIAMETER_ADJUSTMENT_SMALL =  4;
const DIAMETER_ADJUSTMENT_BIG =  25;
const ORBIT_ADJUSTMENT = 15;

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
		// mass: ' kg'
		mass: ' aM'
	},

	constants: {
		G: 6.673 * Math.pow(10, -11)
	},

	Sol: {
		// diameter: 1391000,
		// mass: 1989100 * Math.pow(10, 24),
		// orbit: 0
		diameter: Math.sqrt(1391000) * DIAMETER_ADJUSTMENT_BIG,
		mass: Math.sqrt(1989100 / 1000) * Math.pow(10, 18),
		orbit: 0
	},

	Mercury: {
		diameter: Math.sqrt(4879) * DIAMETER_ADJUSTMENT_SMALL,
		mass: Math.sqrt(0.33) * Math.pow(10, 18),
		orbit: Math.sqrt(57.9 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Venus: {
		diameter: Math.sqrt(12104) * DIAMETER_ADJUSTMENT,
		mass: Math.sqrt(4.87) * Math.pow(10, 18),
		orbit: Math.sqrt(108.8 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Earth: {
		// diameter: 12756,
		// mass: 5.97 * Math.pow(10, 24),
		// orbit: 149.6 * Math.pow(10, 6)
		diameter: Math.sqrt(12756) * DIAMETER_ADJUSTMENT,
		mass: Math.sqrt(5.97) * Math.pow(10, 18),
		orbit: Math.sqrt(149.6 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Moon: {
		diameter: Math.sqrt(3476) * DIAMETER_ADJUSTMENT_SMALL,
		mass: Math.sqrt(0.073) * Math.pow(10, 18),
		orbit: Math.sqrt(0.3844 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Mars: {
		// diameter: 12756,
		// mass: 5.97 * Math.pow(10, 24),
		// orbit: 149.6 * Math.pow(10, 6)
		diameter: Math.sqrt(6792) * DIAMETER_ADJUSTMENT,
		mass: Math.sqrt(0.642) * Math.pow(10, 18),
		orbit: Math.sqrt(227.9 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Jupiter: {
		// diameter: 142984,
		// mass: 1898 * Math.pow(10, 8),
		// orbit: 778.6 * Math.pow(10, 6)
		diameter: Math.sqrt(142984) * DIAMETER_ADJUSTMENT_BIG,
		mass: Math.sqrt(1898) * Math.pow(10, 18),
		orbit: Math.sqrt(778.6 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Saturn: {
		diameter: Math.sqrt(268000) * DIAMETER_ADJUSTMENT_BIG,
		mass: Math.sqrt(568) * Math.pow(10, 18),
		orbit: Math.sqrt(1433.5 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Uranus: {
		diameter: Math.sqrt(51118) * DIAMETER_ADJUSTMENT_BIG,
		mass: Math.sqrt(86.8) * Math.pow(10, 18),
		orbit: Math.sqrt(2872.5 * Math.pow(10, 6)) * 10
	},

	Neptune: {
		diameter: Math.sqrt(49528) * DIAMETER_ADJUSTMENT_BIG,
		mass: Math.sqrt(102) * Math.pow(10, 18),
		orbit: Math.sqrt(4495.1 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	Pluto: {
		diameter: Math.sqrt(2370) * DIAMETER_ADJUSTMENT_SMALL,
		mass: Math.sqrt(0.015) * Math.pow(10, 18),
		orbit: Math.sqrt(5906.4 * Math.pow(10, 6)) * ORBIT_ADJUSTMENT
	},

	addStandardPlanet: function(gameEngine, dataName, texture, rotation, fixedGravityId, orbitObj) {

		// let orbitSpeed = Math.sqrt((this.constants.G * this.Sol.mass) / this[dataName].orbit);
		// let position = new Victor(this[dataName].orbit, 0);
		// let velocity = new Victor(0, 0 - orbitSpeed);
		// position = position.rotateDeg(rotation);
		// velocity = velocity.rotateDeg(rotation);
		// return gameEngine.addPlanet({
		// 		x: position.x,
		// 		y: position.y,
		// 		dX: velocity.x,
		// 		dY: velocity.y,
		// 		mass: this[dataName].mass,
		// 		size: this[dataName].diameter,
		// 		angle: Math.random() * 2 * Math.PI,
		// 		angularVelocity: 0,
		// 		texture: texture,
		// 		fixedgravity: fixedGravityId
		// });
		return this.addSatelite(gameEngine, dataName, texture, rotation, fixedGravityId, orbitObj, this[dataName].orbit);
	},

	addSatelite: function(gameEngine, dataName, texture, rotation, fixedGravityId, orbitObj, distance) {

		let orbitDistance = orbitObj.size + distance; // size is diameter so bigger planets have slightly larger orbit
		let orbitSpeed = Math.sqrt((this.constants.G * orbitObj.physicsObj.mass) / orbitDistance);
		let position = new Victor(orbitDistance, 0);
		let velocity = new Victor(0, 0 - orbitSpeed);
		position = position.rotateDeg(rotation);
		velocity = velocity.rotateDeg(rotation);
		position = position.add(Victor.fromArray(orbitObj.physicsObj.position));
		velocity = velocity.add(Victor.fromArray(orbitObj.physicsObj.velocity));

		return gameEngine.addPlanet({
				x: position.x,
				y: position.y,
				dX: velocity.x,
				dY: velocity.y,
				mass: this[dataName].mass,
				size: this[dataName].diameter,
				angle: Math.random() * 2 * Math.PI,
				angularVelocity: 0,
				texture: texture,
				fixedgravity: fixedGravityId
		});
	},


	// create a standard solarsystem
	addSolarSystem: function(gameEngine, rotations) {

		// use default rotations (or passed in)
		rotations = Object.assign({
			Mercury: 0,
			Venus: 240,
			Earth: 175,
			Mars: 110,
			Jupiter: 75,
			Saturn: 60,
			Uranus: 340,
			Neptune: 20,
			Pluto: 65,
		}, rotations);

		// add the sun
		let sol = gameEngine.addPlanet({
				x: 0, y: 0,
				dX: 0, dY: 0,
				mass: this.Sol.mass,
				size: this.Sol.diameter,
				angle: Math.random() * 2 * Math.PI,
				angularVelocity: 0,
				texture: 'sol',
				ignoregravity: 1
		});

		// let mercuryOrbitSpeed = Math.sqrt((this.constants.G * this.Sol.mass) / this.Mercury.orbit);

		// add the planets
		let mercury = this.addStandardPlanet(gameEngine, 'Mercury', 'mercury', rotations.Mercury, sol.id, sol);
		let venus = this.addStandardPlanet(gameEngine, 'Venus', 'venus', rotations.Venus, sol.id, sol);
		let earth = this.addStandardPlanet(gameEngine, 'Earth', 'earth', rotations.Earth, sol.id, sol);
		let mars = this.addStandardPlanet(gameEngine, 'Mars', 'mars', rotations.Mars, sol.id, sol);
		let jupiter = this.addStandardPlanet(gameEngine, 'Jupiter', 'jupiter', rotations.Jupiter, sol.id, sol);
		let saturn = this.addStandardPlanet(gameEngine, 'Saturn', 'saturn', rotations.Saturn, sol.id, sol);
		let uranus = this.addStandardPlanet(gameEngine, 'Uranus', 'uranus', rotations.Uranus, sol.id, sol);
		let neptune = this.addStandardPlanet(gameEngine, 'Neptune', 'neptune', rotations.Neptune, sol.id, sol);
		let pluto = this.addStandardPlanet(gameEngine, 'Pluto', 'pluto', rotations.Pluto, sol.id, sol);

		// the moon
		let moon = this.addStandardPlanet(gameEngine, 'Moon', 'moon', 0, earth.id, earth);

		// add some asteroids between mars and jupiter

		// add some ateroids out by pluto

		// return the references
		return {
			Sol: sol,
			Mercury: mercury,
			Venus: venus,
			Earth: earth,
			Mars: mars,
			Jupiter: jupiter,
			Saturn: saturn,
			Uranus: uranus,
			Neptune: neptune,
			Pluto: pluto
		}
	}

}
