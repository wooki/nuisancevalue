import {h, createProjector} from 'maquette';
import Comms from '../../../common/Comms';

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
    this.comms = new Comms(renderer.game, renderer.client);

    // draw first
    this.playerShip = null;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // watch player ship for comms state and target
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    if (this.targetObj && this.playerShip.targetId != this.targetObj.id) {
      this.targetObj = null;
    }

    if (isDocked) {
      this.targetObj = playerShip.id;
    }

    this.projector.scheduleRender();
  }

    // watch for object updates so we can remember the target
    updateObject(obj, renderer) {
      if (this.playerShip && this.playerShip.targetId === obj.id) {
        this.targetObj = obj;
        this.projector.scheduleRender();
      }
    }

    // if current target is removed
    removeObject(key, renderer) {
      if (this.targetObj && this.targetObj.id == key) {
         this.targetObj = null;
         this.projector.scheduleRender();
      }
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
            if (this.playerShip.targetId >= 0 && this.targetObj) {

              // this will update the ships via gameEngine and handled by CommsControl
              let responses = this.comms.openComms(this.playerShip, this.targetObj);

            }
          }),
          this.createButton('incoming', (this.playerShip.commsState <= 0 && this.playerShip.commsTargetId >= 0), (event) => {
            event.preventDefault();
            if (this.playerShip.commsTargetId >= 0) {
              let responses = this.comms.openComms(this.playerShip, {
                id: this.playerShip.commsTargetId,
                commsTargetId: null
              });
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
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
    },
    buttons);
  }

}
