// keyboard controls for panning around the map, via shared state (client side only)
export default class MapPanControl {

  constructor(params) {
    this.parameters = Object.assign({
        zoom: 1,
        wasd: true,
        arrows: false,
        speed: 500,
        focus: 'player'
    }, params);
  }

  getKeys(direction) {
      let keys = [];
      if (direction == "N") {
        if (this.parameters.wasd) keys.push('w');
        if (this.parameters.arrows) keys.push('up');
      } else if (direction == "S") {
        if (this.parameters.wasd) keys.push('s');
        if (this.parameters.arrows) keys.push('down');
      } else if (direction == "E") {
        if (this.parameters.wasd) keys.push('d');
        if (this.parameters.arrows) keys.push('right');
      } else if (direction == "W") {
        if (this.parameters.wasd) keys.push('a');
        if (this.parameters.arrows) keys.push('left');
      }
      return keys;
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    // this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;

    // attach shortcut keys
    if ((this.parameters.wasd || this.parameters.arrows) && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey(this.getKeys('N'), 'pan', { repeat: true }, { callback: (action, params) => {
      	this.pan('N');
      }});
      renderer.keyboardControls.bindKey(this.getKeys('W'), 'pan', { repeat: true }, { callback: (action, params) => {
      	this.pan('W');
      }});
      renderer.keyboardControls.bindKey(this.getKeys('S'), 'pan', { repeat: true }, { callback: (action, params) => {
      	this.pan('S');
      }});
      renderer.keyboardControls.bindKey(this.getKeys('E'), 'pan', { repeat: true }, { callback: (action, params) => {
      	this.pan('E');
      }});
    }
  }

  // watch the player ship and update
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (this.parameters.focus == "player") {

      this.focusObjectCoord = playerShip.physicsObj.position;

    } else if (Array.isArray(this.parameters.focus)) {

      this.focusObjectCoord = this.parameters.focus;

    } else {
      // if we have an id the coord will update from the object
    }
  }

  // watch for object id
  updateObject(obj, renderer) {

    if (this.parameters.focus === obj.id) {
      this.focusObjectCoord = obj.physicsObj.position;
    }
  }

  // watch shared state for current zoom setting, zoom must be taken into account so zoom speed stays sensible
  updateSharedState(state, renderer) {
  	this.zoom = 1;
  	if (state.zoom || state.zoom === 0) {
  		this.zoom = state.zoom;
  	}

    // focus has changed
    if ((state.focus || state.focus == 0) && state.focus != this.parameters.focus) {
      this.parameters.focus = state.focus;
    }
  }

  pan(direction) {

    // can only pan once we have the current position
    if (typeof this.focusObjectCoord != 'number' && typeof this.focusObjectCoord != 'string' && this.focusObjectCoord.length == 2) {

      let panAmount = Math.round(this.parameters.speed / (this.zoom || 1));
      let newFocus = this.focusObjectCoord;

      if (direction == "N") {
        newFocus = [newFocus[0], newFocus[1] - panAmount];
      } else if (direction == "S") {
        newFocus = [newFocus[0], newFocus[1] + panAmount];
      } else if (direction == "E") {
        newFocus = [newFocus[0] + panAmount, newFocus[1]];
      } else if (direction == "W") {
        newFocus = [newFocus[0] - panAmount, newFocus[1]];
      }

      // update locally AND send to state
      this.focusObjectCoord = newFocus;
      this.parameters.focus = newFocus;
      this.renderer.updateSharedState({
    		focus: newFocus
    	});
    }
  }


}
