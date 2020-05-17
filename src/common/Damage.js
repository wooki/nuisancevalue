
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
    this.ENGINE_ALIGNMENT_LEFT = Math.pow(2, 5);
    this.ENGINE_ALIGNMENT_RIGHT = Math.pow(2, 6);
    this.WINDSCREEN_SCRATCHED = Math.pow(2, 7);
    this.MANEUVER_ALIGNMENT_LEFT = Math.pow(2, 8);
    this.MANEUVER_ALIGNMENT_RIGHT = Math.pow(2, 9);
    this.CARGO_LIFT = Math.pow(2, 10);
    this.LANDING_GEAR = Math.pow(2, 11);
    this.NETWORK_CONDUITS = Math.pow(2, 12);
    this.NOSE_CONE_DENTED = Math.pow(2, 13);
    this.PAINT_JOB_LEFT = Math.pow(2, 14);
    this.PAINT_JOB_RIGHT = Math.pow(2, 15);
    this.TOILET_FACILITIES = Math.pow(2, 16);
    this.DAMAGE_REPORT_MACHINE = Math.pow(2, 17);
    this.SENSOR_ALIGNMENT = Math.pow(2, 18);

    this.SENSORS = Math.pow(2, 19);
    this.COMPUTER_CORES = Math.pow(2, 20);
    this.INTERNAL_BULKHEADS = Math.pow(2, 21);
    this.EXTERNAL_BULKHEADS = Math.pow(2, 22);
    this.STRUCTURAL_INTEGRITY = Math.pow(2, 23);
    this.SLEEPING_QUARTERS = Math.pow(2, 24);
    this.MEDI_BAY = Math.pow(2, 25);
    this.CARGO_BAY = Math.pow(2, 26);
    this.ENGINE_OFFLINE = Math.pow(2, 27);
    this.ENGINE_STUCK = Math.pow(2, 28);
    this.MANEUVER_OFFLINE_LEFT = Math.pow(2, 29);
    this.MANEUVER_OFFLINE_RIGHT = Math.pow(2, 30);
    this.TORPEDO_LAUNCHER_LEFT = Math.pow(2, 31);
    this.TORPEDO_LAUNCHER_RIGHT = Math.pow(2, 32);
    this.POINT_DEFENCE_LASERS = Math.pow(2, 33);
    this.LIFE_SUPPORT = Math.pow(2, 34);

    this.LIGHT_DAMAGE = [
      this.HELM_CONSOLE_INTERFERENCE,
      this.NAV_CONSOLE_INTERFERENCE,
      this.SIGNALS_CONSOLE_INTERFERENCE,
      this.ENGINE_ALIGNMENT_LEFT,
      this.ENGINE_ALIGNMENT_RIGHT,
      this.WINDSCREEN_SCRATCHED,
      this.MANEUVER_ALIGNMENT_LEFT,
      this.MANEUVER_ALIGNMENT_RIGHT,
      this.CARGO_LIFT,
      this.LANDING_GEAR,
      this.NETWORK_CONDUITS,
      this.NOSE_CONE_DENTED,
      this.PAINT_JOB_LEFT,
      this.PAINT_JOB_RIGHT,
      this.TOILET_FACILITIES,
      this.DAMAGE_REPORT_MACHINE,
      this.SENSOR_ALIGNMENT
    ];

    this.SEVERE_DAMAGE = [
      this.SENSORS,
      this.COMPUTER_CORES,
      this.INTERNAL_BULKHEADS,
      this.EXTERNAL_BULKHEADS,
      this.STRUCTURAL_INTEGRITY,
      this.SLEEPING_QUARTERS,
      this.MEDI_BAY,
      this.CARGO_BAY,
      this.ENGINE_OFFLINE,
      this.ENGINE_STUCK,
      this.MANEUVER_OFFLINE_LEFT,
      this.MANEUVER_OFFLINE_RIGHT,
      this.TORPEDO_LAUNCHER_LEFT,
      this.TORPEDO_LAUNCHER_RIGHT,
      this.POINT_DEFENCE_LASERS,
      this.LIFE_SUPPORT
    ];

    // use for all ships until we start adding custom damage for ships
    this.STANDARD_SYSTEMS = this.LIGHT_DAMAGE.reduce(function(d, l) { return d | l } ) | this.SEVERE_DAMAGE.reduce(function(d, l) { return d | l } );

    this.DAMAGE_NAMES = {};
    this.DAMAGE_NAMES[this.HELM_CONSOLE_INTERFERENCE] = "HELM_CONSOLE_INTERFERENCE";
    this.DAMAGE_NAMES[this.NAV_CONSOLE_INTERFERENCE] = "NAV_CONSOLE_INTERFERENCE";
    this.DAMAGE_NAMES[this.SIGNALS_CONSOLE_INTERFERENCE] = "SIGNALS_CONSOLE_INTERFERENCE";
    this.DAMAGE_NAMES[this.ENGINE_ALIGNMENT_LEFT] = "ENGINE_ALIGNMENT_LEFT";
    this.DAMAGE_NAMES[this.ENGINE_ALIGNMENT_RIGHT] = "ENGINE_ALIGNMENT_RIGHT";
    this.DAMAGE_NAMES[this.WINDSCREEN_SCRATCHED] = "WINDSCREEN_SCRATCHED";
    this.DAMAGE_NAMES[this.MANEUVER_ALIGNMENT_LEFT] = "MANEUVER_ALIGNMENT_LEFT";
    this.DAMAGE_NAMES[this.MANEUVER_ALIGNMENT_RIGHT] = "MANEUVER_ALIGNMENT_RIGHT";
    this.DAMAGE_NAMES[this.CARGO_LIFT] = "CARGO_LIFT";
    this.DAMAGE_NAMES[this.LANDING_GEAR] = "LANDING_GEAR";
    this.DAMAGE_NAMES[this.NETWORK_CONDUITS] = "NETWORK_CONDUITS";
    this.DAMAGE_NAMES[this.NOSE_CONE_DENTED] = "NOSE_CONE_DENTED";
    this.DAMAGE_NAMES[this.PAINT_JOB_LEFT] = "PAINT_JOB_LEFT";
    this.DAMAGE_NAMES[this.PAINT_JOB_RIGHT] = "PAINT_JOB_RIGHT";
    this.DAMAGE_NAMES[this.TOILET_FACILITIES] = "TOILET_FACILITIES";
    this.DAMAGE_NAMES[this.DAMAGE_REPORT_MACHINE] = "DAMAGE_REPORT_MACHINE";
    this.DAMAGE_NAMES[this.SENSOR_ALIGNMEN] = "SENSOR_ALIGNMEN";
    this.DAMAGE_NAMES[this.SENSORS] = "SENSORS";
    this.DAMAGE_NAMES[this.COMPUTER_CORES] = "COMPUTER_CORES";
    this.DAMAGE_NAMES[this.INTERNAL_BULKHEADS] = "INTERNAL_BULKHEADS";
    this.DAMAGE_NAMES[this.EXTERNAL_BULKHEADS] = "EXTERNAL_BULKHEADS";
    this.DAMAGE_NAMES[this.STRUCTURAL_INTEGRITY] = "STRUCTURAL_INTEGRITY";
    this.DAMAGE_NAMES[this.SLEEPING_QUARTERS] = "SLEEPING_QUARTERS";
    this.DAMAGE_NAMES[this.MEDI_BAY] = "MEDI_BAY";
    this.DAMAGE_NAMES[this.CARGO_BAY] = "CARGO_BAY";
    this.DAMAGE_NAMES[this.ENGINE_OFFLINE] = "ENGINE_OFFLINE";
    this.DAMAGE_NAMES[this.ENGINE_STUCK] = "ENGINE_STUCK";
    this.DAMAGE_NAMES[this.MANEUVER_OFFLINE_LEFT] = "MANEUVER_OFFLINE_LEFT";
    this.DAMAGE_NAMES[this.MANEUVER_OFFLINE_RIGHT] = "MANEUVER_OFFLINE_RIGHT";
    this.DAMAGE_NAMES[this.TORPEDO_LAUNCHER_LEFT] = "TORPEDO_LAUNCHER_LEFT";
    this.DAMAGE_NAMES[this.TORPEDO_LAUNCHER_RIGHT] = "TORPEDO_LAUNCHER_RIGHT";
    this.DAMAGE_NAMES[this.POINT_DEFENCE_LASERS] = "POINT_DEFENCE_LASERS";
    this.DAMAGE_NAMES[this.LIFE_SUPPORT] = "LIFE_SUPPORT";
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
