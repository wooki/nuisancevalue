// simply default mission for testing
module.exports = {

	// objects for the game
	getObjects: function(api) {

		let objects = [];

		// create a star
		let sol = api.createObject('sol', 0, 0, 'Sol', Math.sqrt(696342*2)*10, 10000, 'sol'); // guid, x, y, name, size, mass, texture
		sol.gravity = 1000; // gravity worked out in bands of 1000 to keep it fast
		objects.push(sol);

		let earth = api.createObject('earth', Math.sqrt(149597890)*10, 0, 'Earth', Math.sqrt(6378*2)*10, 100, 'earth'); // guid, x, y, name, size, mass, texture
		earth.gravity = 10; // gravity worked out in bands of 1000 to keep it fast
		objects.push(earth);

		// create asteroids around the player ship to test range/scan
		objects.push(api.createObject(api.generateGuid(), 20000, 1000, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 20000, 1500, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 25000, 1000, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 25000, 2000, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 30000, 2000, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 25000, 750, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 21000, 2000, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 21000, 2500, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 21000, 1500, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 24000, 2500, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 29000, 2500, 'Asteroid', 50, 5, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 24000, 1750, 'Asteroid', 50, 5, 'asteroid'));

		objects.push(api.createObject(api.generateGuid(), 20500, -500, 'Asteroid', 50, 5, 'asteroid'));
		let asteroid = api.createObject('asteroid', 20000, 500, 'Asteroid', 100, 10, 'asteroid');
		asteroid.dY = -0.05;
		objects.push(asteroid);

		return objects;
	},

	// create player ships
	getPlayerShips: function(api) {

		// just one to start with
		return [api.createPlayerShip('playerShip', 20000, 0, 'Nuisance Value')];
	}


}