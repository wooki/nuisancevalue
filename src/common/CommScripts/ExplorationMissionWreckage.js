import CommsScript from './CommsScript';

// Station
export default class ExplorationMissionIntro extends CommsScript {

  constructor(obj, game) {
    super(obj, game);

    // no need for chat objects to handle separate state for docked/undocked/etc
    this.states = {};

    let message = `[br]PRIORITY MESSAGE[br]
You board the wreckage of the Glen Miller[br]
How deliciously bizarre!  The hall's molecular structure conforms
to no known element.  Whoever -- or whatever -- made this thing had
access to a technology far in advance of our own.[br]
MESSAGE END
`;

  this.states[0] =  { // state 0
    text: message,
    responses: [
      { // response 0
        text: "Split up to search quicker.",
        nextState: 1
      },
      { // response 1
        text: "Stay together.",
        nextState: 2
      }
    ]
  };

  this.states[1] =  { // state 1
    text: `You conduct the search in time to return to the ship for a a light lunchon.[br]
Return to the Irregular Apocalyse.`,
    responses: []
  };

  this.states[2] =  { // state 1
    text: `Your search is uneventful and slow.[br]
Return to the Irregular Apocalyse.`,
    responses: []
  };

  }

  // get state based on parameters, should be overriden
  getState(commsState, isDocked, isFriendly, isHostile) {

    if (!isDocked) {
      return {
        text: "Cannot establish contact.",
  			responses: []
      }
    }

    // check if the comms state exists
    let state = this.states[commsState];
    if (!state) {
      state = this.states[0]; // get the default option
    }

    return state;
  }

}
