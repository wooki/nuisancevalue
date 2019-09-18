// simply default mission for testing
module.exports = {

	// objects for the game
	getObjects: function(api) {

		let objects = [];

		// create a star
		let sol = api.createObject('sol', 0, 0, 'Sol', Math.sqrt(696342*4), 1000, 'sol'); // guid, x, y, name, size, mass, texture
		objects.push(sol);

		let earth = api.createObject('earth', Math.sqrt(149597890), 0, 'Earth', Math.sqrt(6378*4), 100, 'earth'); // guid, x, y, name, size, mass, texture
		objects.push(earth);

		// create asteroids around the player ship to test range/scan
		objects.push(api.createObject(api.generateGuid(), 2000, 1000, 'Asteroid', 50, 0, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 2000, 1500, 'Asteroid', 50, 0, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 2500, 1000, 'Asteroid', 50, 0, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 2500, 2000, 'Asteroid', 50, 0, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 3000, 2000, 'Asteroid', 50, 0, 'asteroid'));
		objects.push(api.createObject(api.generateGuid(), 2500, 750, 'Asteroid', 50, 0, 'asteroid'));

		return objects;
	},

	// create player ships
	getPlayerShips: function(api) {

		// just one to start with
		return [api.createPlayerShip('playerShip', 2000, 0, 'Nuisance Value')];
	}


}