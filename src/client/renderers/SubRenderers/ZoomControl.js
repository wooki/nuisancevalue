import {h, createProjector} from 'maquette';

// Buttons for setting zoom, via shared state (client side only)
export default class ManeuverControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 126,
      height: 63,
      zIndex: 1,
      baseUrl: '/',
      keyboardControls: true,
      onScreenControls: true,
      labels: {
      	'+': 'Zoom+',
      	'-': 'Zoom-'
      }
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;

    // draw
    if (this.parameters.onScreenControls) {
	    this.engine = 0;
	    this.projector = createProjector();
	    this.projector.append(this.el, this.render.bind(this));
	}

    // attach shortcut keys
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey('left', 'maneuver', { }, { direction: 'l' });
      renderer.keyboardControls.bindKey('right', 'maneuver', { }, { direction: 'r' });

      renderer.keyboardControls.bindKey(['equal sign', 'add'], 'zoom', { repeat: true }, { callback: (action, params) => {
      	this.setZoom('+');
      }});
      renderer.keyboardControls.bindKey(['dash', 'subtract'], 'zoom', { repeat: true }, { callback: (action, params) => {
      	this.setZoom('-');
      }});

    }
  }

  // watch shared state for current zoom setting
  updateSharedState(state, renderer) {
  	this.zoom = 1;
  	if (state.zoom || state.zoom === 0) {
  		this.zoom = state.zoom;
  	}
  }

  setZoom(direction) {
  	let zoom = this.zoom;
  	if (direction == '+') {
  		zoom = zoom * 1.02;
  		if (zoom > 2) zoom = 2;
  	} else {
  		zoom = zoom * 0.98;
  		if (zoom < 0.2) zoom = 0.2;
  	}
  	this.zoom = zoom;

  	this.renderer.updateSharedState({
  		zoom: zoom
  	});
  }

  createButton(direction) {
      return h('button.key', {
        key: 'btn'+direction,
        onclick: (event) => {
          event.preventDefault();
          this.setZoom(direction);
        }
        },
        [this.parameters.labels[direction]]
      );
  }

  render() {
    return h('div.nv.ui.row', {
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px'
      }
    },
    [
      this.createButton('-'),
      this.createButton('+')
    ]);
  }

}