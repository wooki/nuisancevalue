import {h, createProjector} from 'maquette';
import Victor from 'victor';

// Buttons for setting cycling though all objects within current view range and setting target
export default class ZoomControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 126,
      height: 44,
      zIndex: 1,
      baseUrl: '/',
      mapSize: 10000, // how much to display across the width of the map
      zoom: 1,
      keyboardControls: true,
      onScreenControls: true,
      labels: {
      	'prev': 'T+',
      	'next': 'T-'
      }
    }, params);

    this.parameters.viewDistance = (this.parameters.mapSize/2) / this.parameters.zoom;
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;

    // draw
    if (this.parameters.onScreenControls) {
	    this.engine = 0;
	    this.projector = createProjector();
	    this.projector.append(this.el, this.render.bind(this));
	}

  this.selectionId = -1; // start with nothing selected
  this.objects = {};
  this.objectRanges = {};

    // attach shortcut keys
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey(['BracketRight'], "cycleTarget", { }, { callback: (action, params) => {
        this.setTarget('next');
      }});
      renderer.keyboardControls.bindKey(['BracketLeft'], "cycleTarget", { }, { callback: (action, params) => {
        this.setTarget('prev');
      }});

    }
  }

  // watch shared state for current zoom setting
  updateSharedState(state, renderer) {
  	if (state.selection) {
  		this.selectionId = state.selection.id;
  	} else {
      this.selectionId = -1;
    }
    if (state.zoom && this.parameters.zoom != state.zoom) {
      this.parameters.zoom = state.zoom;
      this.parameters.viewDistance = (this.parameters.mapSize/2) / this.parameters.zoom;
    }
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.ourPos = Victor.fromArray(playerShip.physicsObj.position);
  }

  // keep track of objects in our range
  updateObject(obj, renderer) {

    if (this.ourPos) {

      // measure distance and possibly add to the list
      let objPos = Victor.fromArray(obj.physicsObj.position);
      let objDirection = objPos.clone().subtract(this.ourPos);
      let distanceToObj = objDirection.magnitude();

      if (distanceToObj > this.parameters.viewDistance) {
        this.removeObject(obj.id, renderer);

      } else {
        this.objects[obj.id] = obj;
        this.objectRanges[obj.id] = distanceToObj;
      }
    }
  }

  removeObject(key, renderer) {
    if (this.objects[key]) {
      delete this.objects[key];
      delete this.objectRanges[key];
    }
    if (key == this.selectionId) {
      this.selectionId = -1;
      this.renderer.updateSharedState({
        selection: null
      });
    }
  }

  setTarget(direction) {

    let obj = null;
    let currentKey = this.selectionId;
    let keys = Object.keys(this.objects);

    if (keys.length == 0) {
      // nothing to select so select null
    } else if (keys.length == 1) {
      obj = this.objects[keys[0]];
    } else if (!currentKey || currentKey < 0) {
      obj = this.objects[keys[0]];
    } else {

      // sort the keys into distance order - so minus trends to closer and plus trends to further
      keys = keys.sort(function(a, b) {
        return this.objectRanges[a] - this.objectRanges[b];
      }.bind(this));

      let currentIndex = keys.findIndex(function(k) {
        return (k == currentKey);
      });

      if (direction == 'next') {
        currentIndex = currentIndex + 1;
    	} else {
        currentIndex = currentIndex - 1;
    	}

      if (currentIndex < 0) currentIndex = keys.length - 1;
      currentIndex = currentIndex % keys.length;

      obj = this.objects[keys[currentIndex]];
    }

    this.renderer.updateSharedState({
      selection: obj
    });
  }

  createButton(direction) {
      return h('button.key', {
        key: 'btn'+direction,
        onclick: (event) => {
          event.preventDefault();
          this.setTarget(direction);
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
      this.createButton('prev'),
      this.createButton('next')
    ]);
  }

}
