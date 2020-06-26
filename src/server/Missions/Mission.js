// base class for missions that allows triggers to be added and executed in the future
export default class Mission {

  constructor(gameEngine) {
    this.game = gameEngine;
    this.timedEvents = [];
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

}
