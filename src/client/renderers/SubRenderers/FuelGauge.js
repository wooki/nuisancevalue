import {h, createProjector} from 'maquette';
import Hulls from '../../../common/Hulls';

// Buttons for setting the maneuver direction of ship
// HTML for now
export default class ManeuverControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 126,
      height: 63,
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
    // this.renderer = renderer;

    // draw first assuming engine 0
    this.fuel = 0;
    this.maxFuel = 0;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // watch player ship for the engine
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    let hullData = Hulls[playerShip.hull];
    this.fuel = Math.round(playerShip.fuel);
    this.maxFuel = Math.round(hullData.fuel);

    this.projector.scheduleRender();
  }

  render() {

    let fuelDesc = this.fuel + "/" + this.maxFuel;

    let led = null;
    if (this.fuel < this.maxFuel * 0.2) {
      led = h('div.line.LED.alert', []);
    }

    return h('div.nv.ui.col', {
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px'
      }
    },
    [
      h('div.data', [
        led,
        h('div.line', [
          h('label', ["Fuel"]),
          h('data', [fuelDesc])
        ])
      ])
    ]);
  }

}
