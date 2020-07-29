import {h, createProjector} from 'maquette';

// Buttons for using the PDC and shortcut keys
// HTML for now
export default class PdcFireControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 252,
      height: 252,
      zIndex: 1,
      baseUrl: '/',
      keyboardControls: true,
      labels: {
        fire: 'PDC Fire',
        on: 'Online',
        off: 'Offline',
        l: '<',
        r: '>',
      }
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
    if (this.parameters.keyboardControls && renderer.keyboardControls) {
      renderer.keyboardControls.bindKey('up', 'pdcstate', { }, { direction: '+' });
      renderer.keyboardControls.bindKey('down', 'pdcstate', { }, { direction: '-' });
      renderer.keyboardControls.bindKey('left', 'pdcangle', { repeat: true }, { direction: '-' });
      renderer.keyboardControls.bindKey('right', 'pdcangle', { repeat: true }, { direction: '+' });
    }
  }

  // watch player ship for the engine
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;

    // not shown if ship has no PDC
    let hullData = this.playerShip.getHullData();
    if (!hullData.pdc) return;

    // draw
    if (this.projector) {
      // redraw
      this.projector.scheduleRender();
    } else {
      // first draw (delayed until we have a ship)
      this.projector = createProjector();
      this.projector.append(this.el, this.render.bind(this));
    }
  }

  offPDC() {
    this.renderer.client.pdcState(0);
  }

  onPDC() {
    this.renderer.client.pdcState(1);
  }

  firePDC() {
    this.renderer.client.pdcState(2);
  }

  leftPDC() {
    this.renderer.client.pdcAngle('-'); this.renderer.client.pdcAngle('-');
    this.renderer.client.pdcAngle('-'); this.renderer.client.pdcAngle('-');
    this.renderer.client.pdcAngle('-'); this.renderer.client.pdcAngle('-');
    this.renderer.client.pdcAngle('-'); this.renderer.client.pdcAngle('-');
    this.renderer.client.pdcAngle('-'); this.renderer.client.pdcAngle('-');
  }

  rightPDC() {
    this.renderer.client.pdcAngle('+'); this.renderer.client.pdcAngle('+');
    this.renderer.client.pdcAngle('+'); this.renderer.client.pdcAngle('+');
    this.renderer.client.pdcAngle('+'); this.renderer.client.pdcAngle('+');
    this.renderer.client.pdcAngle('+'); this.renderer.client.pdcAngle('+');
    this.renderer.client.pdcAngle('+'); this.renderer.client.pdcAngle('+');
  }

  createButton(label, active, onClick) {
      return h('button.key', {
        classes: {
          disabled: active
        },
        key: 'pdc-state-'+label,
        onclick: onClick
        },
        [label]
      );
  }

  render() {

    let pdcState = 0;
    if (this.playerShip) {
      pdcState = this.playerShip.pdcState;
    }

    return h('div.nv.ui.col.justify-end.stretch', {
      key: "pdc-fire-control",
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
      this.createButton(this.parameters.labels.fire, (pdcState == 2), this.firePDC.bind(this)),
      this.createButton(this.parameters.labels.on, (pdcState == 1), this.onPDC.bind(this)),
      this.createButton(this.parameters.labels.off, (pdcState == 0), this.offPDC.bind(this)),
      h('div.nv.ui.row.stretch.x-stretch', {
        key: "pdc-turn"
      }, [
        this.createButton(this.parameters.labels.l, false, this.leftPDC.bind(this)),
        this.createButton(this.parameters.labels.r, false, this.rightPDC.bind(this))
      ])
    ]);
  }

}
