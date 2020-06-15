import Victor from 'victor';
import {h, createProjector} from 'maquette';
import Ship from '../../../common/Ship';
import Hulls from '../../../common/Hulls';

// Manage docking to stations
// HTML for now
export default class DockingControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 126,
      height: 126,
      zIndex: 1,
      baseUrl: '/',
      keyboardControls: true
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
    this.dockTarget = null;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));

    // attach shortcut keys
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      // renderer.keyboardControls.bindKey('left', 'maneuver', { }, { direction: 'l' });
      // renderer.keyboardControls.bindKey('right', 'maneuver', { }, { direction: 'r' });
    }
  }

  // just store out current ship
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {
    this.playerShip = playerShip;
  }

  // keep track of closest object and show UI if it is in range of docking
  updateObject(obj, renderer) {

    // is this elligable for docking (must be a ship - then check hull)
    if (obj instanceof Ship) {

      let hullData = Hulls[obj.hull];
      if (hullData.dockable) {

        // measure distance
        let ourPos = Victor.fromArray(this.playerShip.physicsObj.position);
        let theirPos = Victor.fromArray(obj.physicsObj.position);
        let direction = theirPos.clone().subtract(ourPos);
        let distance = direction.magnitude();
        distance = distance - (obj.size + this.playerShip.size);// adjust disctance for size of two objects!
        if (distance < 0) {
            distance = 0;
        }
        if (distance < 100) {
          console.log("distance="+distance);

          let ourVelocity = new Victor(this.playerShip.physicsObj.velocity[0], 0 - this.playerShip.physicsObj.velocity[1]);
          let theirVelocity = new Victor(obj.physicsObj.velocity[0], 0 - obj.physicsObj.velocity[1]);
          let closing = 0;
          if (distance != 0) {
              closing = ((ourVelocity.clone().subtract(theirVelocity)).dot(direction) / distance);
          }
          let closingDesc = Math.round(closing);
          if (closing == Infinity || closing == -Infinity) {
              closingDesc = "∞";
          }
          // set variables to show the UI

          this.projector.scheduleRender();
        }

      } // hullData.dockable
    } // (obj instanceof Ship)





    // dockTarget
  }

  // if current dockable ship is removed then remove UI
  removeObject(key, renderer) {



    this.projector.scheduleRender();
  }

  createButton(direction) {
    return null;
      // return h('button.key', {
      //   key: 'btn'+direction,
      //   onclick: (event) => {
      //     event.preventDefault();
      //     this.sendManeuver(direction);
      //   }
      //   },
      //   [this.parameters.labels[direction]]
      // );
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
      this.createButton('l'),
      this.createButton('r')
    ]);
  }

}
