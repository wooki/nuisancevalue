import {h, createProjector} from 'maquette';

import Hulls from '../../../common/Hulls';

// Show damage, hit points, ammo stocks etc.
// HTML for now
export default class EngineeringDataControl {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 60,
      height: 372,
      zIndex: 1,
      baseUrl: '/',
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    this.renderer = renderer;

    // get the torpedo types
    this.torpTypes = Hulls["torpedo"].types;

    // draw first with no tubes (depends on ship hull)
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // watch player ship for
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {
    this.playerShip = playerShip;
    this.projector.scheduleRender();
  }

  createLine(key, data) {
    return h('div.line', {
      key: "line-"+key
    }, [
      h('label', {}, [key]),
      h('data', {}, [data.toString()])
    ]);
  }

  render() {

    let lines = [];

    if (this.playerShip) {

      let hullData = this.playerShip.getHullData();
      let torpTypes = Hulls['torpedo'].types;

      // hull damage
      let currentDamage = this.playerShip.damage;
      let maxDamage = this.playerShip.getMaxDamage();
      let percentDamage = 0;
      if (currentDamage > 0) {
          percentDamage = Math.round(currentDamage / maxDamage);
      }

      lines.push(this.createLine("Hull Damage", percentDamage + "%"));

      // fuel remaining
      lines.push(this.createLine("Fuel", Math.round(this.playerShip.fuel) + "/" + hullData.fuel));

      // Ammo stocks
      if (hullData.maxWeaponStock[0] && (this.playerShip.weaponStock[0] || this.playerShip.weaponStock[0] === 0)) {
        lines.push(this.createLine("PDC Rounds", this.playerShip.weaponStock[0] + "/" + hullData.maxWeaponStock[0]));
      }

      // torp ammo stocks
      for (let i = 0; i < torpTypes.length; i++) {

        let torpTypeId = i+1;
        if (hullData.maxWeaponStock[torpTypeId] && (this.playerShip.weaponStock[torpTypeId] || this.playerShip.weaponStock[torpTypeId] === 0)) {
          lines.push(this.createLine("Torpedos " + torpTypes[i].name, this.playerShip.weaponStock[torpTypeId] + "/" + hullData.maxWeaponStock[torpTypeId]));
        }
      }

    }

    return h('div.nv.ui', {
      key: "data",
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
      },
      [h('div.data', lines)]
    );
  }

}
