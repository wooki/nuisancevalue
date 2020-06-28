// base class for comms script
export default class CommsScript {

  constructor(obj, game) {
    this.obj = obj;
    this.game = game;
  }

  // get state based on parameters, should be overriden
  getState(commsState, isDocked, isFriendly, isHostile) {
    return {
      text: "No answer.",
      responses: []
    }
  }

}
