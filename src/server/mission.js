// simply default mission for testing
module.exports = {

	addAsteroid: function(api, objects, x, y) {

		let asteroid = api.createObject(api.generateGuid(), x, y, 'Asteroid', Math.floor(Math.random() * 75) + 25, Math.floor(Math.random() * 7) + 3, 'asteroid');
		objects.push(asteroid);
		return asteroid;
	},


	// objects for the game
	getObjects: function(api) {

		let objects = [];

		// create a star
		let sol = api.createObject('sol', 0, 0, 'Sol', Math.sqrt(696342*2)*10, 100000, 'sol'); // guid, x, y, name, size, mass, texture
		sol.gravity = 2000;
		objects.push(sol);

		let earth = api.createObject('earth', Math.sqrt(149597890)*10, 0, 'Earth', Math.sqrt(6378*2)*10, 10000, 'earth'); // guid, x, y, name, size, mass, texture
		earth.gravity = 200;
		objects.push(earth);

		objects.push(api.createObject(api.generateGuid(), 20000, 1000, 'Asteroid', 100, 10, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 20000, 1500, 'Asteroid', 100, 10, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 20000, 2000, 'Asteroid', 100, 10, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 20000, -1000, 'Asteroid', 100, 10, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 20000, -1500, 'Asteroid', 100, 10, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 20000, -2500, 'Asteroid', 100, 10, 'asteroid'));

		// create asteroids around the player ship to test range/scan
		// for (let i = 0; i < 5; i++) {
		// 	let x = (Math.floor(Math.random() * 20000) - 10000);
		// 	let y = (Math.floor(Math.random() * 20000) - 10000);
		// 	this.addAsteroid(api, objects, x, y).dY = -0.4;
		// }


		return objects;
	},

	// create player ships
	getPlayerShips: function(api) {

		// just one to start with
		return [api.createPlayerShip('playerShip', 20000, 0, 'Nuisance Value')];
	}


}
