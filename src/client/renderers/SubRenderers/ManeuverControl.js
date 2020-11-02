import {h, createProjector} from 'maquette';

// Buttons for setting the maneuver direction of ship
// HTML for now
export default class ManeuverControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 126,
      height: 44,
      zIndex: 1,
      baseUrl: '/',
      keyboardControls: true,
      labels: {
        l: '<',
        r: '>',
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

    // draw first assuming engine 0
    this.engine = 0;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));

    // attach shortcut keys
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey('ArrowLeft', 'maneuver', { }, { direction: 'l' });
      renderer.keyboardControls.bindKey('ArrowRight', 'maneuver', { }, { direction: 'r' });
    }
  }

  sendManeuver(direction) {
    if (this.renderer.client) {
      this.renderer.playSound('click');
      this.renderer.client.setManeuver(direction);
    }
  }

  createButton(direction) {
      return h('button.key', {
        key: 'btn'+direction,
        onclick: (event) => {
          event.preventDefault();
          this.sendManeuver(direction);
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
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
    },
    [
      this.createButton('l'),
      this.createButton('r')
    ]);
  }

}
