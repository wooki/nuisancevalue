import {h, createProjector} from 'maquette';

import Hulls from '../../../common/Hulls';
import Torpedo from '../../../common/Torpedo';

// Load/unload tubes with varied wearheads
// HTML for now
export default class TorpedoLoadControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 60,
      height: 372,
      zIndex: 1,
      baseUrl: '/',
      keyboardControls: false
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;

    // draw first with no tubes (depends on ship hull)
    this.tubes = [];
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));

    // attach shortcut keys
    // if (this.parameters.keyboardControls && renderer.keyboardControls) {
    //   renderer.keyboardControls.bindKey('0', 'engine', { }, { level: 0 });
    // }
  }

  // watch player ship for the engine
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {
    this.engine = playerShip.engine;
    let hullData = playership.getHullData();
    this.tubeCount = hullData.tubes || 0;
    this.projector.scheduleRender();
  }

  // setEngine(engineLevel) {
  //   if (this.renderer.client) {
  //     this.renderer.client.setEngine(engineLevel);
  //   }
  // }

  createbutton(engineLevel) {
      // return h('div.key', {
      //   classes: {
      //     active: (this.engine == engineLevel)
      //   },
      //   key: 'btn'+engineLevel,
      //   onclick: (event) => {
      //     event.preventDefault();
      //     this.setEngine(engineLevel);
      //   }
      //   },
      //   [engineLevel.toString()]
      // );
  }

  createTube(createTube(tube, tubeIndex) {) {
      if (tube == null) return null;

      // check state of the tube

      // build some html
      return h('div.data.tube', {
          key: 'tube'+tubeIndex
        },
        Object.keys(item).map(function(key) {
          if (key == 'type') {
            return h('div.line.LED.'+item[key], {
              styles: {
                'background-color': this.parameters.colors[item[key]]
              }
            },[]);
          } else {
            return h('div.line', [
              h('label', [key]),
              h('data', [item[key]])
            ]);
          }
        }.bind(this))
      );
  }


  render() {

    let rows = [];

    if (this.playerShip.tubes) {
      for (let i = 0; i < this.playerShip.tubes.length) {
        let tube = this.createTube(this.playerShip.tubes[i], i);
        rows.push(tube);
      }
    }

    return h('div.nv.ui.row', {
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px'
      }
      },
      rows
    );
  }

}
