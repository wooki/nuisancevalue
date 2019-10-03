import PrototypeStation from './game/prototype.js';

document.addEventListener('DOMContentLoaded', function() {

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

		document.title = "Game - Nuisance Value";

		// get the game id + station id
		let url = parseUrlString(document.location);
		let folders = url.pathname.split('/');
		let gameId = folders[2];
		let stationId = folders[3];
		let stationRoot = 'games/'+gameId+"/stations/"+stationId;
		let station = {};

		// connect to station
		let stationRef = window.firebaseApp.database().ref(stationRoot);
		let stationDataRef = stationRef.child('data');

		// create app
		let offsetRef = firebase.database().ref(".info/serverTimeOffset");
		let serverOffset = 0;
		offsetRef.once("value", function(snap) {
		  serverOffset = snap.val();
		});

		PrototypeStation.init(document.body, stationRef, serverOffset);

		// watch all changes
		stationDataRef.on("value", (snapshot) => {

			station = snapshot.val();

			// different station types need different UI but for now just ignore that
			PrototypeStation.update(station);

		});


	} catch (e) {
	  console.error(e);
	}
});
