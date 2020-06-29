import CommsScript from './CommsScript';
import StationChat from './Chat/Station';
import DockedChat from './Chat/DockedStation';

// Station
export default class Station extends CommsScript {

  constructor(obj, game) {
    super(obj, game);
  }

  // get state based on parameters, should be overriden
  getState(commsState, isDocked, isFriendly, isHostile) {

    // Just use a single snippet - this shoudl really use the parameters
    let chat = null;
    if (isDocked) {
      chat = DockedChat[commsState];
    } else {
      chat = StationChat[commsState];
    }

    return chat;
  }

}
