import Chat from './Chat';

// chat script for a docked station
export default class DockedStationChat extends Chat {

  constructor(offset) {
    super(offset)

    this.states = {};

		this.states[this.offset + 0] = { // state 0
			text: "Welcome aboard, I'm the station Dockmaster. What can I help you out with?",
			responses: [
				{ // response 0
					text: "Refuel",
					nextState: this.offset + 1
				},
        { // response 1
					text: "Restock Torpedoes",
					nextState: this.offset + 2
				},
        { // response 2
					text: "Restock PDC",
					nextState: this.offset + 3
				},
        { // response 3
					text: "Who's paying for all this?",
					nextState: this.offset + 4
				}
			],
			// onEnter: function(ship, playerShip, game) {
			// 	// potentially do something to the ship or game when moving TO this state
			// 	console.log("onEnter in state 0:");
			// }
		};

    this.states[this.offset + 1] = { // state 1
			text: "We'll get the [player] hooked up and she'll be refuelled by the time you're ready to leave.",
			responses: [
				{ // response 0
					text: "Back to the Dockmaster",
					nextState: this.offset + 0
				}
			],
			onEnter: function(ship, playerShip, game) {
        playerShip.fuel = playerShip.getHullData().fuel;
			}
		};

    //  Restock Torpedoes - submenu of torp types
    this.states[this.offset + 2] = { // state 2
			text: "I'll get the Quartermaster on it right away.",
			responses: [
				{ // response 0
					text: "Back to the Dockmaster",
					nextState: this.offset + 0
				}
			],
			onEnter: function(ship, playerShip, game) {
        playerShip.torpedoes = playerShip.getHullData().torpedoes;
			}
		};

    this.states[this.offset + 3] = { // state 3
      text: "I'll get the Quartermaster on it right away.",
			responses: [
				{ // response 0
					text: "Back to the Dockmaster",
					nextState: this.offset + 0
				}
			],
			onEnter: function(ship, playerShip, game) {
        if (playerShip.getHullData().pdc) {
          console.log("Loading:"+playerShip.getHullData().maxWeaponStock[0]);
          playerShip.weaponStock[0] = playerShip.getHullData().maxWeaponStock[0];
        }
			}
		};

    this.states[this.offset + 4] = { // state 4
			text: "The company of course, just don't ask too many questions.",
			responses: [
				{ // response 0
					text: "Back to the Dockmaster",
					nextState: this.offset + 0
				}
			]
		};


  }



}
