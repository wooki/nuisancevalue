import Ai from '../../common/Ai';

// base class for missions that allows triggers to be added and executed in the future
export default class Mission {

  constructor(gameEngine) {
    this.game = gameEngine;
    this.timedEvents = [];
    this.ai = new Ai(gameEngine);
  }

  build() {
    // should be overriden
  }

  addTimedEvent(seconds, callback) {
    if (!this.timedEvents[seconds]) {
      this.timedEvents[seconds] = [];
    }
    this.timedEvents[seconds].push(callback);
  }

  step(seconds) {

    // do we have a trigger for this time
    if (this.timedEvents[seconds] && this.timedEvents[seconds].length > 0) {

      // might have several for any given second
      for (let i = 0; i < this.timedEvents[seconds].length; i++) {

        // execute it
        this.timedEvents[seconds][i](this.gameEngine, seconds);
      }
    }

  }

  scanned(scanned, scannedBy) {
    // override and do something with this information

    // default is to pass this to the AI
    this.ai.scanned(scannedBy, scanned, this);
  }

  sensed(sensed, sensedBy) {
    // override and do something with this information

    // default is to pass this to the AI
    this.ai.sensed(sensedBy, sensed, this);
  }

  event(name, data) {

    console.log("event:"+name);
    // console.dir(data);
    // process some standard events
    if (name == "scanned") {
      this.scanned(data.scanned, data.scanner);

    } else if (name == "sensed") {
      this.sensed(data.sensed, data.senser);

    }
  }

}
