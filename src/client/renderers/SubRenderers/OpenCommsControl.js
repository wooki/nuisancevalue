import {h, createProjector} from 'maquette';
import Comms from './../../common/Comms';

// Buttons for opening comms to current target OR incoming call
// actual comms handled in another renderer
export default class CommsOpenControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 126,
      height: 126,
      zIndex: 1,
      baseUrl: '/',
      labels: {
        open: 'Open Comms',
        incoming: 'Incoming Comms',
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

    let buttons = [];

    // buttons depend on state
    if (this.playerShip) {

      // if our commsState is > 0 then we are currently calling
      if (this.playerShip.commsState == 0) {

        buttons = [
          this.createButton('open', (this.playerShip.targetId >= 0), (event) => {
            event.preventDefault();
            if (this.playerShip.targetId >= 0) {

              let c = new Comms(this.renderer.game, this.renderer.client);
              
            }
          }),
          this.createButton('incoming', (this.playerShip.commsTargetId >= 0), (event) => {
            event.preventDefault();
            if (this.playerShip.commsTargetId >= 0) {
              console.log("click: incoming");
            }
          })
        ];

      }
    }

    return h('div.nv.ui.col.stretch', {
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
