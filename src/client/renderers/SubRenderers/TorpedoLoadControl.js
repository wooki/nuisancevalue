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

    // attach shortcut keys
    // if (this.parameters.keyboardControls && renderer.keyboardControls) {
    //   renderer.keyboardControls.bindKey('0', 'engine', { }, { level: 0 });
    // }

    // get the torpedo types
    this.torpTypes = Hulls["torpedo"].types;

    // keep some local state indicating loading status
    this.loadingState = [];

    // draw first with no tubes (depends on ship hull)
    this.tubes = [];
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // watch player ship
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }
    let efficiency = this.playerShip.getReloaderEfficiency();    

    if (this.playerShip.tubes) {
      for (let i = 0; i < this.playerShip.tubes.length; i++) {
        if (this.loadingState[i] && this.loadingState[i].timeToLoad > 0) {

          this.loadingState[i].timeToLoad = this.loadingState[i].timeToLoad - (dt*efficiency);

        } else if (this.loadingState[i]) {
          // send to game engine
          if (this.renderer.client) {
            this.renderer.client.loadTorp(i, this.loadingState[i].load);
            this.loadingState[i] = false;
          }
        }
      }
      this.projector.scheduleRender();
    }

  }

  createLoadButton(tubeIndex, torpTypeIndex, name, active) {
      return h('button', {
        classes: {
          active: active
        },
        key: 'btnLoad'+tubeIndex,
        onclick: (event) => {

          // start loading/unloading
          this.loadingState[tubeIndex] = {
            load: torpTypeIndex,
            timeToLoad: 1000 * 10 // load takes 10 seconds
          };

          // immediately unload, but still use timer
          if (torpTypeIndex == 0 && this.renderer.client) {
            this.renderer.client.loadTorp(tubeIndex, 0);
          }

          // redraw to update button state
          this.projector.scheduleRender();
        }
        },
        [name]
      );
  }

  createTube(tube, tubeIndex) {
      if (tube == null) return null;

      let title = h('h4', {key: 'title'}, ['TUBE #'+(tubeIndex+1)]);

      // check state of the tube
      let currentTorp = this.getTorpType(tube);
      let currentState = h('div.current', {key: 'current'}, ['TUBE EMPTY']);
      if (currentTorp) {
          currentState = h('div.current', {key: 'current'}, [currentTorp.name]);
      }

      // load options depend on state
      let loadOptions = [];

      // check if this tube is currently loading
      if (this.loadingState[tubeIndex]) {
        // is loading - so just show progress
        loadOptions.push(h('div.loading-progress', {key: 'loadprogress'}, [Math.round(this.loadingState[tubeIndex].timeToLoad/1000) + " s"]));

      } else {
        // not currently loading - so give options

        for (let i = 0; i < this.torpTypes.length; i++) {
          let haveStock = (this.playerShip && this.playerShip.weaponStock[i+1] > 0);
          loadOptions.push(this.createLoadButton(
            tubeIndex,
            i+1,
            this.torpTypes[i].name,
            (currentTorp || !haveStock)
          ));
        }

        loadOptions.push(this.createLoadButton(
          tubeIndex,
          0,
          "Unload",
          !(currentTorp)
        ));
      }

      // build some html
      return h('div.nv.ui.col.tube', {
          key: 'tube'+tubeIndex
        },
        [
          title,
          currentState,
          h('h4', {key: 'loader'}, ['LOADER']),
          h('div.nv.ui.row.loadoptions', {key: 'loadoptions'}, loadOptions)
        ]
      );
  }

  getTorpType(i) {
    // torps start at 0 (array) but 0 indicates unloaded, so adjust
    if (i <= 0) return false;
    return this.torpTypes[i - 1];
  }

  render() {

    let rows = [];

    if (this.playerShip && this.playerShip.tubes) {
      for (let i = 0; i < this.playerShip.tubes.length; i++) {
        let tube = this.createTube(this.playerShip.tubes[i], i);
        rows.push(tube);
      }
    }

    return h('div.nv.ui.row.tubes', {
      key: "tubes",
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
      },
      rows
    );
  }

}
