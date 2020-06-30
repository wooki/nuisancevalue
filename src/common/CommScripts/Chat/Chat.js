// base class for chat scripts
export default class Chat {

  constructor(offset) {
    this.offset = offset || 0;

    this.states = {};
    this.states[this.offset + 0] = { // state 0
  		text: "No answer.",
  		responses: []
  	};
  }

  getState(index) {
    return this.states[index.toString()];
  }

}
