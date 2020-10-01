import CommsScript from './CommsScript';

// Station
export default class ExplorationMissionIntro extends CommsScript {

  constructor(obj, game) {
    super(obj, game);

    // no need for chat objects to handle separate state for docked/undocked/etc
    this.states = {};

    let message = `[br]PRIORITY MESSAGE[br]
FROM Irregular Apocalyse TO [player][br]
We sent a Corvette class vessel to chart this binary system but it never checked-in.[br]
Find the vessel, establish contact and return with your findings.[br]
MESSAGE END
`;
    this.states[0] =  { // state 0
			text: message,
			responses: [],
      OnCloseComms: function(ship, playerShip, game) {
        ship.commsScript = 1; // default station comms
			}
		};

  }

  // get state based on parameters, should be overriden
  getState(commsState, isDocked, isFriendly, isHostile) {

    // check if the comms state exists
    let state = this.states[commsState];
    if (!state) {
      state = this.states[0]; // get the default option
    }

    return state;
  }

}
