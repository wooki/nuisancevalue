import Chat from './Chat';

// chat script for a ship
export default class ShipChat extends Chat {

  constructor(offset) {
    super(offset)

    this.states = {};

		this.states[this.offset + 0] = { // state 0
			text: "ship) this is state 0, the start state.",
			responses: [
				{ // response 0
					text: "response 0 (state 0)",
					nextState: this.offset + 1
				},
				{ // response 1
					text: "response 1 (state 0)",
					nextState: this.offset + 2
				}
			],
			onEnter: function(ship, playerShip, game) {
				// potentially do something to the ship or game when moving TO this state
				console.log("onEnter in state 0:");
			}
		};

		this.states[this.offset + 1] = { // state 1
			text: "ship) this is state 1.",
			responses: [
				{ // response 0
					text: "response 0 (state 1)",
					nextState: this.offset + 2
				}
			],
			onEnter: function(ship, playerShip, game) {
				// potentially do something to the ship or game when moving TO this state
				console.log("onEnter in state 1:");
			}
		};

		this.states[this.offset + 2] = { /// state 2
			text: "ship) this is state 2.",
			responses: [
				{ // response 0
					text: "response 0 (state 2)",
					nextState: this.offset + 0
				}
			],
			onEnter: function(ship, playerShip, game) {
				// potentially do something to the ship or game when moving TO this state
				console.log("onEnter in state 2:");
			}
		};
  }



}
