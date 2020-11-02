import {h, createProjector} from 'maquette';

import Hulls from '../../../common/Hulls';
import Torpedo from '../../../common/Torpedo';

// fire tubes with varied wearheads
// HTML for now
export default class TorpedoFireControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 60,
      height: 372,
      zIndex: 1,
      baseUrl: '/',
      keyboardControls: false,
      autoLoad: false // loads availible torps when not loaded
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
    //   renderer.keyboardControls.bindKey('Digit0', 'engine', { }, { level: 0 });
    // }

    // get the torpedo types
    this.torpTypes = Hulls["torpedo"].types;

    // keep some local state indicating loading status
    this.loadingState = [];
    this.targetId = -1;

    // draw first with no tubes (depends on ship hull)
    this.tubes = [];
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  startLoading(tubeIndex) {

    if (this.parameters.autoLoad) {

      // load one of whatever we have
      let torpTypeIndex = 0;
      if (this.playerShip.weaponStock[1]) {
        torpTypeIndex = 1;
      } else if (this.playerShip.weaponStock[2]) {
        torpTypeIndex = 2;
      }

      // start loading/unloading
      if (!this.loadingState[tubeIndex]) {
        this.loadingState[tubeIndex] = {
          load: torpTypeIndex,
          timeToLoad: 1000 * 15 // load takes 15 seconds (5s slower than enginner)
        };
      }
    }
  }

  // watch player ship
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    this.targetId = this.playerShip.targetId;

    if (this.playerShip.tubes) {

      if (this.parameters.autoLoad) {

        for (let i = 0; i < this.playerShip.tubes.length; i++) {

          // progress loading
          let currentTorp = this.getTorpType(this.playerShip.tubes[i]);
          if (currentTorp) {

            // if we have a torp then make sure we don't load
            this.loadingState[i] = false;

          } else if (this.loadingState[i] && this.loadingState[i].timeToLoad > 0) {

            this.loadingState[i].timeToLoad = this.loadingState[i].timeToLoad - dt;

          } else if (this.loadingState[i]) {
            // finished loading
            if (this.renderer.client) {
              this.renderer.client.loadTorp(i, this.loadingState[i].load);
              this.loadingState[i] = false;
            }
          } else {
            // isn't loading - if empty then start loading
            this.startLoading(i);
          }
        }

      }

      this.projector.scheduleRender();
    }

  }

  createTube(tube, tubeIndex, isActive) {
      if (tube == null) return null;

      let title = h('h4', {key: 'title'}, ['#'+(tubeIndex+1)]);

      // check state of the tube
      let currentTorp = this.getTorpType(tube);
      let currentState = h('div.current', {key: 'current'}, ['TUBE EMPTY']);
      if (currentTorp) {
          currentState = h('div.current', {key: 'current'}, [currentTorp.name]);
      }

      let haveTarget = (this.targetId >= 0);
      let reloading = this.parameters.autoLoad && this.loadingState[tubeIndex];

      if (reloading) {
        isActive = false;
        // ${Math.round(this.loadingState[tubeIndex].timeToLoad / 1000)}
        currentState = h('div.current', {key: 'current'}, [`RELOADING`]);
      }

      // add warning light if not enough power
      let led = null;
      if (!isActive) {
        led = h('div.LED.alert',[]);
      } else if (currentTorp && haveTarget) {
        led = h('div.LED.green',[]);
      } else {
        led = h('div.LED.yellow',[]);
      }

      let fireButton = h('button.key', {
          key: 'fire',
          classes: {
            shown: (currentTorp),
            enabled: (currentTorp && haveTarget)
          },
          onclick: (event) => {

            this.renderer.playSound('click');

            if (haveTarget) {
              // fire the torp
              if (this.renderer.client) {

                // fire and unload
                if (isActive && currentTorp) {
                  this.renderer.client.fireTorp(this.targetId , tubeIndex);
                }
                this.renderer.client.loadTorp(tubeIndex, 0);

                // when button pressed always restart loading
                if (this.parameters.autoLoad) {
                  this.startLoading(tubeIndex);
                }

                // redraw to update button state
                this.projector.scheduleRender();
              }
            }
          }
        }, ['FIRE']);

      // build some html
      return h('div.nv.ui.row.tube', {
          key: 'tube'+tubeIndex
        },
        [
          led,
          title,
          currentState,
          fireButton
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

    if (this.playerShip) {

      let activeTubes = this.playerShip.getActiveTubes();

      for (let i = 0; i < this.playerShip.tubes.length; i++) {
        let isActive = activeTubes > i;
        let tube = this.createTube(this.playerShip.tubes[i], i, isActive);
        rows.push(tube);
      }
    }

    return h('div.nv.ui.col.tubes', {
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
