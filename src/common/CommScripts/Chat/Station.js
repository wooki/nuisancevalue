let resetState = function(ship, playerShip, game) {
	// potentially do something to the ship or game when moving TO this state
	ship.commsState = 0; // reset to the start
};

// rules for transitioning state
module.exports = [
	{ // state 0
		text: "station) this is state 0, the start state.",
		responses: [
			{ // response 0
				text: "response 0 (state 0)",
				nextState: 1
			},
			{ // response 1
				text: "response 1 (state 0)",
				nextState: 2
			}
		],
		onEnter: function(ship, playerShip, game) {
			// potentially do something to the ship or game when moving TO this state
			console.log("onEnter in state 0:");
		},
		OnCloseComms: resetState
	},
	{ // state 1
		text: "station) this is state 1.",
		responses: [
			{ // response 0
				text: "response 0 (state 1)",
				nextState: 2
			}
		],
		onEnter: function(ship, playerShip, game) {
			// potentially do something to the ship or game when moving TO this state
			console.log("onEnter in state 1:");
		},
		OnCloseComms: resetState
	},
	{ // state 1
		text: "station) this is state 2.",
		responses: [
			{ // response 0
				text: "response 0 (state 2)",
				nextState: 0
			}
		],
		onEnter: function(ship, playerShip, game) {
			// potentially do something to the ship or game when moving TO this state
			console.log("onEnter in state 2:");
		},
		OnCloseComms: resetState
	}
];
