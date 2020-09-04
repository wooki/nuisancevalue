import {h, createProjector} from 'maquette';

import Hulls from '../../../common/Hulls';
import SolarObjects from '../../../common/SolarObjects';

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

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    this.projector.scheduleRender();
  }

  createLine(key, data) {
    return h('div.line.'+key, {
      key: "line-"+key
    }, [
      h('label', {key: 'label-'+key}, [key.replace('_', ' ')]),
      h('data', {key: 'data-'+key}, [data.toString()])
    ]);
  }

  render() {

    let lines = [];

    if (this.playerShip) {

      let hullData = this.playerShip.getPowerAdjustedHullData();
      let torpTypes = Hulls['torpedo'].types;

      // hull damage
      let currentDamage = this.playerShip.damage;
      let maxDamage = this.playerShip.getMaxDamage();
      let percentDamage = 0;
      if (currentDamage > 0) {
          percentDamage = Math.round(currentDamage / maxDamage);
      }

      lines.push(this.createLine("Hull", hullData.name));
      lines.push(this.createLine("Hull_Damage", percentDamage + "%"));

      // oxygen remaining
      lines.push(this.createLine("Oxygen", Math.round(this.playerShip.oxygen) + "%"));

      // fuel remaining
      lines.push(this.createLine("Fuel", Math.round(this.playerShip.fuel) + "/" + hullData.fuel));

      // Ammo stocks
      if (hullData.maxWeaponStock[0] && (this.playerShip.weaponStock[0] || this.playerShip.weaponStock[0] === 0)) {
        lines.push(this.createLine("PDC_Rounds", this.playerShip.weaponStock[0] + "/" + hullData.maxWeaponStock[0]));
      }

      // torp ammo stocks
      for (let i = 0; i < torpTypes.length; i++) {

        let torpTypeId = i+1;
        if (hullData.maxWeaponStock[torpTypeId] && (this.playerShip.weaponStock[torpTypeId] || this.playerShip.weaponStock[torpTypeId] === 0)) {
          lines.push(this.createLine("Torpedoes_-_" + torpTypes[i].name.replace(' ', '_'), this.playerShip.weaponStock[torpTypeId] + "/" + hullData.maxWeaponStock[torpTypeId]));
        }
      }

      // show some engine data
      let accn1 = (hullData.thrust / hullData.mass);
      let accn2 = (hullData.thrust*2 / hullData.mass);
      let accn3 = (hullData.thrust*3 / hullData.mass);
      let accn4 = (hullData.thrust*4 / hullData.mass);
      let accn5 = (hullData.thrust*5 / hullData.mass);
      let timeTo100 = (100 / accn5);
      let timeTo500 = (500 / accn5);
      let timeTo1000 = (1000 / accn5);

      lines.push(this.createLine("Engine_1", accn1.toFixed(3) + SolarObjects.units.speed+'/s'));
      lines.push(this.createLine("Engine_2", accn2.toFixed(3) + SolarObjects.units.speed+'/s'));
      lines.push(this.createLine("Engine_3", accn3.toFixed(3) + SolarObjects.units.speed+'/s'));
      lines.push(this.createLine("Engine_4", accn4.toFixed(3) + SolarObjects.units.speed+'/s'));
      lines.push(this.createLine("Engine_5", accn5.toFixed(3) + SolarObjects.units.speed+'/s'));
      lines.push(this.createLine("Δ100", SolarObjects.units.speed+" in "+timeTo100.toFixed(3)+"s"));
      lines.push(this.createLine("Δ500", SolarObjects.units.speed+" in "+timeTo500.toFixed(3)+"s"));
      lines.push(this.createLine("Δ1000", SolarObjects.units.speed+" in "+timeTo1000.toFixed(3)+"s"));
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
