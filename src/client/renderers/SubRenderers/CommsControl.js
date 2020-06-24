import {h, createProjector} from 'maquette';

// actual comms when they are in action
export default class CommsControl {

  constructor(params) {
    this.parameters = Object.assign({
      zIndex: 1,
      baseUrl: '/'
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;

    // draw first
    this.playerShip = null;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // sendManeuver(direction) {
  //   if (this.renderer.client) {
  //     this.renderer.client.setManeuver(direction);
  //   }
  // }

  // watch player ship for comms state and target
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {
    this.playerShip = playerShip;
    console.log(this.playerShip.commsTargetId);
    this.projector.scheduleRender();
  }

  createButton(label, active, onClick) {

      let alert = null;
      if (active && label == 'incoming') {
        alert = h('div.LED.alert',[]);
      }

      return h('button.key', {
        classes: {
          disabled: !active
        },
        key: 'btn'+label,
        onclick: onClick
        },
        [alert, this.parameters.labels[label]]
      );
  }

  render() {

    // show nothing of the comms are closed
    if (this.playerShip == null || this.playerShip.commsTargetId < 0) {
        return h('div', {
          key: 'comms'
        });
    }

    let buttons = [];

    return h('div.nv.ui.col.stretch.comms', {
      key: 'comms',
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px'
      }
    },
    buttons);
  }

}
