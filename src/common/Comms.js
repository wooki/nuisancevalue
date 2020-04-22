const Ship = require('./CommScripts/Ship');
const Station = require('./CommScripts/Station');
const DockedStation = require('./CommScripts/DockedStation');

// comms scripts are stored an UINT8 so we have 0-255 possible scripts,
// which are named here
const scripts = [Station, DockedStation, Ship];

let game = null;
let client = null;

export default class Comms {

	constructor(gameEngine, clientEngine) {
        game = gameEngine;
        client = clientEngine;
    }

    closeComms(playerShip, selectedObj) {

    	if (selectedObj.playable != 1 && selectedObj.commsTargetId == playerShip.id) {
    		client.updateShipComms({
				id: selectedObj.id,
				target: -1
			});
    	}
    }

	// try and start or contiue a comms session
	openComms(playerShip, selectedObj) {

		// check the selectedObj is either not in comms or is already in comms with this player ship
		// also don't allow calling players
		if (selectedObj.playable != 1 && (selectedObj.commsTargetId < 0 || selectedObj.commsTargetId == playerShip.id)) {

			let script = scripts[selectedObj.commsScript];
			if (playerShip.dockedId == selectedObj.id) {
				script = scripts[selectedObj.dockedCommsScript];
			}

			// get the current state
			let state = script[selectedObj.commsState];

			// update ship with commsTargetId
			if (selectedObj.commsTargetId != playerShip.id) {
				client.updateShipComms({
					id: selectedObj.id,
					target: playerShip.id
				});
			}

			// return to Signals station
			return {
				text: state.text,
				responses: state.responses.map(function(r) { return r.text; })
			};

		} else {
			return {
				text: "No answer.",
				responses: []
			};
		}
	}

	// once a comms session has been started respond with one of the choices
	respond(playerShip, selectedObj, response) {

		if (selectedObj.playable != 1 && selectedObj.commsTargetId == playerShip.id) {

			let script = scripts[selectedObj.commsScript];
			if (playerShip.dockedId == selectedObj.id) {
				script = scripts[selectedObj.dockedCommsScript];
			}

			// get current state
			let state = script[selectedObj.commsState];

			// get the response for the users choice
			let stateResponse = state.responses[response];

			// update the ship with new state
			let newState = script[stateResponse.nextState];
			if (stateResponse.nextState != selectedObj.commsState) {
				client.updateShipComms({
					id: selectedObj.id,
					state: stateResponse.nextState
				});
			}

			// return new state to Signals station
			return {
				text: newState.text,
				responses: newState.responses.map(function(r) { return r.text; })
			};

		} else {
			return {
				text: "No answer. (in response)",
				responses: []
			};
		}
	}

	getState(selectedObj, playerShip) {
		let script = scripts[selectedObj.commsScript];
		if (selectedObj.dockedId == selectedObj.id) {
			script = scripts[selectedObj.dockedCommsScript];
		}
		let state = script[selectedObj.commsState];
		return state;
	}

	executeOnEnter(selectedObj, playerShip) {

		// chance for script to send commands to ship
		let state = this.getState(selectedObj, playerShip);
		if (state.onEnter) {
			state.onEnter(selectedObj, playerShip, game);
		}

	}

	executeOnCloseComms(selectedObj, playerShip) {

		// chance for script to send commands to ship
		let state = this.getState(selectedObj, playerShip);
		if (state.OnCloseComms) {
			state.OnCloseComms(selectedObj, playerShip, game);
		}

	}

}
