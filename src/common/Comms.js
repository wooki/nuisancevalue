// const Ship = require('./CommScripts/Ship');
// const DockedStation = require('./CommScripts/DockedStation');
import Factions from './Factions';
import Station from './CommScripts/Station';

// comms scripts are stored an UINT8 so we have 0-255 possible scripts,
// which are named here
const scripts = [null, Station];

export default class Comms {

	constructor(gameEngine, clientEngine) {
        this.game = gameEngine;
        this.client = clientEngine;
        this.factions = new Factions();
    }

    closeComms(playerShip, selectedObj) {

    	if (selectedObj.playable != 1 && selectedObj.commsTargetId == playerShip.id) {

				this.client.updateShipComms({
					id: selectedObj.id,
					target: -1
				});

				// also update playerShip
				this.client.updateShipComms({
					id: playerShip.id,
					target: -1,
					state: 0
				});
    	}
    }

	// try and start or contiue a comms session
	openComms(playerShip, selectedObj) {

		// update ship with commsTargetId
		if (selectedObj.commsTargetId != playerShip.id) {
			this.client.updateShipComms({
				id: selectedObj.id,
				target: playerShip.id
			});

			// also update playerShip
			this.client.updateShipComms({
				id: playerShip.id,
				target: selectedObj.id,
				state: 1 // set player as "connected"
			});
		}

		// check the selectedObj is either not in comms or is already in comms with this player ship
		// also don't allow calling players
		if (selectedObj.playable != 1 && selectedObj.commsScript > 0 && (selectedObj.commsTargetId < 0 || selectedObj.commsTargetId == playerShip.id)) {

			let script = new scripts[selectedObj.commsScript](selectedObj, this.game);

			// get the current state
			let isDocked = (playerShip.dockedId == selectedObj.id);
			// console.log("isDocked="+isDocked);
			// console.log("playerShip.dockedId="+playerShip.dockedId);
			// console.log("selectedObj.id="+selectedObj.id);
			// console.trace();

			let isFriendly = this.factions.isFriendly(0, 0);
			let isHostile = this.factions.isHostile(0, 0);
			let state = script.getState(selectedObj.commsState, isDocked, isFriendly, isHostile);

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

		if (selectedObj.playable != 1 && selectedObj.commsScript > 0 && selectedObj.commsTargetId == playerShip.id) {

			let script = new scripts[selectedObj.commsScript](selectedObj, this.game);

			// get the current state
			let isDocked = (playerShip.dockedId == selectedObj.id);
			let isFriendly = this.factions.isFriendly(0, 0);
			let isHostile = this.factions.isHostile(0, 0);
			let state = script.getState(selectedObj.commsState, isDocked, isFriendly, isHostile);

			// get the response for the users choice
			let stateResponse = state.responses[response];

			// update the ship with new state
			let newState = script.getState(stateResponse.nextState, isDocked, isFriendly, isHostile);
			if (stateResponse.nextState != selectedObj.commsState) {
				this.client.updateShipComms({
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
		let script = new scripts[selectedObj.commsScript](selectedObj, this.game);

		if (script === null) return 0;

		// get the current state
		let isDocked = (playerShip.dockedId == selectedObj.id);
		let isFriendly = this.factions.isFriendly(0, 0);
		let isHostile = this.factions.isHostile(0, 0);
		let state = script.getState(selectedObj.commsState, isDocked, isFriendly, isHostile);

		return state;
	}

	executeOnEnter(selectedObj, playerShip) {

		if (selectedObj.playable == 1) return;

		// chance for script to send commands to ship
		let state = this.getState(selectedObj, playerShip);
		if (state.onEnter) {
			state.onEnter(selectedObj, playerShip, this.game);
		}

	}

	executeOnCloseComms(selectedObj, playerShip) {

		if (selectedObj.playable == 1) return;

		// chance for script to send commands to ship
		let state = this.getState(selectedObj, playerShip);
		if (state.OnCloseComms) {
			state.OnCloseComms(selectedObj, playerShip, this.game);
		}

	}

}
