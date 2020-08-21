import Victor from 'victor';
import {h, createProjector} from 'maquette';
import Ship from '../../../common/Ship';
import Hulls from '../../../common/Hulls';
import Assets from '../Utils/images.js';

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
      keyboardControls: true,
      dockInitDistance: 1000,
      dockMaxDistance: 200,
      dockMaxClosing: 200
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
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    if (isDocked) {
      this.dockTarget = {
        state: 2
      };
    }
  }

  // keep track of closest object and show UI if it is in range of docking
  updateObject(obj, renderer) {

    if (this.dockTarget && this.dockTarget.state == 2) return;

    // is this elligable for docking (must be a ship - then check hull)
    if (obj instanceof Ship) {

      let hullData = obj.getHullData();
      if (hullData.dockable) {

        // measure distance
        let ourPos = Victor.fromArray(this.playerShip.physicsObj.position);
        let theirPos = Victor.fromArray(obj.physicsObj.position);
        let direction = theirPos.clone().subtract(ourPos);
        let distance = Math.round(Math.abs(direction.magnitude()));
        distance = distance - ((obj.size + this.playerShip.size)/2);// adjust disctance for size of two objects!
        if (distance < 0) {
            distance = 0;
        }
        if (distance < this.parameters.dockInitDistance) {

          // check if this is the current dock target OR it is closer OR we don't have one
          if (this.dockTarget == null || this.dockTarget.obj.id == obj.id || this.dockTarget.distance > distance) {

            let ourVelocity = new Victor(this.playerShip.physicsObj.velocity[0], 0 - this.playerShip.physicsObj.velocity[1]);
            let theirVelocity = new Victor(obj.physicsObj.velocity[0], 0 - obj.physicsObj.velocity[1]);
            let closing = 0;
            if (distance != 0) {
                closing = (ourVelocity.clone().subtract(theirVelocity)).dot(direction) / distance;
            }
            let closingDesc = Math.round(closing);
            if (Math.abs(closing) == Infinity) {
                closingDesc = "∞";
            }

            let target = this.dockTarget;

            // set variables to show the UI
            this.dockTarget = {
              obj: obj,
              distance: distance,
              closing: closing,
              closingDesc: closingDesc,
              progress: 0,
              state: 0 // not docking
            }

            // keep progress towards docking
            if (target && target.obj.id == obj.id) {
              this.dockTarget.progress = target.progress;
              this.dockTarget.state = target.state;
            }

            // button will allow this to be toggled to/from 0=not docking and 1=docking
            if (this.dockTarget.state == 1) {

              // advance progress if we're close enough and slow enough
              if (distance <= this.parameters.dockMaxDistance && closing <= this.parameters.dockMaxClosing) {
                this.dockTarget.progress = this.dockTarget.progress + 0.2;
              }

              // if we're done
              if (this.dockTarget.progress >= 100) {
                this.dock();
              }
            }

            this.projector.scheduleRender();

          }

        } else {
          // if this was the target but is now out of range remove it
          if (this.dockTarget && this.dockTarget.obj.id == obj.id) {
            this.dockTarget = null;
            this.projector.scheduleRender();
          }
        }

      } // hullData.dockable
    } // (obj instanceof Ship)

  } // updateObject

  dock() {
    if (this.renderer.client) {
      // do the dock!
      this.dockTarget.progress = 0;
      this.dockTarget.state = 2; // docked!

      this.renderer.client.setEngine(0);
      this.renderer.client.dock(this.dockTarget.obj.id);
    }
  }

  undock() {
    if (this.renderer.client && this.dockTarget.state == 2) {
      this.dockTarget = null;
      this.renderer.client.undock();
      this.projector.scheduleRender();
    }
  }

  // if current dockable ship is removed then remove UI
  removeObject(key, renderer) {

    if (this.dockTarget && this.dockTarget.obj && this.dockTarget.obj.id == key) {
      this.dockTarget = null;
      this.projector.scheduleRender();
    }
  }

  createLine(label, content) {
    return h('div.line.'+label, {
        key: label
      }, [
        h('label', [label.replace('_', ' ')]),
        h('data', [content])
    ]);
  }

  createDataBlock(lines) {
    return h('div.data', [lines]);
  }

  render() {

    if (this.dockTarget == null || this.dockTarget.obj == null) {
      return h('div.nv.ui', {
        key: 'dockingcontrol',
        styles: {
          position: 'absolute',
          left: this.parameters.x + 'px',
          top: this.parameters.y + 'px',
          width: this.parameters.width + 'px',
          height: this.parameters.height + 'px',
          zIndex: this.parameters.zIndex.toString()
        }
        },
        [this.createDataBlock([
          this.createLine('Dock', 'OUT OF RANGE')
        ])
        ]
      );
    }

    let dockButton = null;
    let progress = null;
    let info1 = this.createLine('Range', this.dockTarget.distance + Assets.Units.distance)
    let info2 = null;
    let info3 = this.createLine('Closing', this.dockTarget.closingDesc + Assets.Units.speed);
    let info4 = null;

    if (this.dockTarget.state == 0) {
      dockButton = h('button.key.dock', {
        key: 'start-dock',
        onclick: (event) => {
          event.preventDefault();
          this.dockTarget.progress = 0;
          this.dockTarget.state = 1;
        }
      }, ['Initiate Dock']);
    } else if (this.dockTarget.state == 1) {
      progress = this.createLine('Progress', Math.round(this.dockTarget.progress) + '%');
      dockButton = h('button.key.dock', {
        key: 'cancel-dock',
        onclick: (event) => {
          event.preventDefault();
          this.dockTarget.progress = 0;
          this.dockTarget.state = 0;
        }
      }, ['Abort Dock']);
      info2 = this.createLine('Max_Range',  this.parameters.dockMaxDistance + Assets.Units.distance);
      info4 = this.createLine('Max_Closing',  '±' + this.parameters.dockMaxClosing + Assets.Units.speed);
    } else if (this.dockTarget.state == 2) {
      dockButton = h('button.key.dock', {
        key: 'undock',
        onclick: (event) => {
          event.preventDefault();
          this.undock();
        }
      }, ['Launch']);
      info1 = null;
      info3 = null;
    }

    return h('div.nv.ui', {
      key: 'dockingcontrol',
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
      },
      [this.createDataBlock([
          this.createLine('Dock', (this.dockTarget.obj.name || this.dockTarget.obj.hull)),
          info1,
          info2,
          info3,
          info4,
          progress
        ]),
        dockButton
      ]
    );
  }

}
