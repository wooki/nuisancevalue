import Chat from './Chat';

// chat script for a station
export default class StationChat extends Chat {

  constructor(offset) {
    super(offset)

    this.states = {};

		this.states[this.offset + 0] = { // state 0
			text: "Greetings [player], how can we assist you today?",
			responses: [
				{ // response 0
					text: "What services does your station offer?",
					nextState: this.offset + 1
				},
				// { // response 1
				// 	text: "response 1 (state 0)",
				// 	nextState: this.offset + 2
				// }
			],
			// onEnter: function(ship, playerShip, game) {
			// 	// potentially do something to the ship or game when moving TO this state
			// 	console.log("onEnter in state 0:");
			// }
		};

		this.states[this.offset + 1] = { // state 1
			text: "Once docked with us we can offer you resupply and repair of all systems. We look forward to your visit.",
			responses: [],
			// onEnter: function(ship, playerShip, game) {
			// 	// potentially do something to the ship or game when moving TO this state
			// 	console.log("onEnter in state 1:");
			// }
		};

  }



}
