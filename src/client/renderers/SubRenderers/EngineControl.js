import {h, createProjector} from 'maquette';

// Buttons for setting the engine level of ship
// HTML for now
export default class EngineControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 60,
      height: 372,
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

    // draw first assuming engine 0
    this.engine = 0;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));

    // attach shortcut keys
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey('0', 'engine', { }, { level: 0 });
      renderer.keyboardControls.bindKey('1', 'engine', { }, { level: 1 });
      renderer.keyboardControls.bindKey('2', 'engine', { }, { level: 2 });
      renderer.keyboardControls.bindKey('3', 'engine', { }, { level: 3 });
      renderer.keyboardControls.bindKey('4', 'engine', { }, { level: 4 });
      renderer.keyboardControls.bindKey('5', 'engine', { }, { level: 5 });
      renderer.keyboardControls.bindKey('up', 'engine', { }, { level: '+' });
      renderer.keyboardControls.bindKey('down', 'engine', { }, { level: '-' });
    }
  }

  // watch player ship for the engine
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {
    this.engine = playerShip.engine;
    this.projector.scheduleRender();
  }

  setEngine(engineLevel) {
    if (this.renderer.client) {
      this.renderer.client.setEngine(engineLevel);
    }
  }

  createButton(engineLevel) {
      return h('button.key', {
        classes: {
          active: (this.engine == engineLevel)
        },
        key: 'btn'+engineLevel,
        onclick: (event) => {
          event.preventDefault();
          this.setEngine(engineLevel);
        }
        },
        [engineLevel.toString()]
      );
  }

  render() {
    return h('div.nv.ui.col.justify-end', {
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
      this.createButton(5),
      this.createButton(4),
      this.createButton(3),
      this.createButton(2),
      this.createButton(1),
      this.createButton(0)
    ]);
  }

}
