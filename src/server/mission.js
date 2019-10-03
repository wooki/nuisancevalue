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
		sol.gravity = 1000; // gravity worked out in bands of 1000 to keep it fast
		objects.push(sol);

		let earth = api.createObject('earth', Math.sqrt(149597890)*10, 0, 'Earth', Math.sqrt(6378*2)*10, 10000, 'earth'); // guid, x, y, name, size, mass, texture
		earth.gravity = 10; // gravity worked out in bands of 1000 to keep it fast
		objects.push(earth);

		// create asteroids around the player ship to test range/scan
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;

		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;

		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;

		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;
		this.addAsteroid(api, objects, 20000, (Math.floor(Math.random() * 20000) - 10000)).dY = -0.2;



		return objects;
	},

	// create player ships
	getPlayerShips: function(api) {

		// just one to start with
		return [api.createPlayerShip('playerShip', 20000, 0, 'Nuisance Value')];
	}


}