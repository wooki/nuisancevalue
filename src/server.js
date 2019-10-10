document.addEventListener('DOMContentLoaded', function() {

	let GameServer = require('./server/server.js');
	let GameServerApi = require('./server/serverApi.js');

	let Mission = require('./server/mission.js');
	// could use window.Function to create a function to create a Mission
	// object.  That wat missions can be dynamically added.

	try {

		let parseUrlString = function(url) {

			var parser = document.createElement('a');
			parser.href = url;

			return {
				protocol: parser.protocol, // => "http:"
				hostname: parser.hostname, // => "example.com"
				port: parser.port, // => "3000"
				pathname: parser.pathname, // => "/pathname/"
				hash: parser.hash, // => "#hash"
				host: parser.host,
				params: parser.search.substring(1) || ''
			}
		}

		window.firebaseApp = firebase.app();
		window.firebaseFeatures = ['auth', 'database'].filter(feature => typeof window.firebaseApp[feature] === 'function');

		document.title = "Server - Nuisance Value";

		// connect to some controls on the page
		let divState = document.getElementById("gameState");
		let divGameId = document.getElementById("gameId");
		let divPause = document.getElementById("gamePause");
		let divUnPause = document.getElementById("gameUnPause");
		let divReset = document.getElementById("gameReset");
		let divStationUrls = document.getElementById("stationUrls");

		divPause.addEventListener('click', function(event) {
			if (game && api) {
				GameServer.pause(game, gameRef, Mission, api);
			}
		});
		divUnPause.addEventListener('click', function(event) {
			if (game && api) {
				GameServer.unpause(game, gameRef, Mission, api, GameServer);
			}
		});
		divReset.addEventListener('click', function(event) {
			if (game && api) {
				GameServer.init(game, gameRef, Mission, api);
			}
		});

		// get the game id
		let url = parseUrlString(document.location);
		let folders = url.pathname.split('/');
		let gameId = folders[2];
		let gameRoot = 'games/'+gameId;

		let game = {};
		let api = null;

		// connect to root once to load initial data - from then on our copy
		// is a master and we update the database from here.  We onlyneed to hook
		// into events for incoming data from clients. when reconnecting this could be big!
		let gameRef = window.firebaseApp.database().ref(gameRoot);
		gameRef.once("value", (snapshot) => {

			game = snapshot.val();

			// display state
			divGameId.innerHTML = gameId;
			divState.innerHTML = game.state;

			api = GameServerApi(GameServer, game, gameRef)

			if (game.state == "initialise") {
				// create game and step into pause
				GameServer.init(game, gameRef, Mission, api);

			} else {
				// all other cases - switch game to pause
				GameServer.pause(game, gameRef, Mission, api);
			}
		});

		// start watching state for updates
		let stateRef = gameRef.child('state');
		stateRef.on("value", (snapshot) => {
			divState.innerHTML = snapshot.val();
		});

		// watch for data arriving in stations - watch whole node for now (maybe split into in/out at some point?)
		let stationsRef = gameRef.child('stations');
		stationsRef.on("value", (snapshot) => {

			// update on our game object (thus we get client updates)

			// iterate and display the URLs for station clients
			divStationUrls.innerHTML = "";
			let stations = snapshot.val();
			if (stations) {
				Object.keys(stations).forEach(function(key) {

					let station = stations[key];
					let stationLink = document.createElement('a');
					stationLink.setAttribute("href", "/"+station.type+"/"+gameId+"/"+station.guid);
					stationLink.innerHTML = "/"+station.type+"/"+gameId+"/"+station.guid;
					divStationUrls.appendChild(stationLink);
				});
			}
		});






	} catch (e) {
	  console.error(e);
	}
});