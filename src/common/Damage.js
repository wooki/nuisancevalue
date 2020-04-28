
// Damage.  Split into Light and severe...
// if light damage is assigned and it happens again it can
// escalate to severe equivalent
// not all hulls implement all damage
export default class Damage {

  constructor() {

    // can be destroyed - idea if once all severe damage that can be assigned
    // to a hull, has been - you are destroyed
    this.DESTROYED = Math.pow(2, 1);

    // all damage consts so we can use bitwise masks
    this.HELM_CONSOLE_INTERFERENCE = Math.pow(2, 2);
    this.NAV_CONSOLE_INTERFERENCE = Math.pow(2, 3);
    this.SIGNALS_CONSOLE_INTERFERENCE = Math.pow(2, 4);
    this.ENGINE_OFFLINE = Math.pow(2, 5);
    this.MANEUVER_OFFLINE = Math.pow(2, 6);

    this.LIGHT_DAMAGE = [
      this.HELM_CONSOLE_INTERFERENCE,
      this.NAV_CONSOLE_INTERFERENCE,
      this.SIGNALS_CONSOLE_INTERFERENCE
    ];

    this.SEVERE_DAMAGE = [
      this.ENGINE_OFFLINE,
      this.MANEUVER_OFFLINE
    ];

    this.DAMAGE_NAMES = {};
    this.DAMAGE_NAMES[this.HELM_CONSOLE_INTERFERENCE] = "HELM_CONSOLE_INTERFERENCE";
    this.DAMAGE_NAMES[this.NAV_CONSOLE_INTERFERENCE] = "NAV_CONSOLE_INTERFERENCE";
    this.DAMAGE_NAMES[this.SIGNALS_CONSOLE_INTERFERENCE] = "SIGNALS_CONSOLE_INTERFERENCE";
    this.DAMAGE_NAMES[this.ENGINE_OFFLINE] = "ENGINE_OFFLINE";
    this.DAMAGE_NAMES[this.MANEUVER_OFFLINE] = "MANEUVER_OFFLINE";

  }

  // get a single damage item from the damageList that is also in the hullData
  getRandomDamageForHull(hullSystems, damageList) {
    let damage = damageList[Math.floor(Math.random()*damageList.length)];
    if ((hullSystems & damage) == 0) {
      damage = this.getRandomDamageForHull(hullSystems, damageList);
    }
    return damage;
  }

  // get n light and n severe damage conditions that apply
  // to the specified hull.  Returns an array.
  getRandomDamage(light, severe, hullSystems) {

    let damage = 0;

    for (let i = 0; i < light; i++) {
      damage = damage | this.getRandomDamageForHull(hullSystems, this.LIGHT_DAMAGE);
    }
    for (let i = 0; i < severe; i++) {
      damage = damage | this.getRandomDamageForHull(hullSystems, this.SEVERE_DAMAGE);
    }

    return damage;
  }

  // check if a ship has a specific damage
  hasDamage(damage, ship) {
    return (ship.damage & damage) > 0;
  }


}
