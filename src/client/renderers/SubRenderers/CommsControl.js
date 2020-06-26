import {h, createProjector} from 'maquette';
import Comms from '../../../common/Comms';

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
    this.comms = new Comms(renderer.game, renderer.client);

    // draw first
    this.playerShip = null;
    this.commsTarget = null;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // watch player ship for comms state and target
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    if (this.commsTarget && this.playerShip.commsTargetId != this.commsTarget.id) {
      this.commsTarget = null;
    }
    this.projector.scheduleRender();
  }

    // watch for object updates so we can remember the target
    updateObject(obj, renderer) {
      if (this.playerShip && this.playerShip.commsTargetId === obj.id) {
        this.commsTarget = obj;
        this.projector.scheduleRender();
      }
    }

    // if current target is removed
    removeObject(key, renderer) {
      if (this.commsTarget && this.commsTarget.id == key) {
         this.commsTarget = null;
         this.projector.scheduleRender();
      }
    }

  createButton(key, label, onClick) {

      return h('button', {
        key: key,
        onclick: onClick
        },
        [label]
      );
  }

  render() {


    let open = true;
    let content = [];

    if (this.playerShip == null || this.playerShip.commsTargetId < 0 || this.playerShip.commsState === 0) {
        open = false; // show nothing of the comms are closed
    } else if (this.playerShip && this.commsTarget) {

      // get current options and state (always open comms)
      let commsState = this.comms.openComms(this.playerShip, this.commsTarget);

      content.push(h('div.text', {}, [commsState.text]));
      for (let i = 0; i < commsState.responses.length; i++) {
        let key = "state-"+this.commsTarget.commsState+"-response-"+i;
        content.push(this.createButton(key, commsState.responses[i], (event) => {
          event.preventDefault();
          this.comms.respond(this.playerShip, this.commsTarget, i);
        }));
      }
    }

    // always add a close comms button
    content.push(this.createButton("closecomms", "Close Comms", (event) => {
      event.preventDefault();
      this.comms.closeComms(this.playerShip, this.commsTarget);
    }));

    return h('div.nv.ui.col.stretch.comms', {
      key: 'comms',
      classes: {
        open: open
      },
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px'
      }
    },
    content);
  }

}
