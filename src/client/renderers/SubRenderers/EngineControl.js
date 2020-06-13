import morphdom from 'morphdom';


// Buttons for setting the engine level of ship
// HTML for now
export default class EngineControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 100,
      height: 400,
      zIndex: 1,
      baseUrl: '/',
      themeColor: '#cccccc',
      keyboardControls: true
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.pixiApp = pixiApp;
    this.pixiContainer = pixiContainer;
    this.resources = resources;

    // draw first assuming engine 0
    this.draw(0, true);

    // attach shortcut keys
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey('0', 'engine', { }, { level: 0 });
      renderer.keyboardControls.bindKey('1', 'engine', { }, { level: 1 });
      renderer.keyboardControls.bindKey('2', 'engine', { }, { level: 2 });
      renderer.keyboardControls.bindKey('3', 'engine', { }, { level: 3 });
      renderer.keyboardControls.bindKey('4', 'engine', { }, { level: 4 });
      renderer.keyboardControls.bindKey('5', 'engine', { }, { level: 5 });
    }
  }

  // watch player ship for the engine
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {
    this.draw(playerShip.engine);
  }

  // uses morphdom to reduce changes
  draw(engine, addHandlers) {
    if (addHandlers === undefined) addHandlers = false;

    // create gui and add to el

    // add to the el
    // morphdom(target, source);

    // if we want handlers then add to the elements in the page


  }

}
