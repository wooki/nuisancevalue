import CommsScript from './CommsScript';
import StationChat from './Chat/Station';
import DockedStationChat from './Chat/DockedStation';

// Station
export default class Station extends CommsScript {

  constructor(obj, game) {
    super(obj, game);

    // these can be summed and used as the offset, so we can
    // deal with multiple chat objects all indexed by a single
    // commsState (so when we switch from docked to undocked we're
    // not jumped from docked state x to undocked state x)
    this.offsets = { // this will break when more than 19 states
      friendly: 20,
      hostile: 40,
      docked: 60
    }
  }

  // get state based on parameters, should be overriden
  getState(commsState, isDocked, isFriendly, isHostile) {

    // commsState uses some offset depending on the chat
    // so for example a ship in state 3 conversation with station
    // docks and state 3 doesn't exist for the docked chat and it is
    // reset to zero

    // Get chat based on params and offset
    let offset = 0;
    if (isDocked) offset = offset + this.offsets.docked;
    if (isFriendly) offset = offset + this.offsets.friendly;
    if (isHostile) offset = offset + this.offsets.hostile;

    let chat = null;
    if (isDocked) {
      chat = new DockedStationChat(offset);
    } else {
      chat = new StationChat(offset);
    }

    // check if the comms state exists for the chat object, if not then reset
    let state = chat.getState(commsState);
    if (!state) {
      state = chat.getState(offset); // get the default option
    }

    return state;
  }

}
