import CommsScript from './CommsScript';
import StationChat from './Chat/Station';

// Station
export default class Station extends CommsScript {

  constructor(obj, game) {
    super(obj, game);
  }

  // get state based on parameters, should be overriden
  getState(commsState, isDocked, isFriendly, isHostile) {

    console.log("getState: ");
    console.dir(arguments);

    // Just use a single snippet - this shoudl really use the parameters
    return StationChat[commsState];
  }

}
