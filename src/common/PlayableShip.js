import { PhysicalObject2D, BaseTypes, TwoVector } from 'lance-gg';
import Hulls from './Hulls';
import Ship from './Ship';
import Systems from './Systems';
import Waypoint from './Waypoint';

let game = null;

export default class PlayableShip extends Ship {

    constructor(gameEngine, options, props) {
      super(gameEngine, options, props);
      this.playable = 1;

      let systems = new Systems();
      this.power = systems.pack();
    }

    static get netScheme() {
        return Object.assign({
            helmPlayerId: { type: BaseTypes.TYPES.INT16 },
            navPlayerId: { type: BaseTypes.TYPES.INT16 },
            signalsPlayerId: { type: BaseTypes.TYPES.INT16 },
            captainPlayerId: { type: BaseTypes.TYPES.INT16 },
            engineerPlayerId: { type: BaseTypes.TYPES.INT16 },
            waypoints: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.CLASSINSTANCE
            },
            power: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.INT16
            },
            weaponStock: { // only playable ships have limited ammo
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.INT16 // 0=PDC, n-1=torp type - value = ammo
            },
            fuel: { type: BaseTypes.TYPES.INT16 },
            oxygen: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    unpackPowerGrid() {
      this.grid = new Systems();
      this.grid.unpack(this.power);
    }
    // updates the circle body used to watch for senssor hits
    updateSenseorRange() {

      if (this.shapeSensor) {
        let hullData = this.getPowerAdjustedHullData();
        this.shapeSensor.radius = hullData.scanRanges[1];
      }

    }

    getActiveTubes() {
        if (!this.grid) this.unpackPowerGrid();

        let hullData = this.getHullData();
        let systems = hullData.systems;
        let max = this.tubes.length;
        let efficiency = this.grid.getEfficiency(systems['SYS_TORPS']);
        max = max * efficiency;
        return Math.floor(max);
    }

    getConsolesEfficiency() {
      if (!this.grid) this.unpackPowerGrid();

      let hullData = this.getHullData();
      let systems = hullData.systems;
      return this.grid.getEfficiency(systems['SYS_CONSOLES']);
    }

    getNavComEfficiency() {
      if (!this.grid) this.unpackPowerGrid();

      let hullData = this.getHullData();
      let systems = hullData.systems;
      return this.grid.getEfficiency(systems['SYS_NAV']);
    }

    getReloaderEfficiency() {
      if (!this.grid) this.unpackPowerGrid();

      let hullData = this.getHullData();
      let systems = hullData.systems;
      return this.grid.getEfficiency(systems['SYS_RELOAD']);
    }

    getLifeSupportEfficiency() {
      if (!this.grid) this.unpackPowerGrid();

      let hullData = this.getHullData();
      let systems = hullData.systems;
      return this.grid.getEfficiency(systems['SYS_LIFE']);
    }

    getFuelProductionEfficiency() {
      if (!this.grid) this.unpackPowerGrid();

      let hullData = this.getHullData();
      let systems = hullData.systems;
      return this.grid.getEfficiency(systems['SYS_FUEL']);
    }

    getPowerAdjustedHullData() {

      // start with standard hull data
      let hullData = Object.assign({}, this.getHullData());
      if (!this.grid) this.unpackPowerGrid();

      // adjust using systems power, gameEngine will
      // have unpacked power into this.grid before anything else
      // so we can use that
      let updatedHullData = {};
      let systems = hullData.systems;
      let systemKeys = Object.keys(systems);
      for (let i = 0; i < systemKeys.length; i++) {


          let systemKey = systemKeys[i];
          // console.log(systemKey);

          let efficiency = this.grid.getEfficiency(systems[systemKey]);
          if (systemKey == 'SYS_SENSORS') {
            updatedHullData['scanRanges'] = [hullData['scanRanges'][0], hullData['scanRanges'][1] * efficiency];
          } else if (systemKey == 'SYS_ENGINE') {
            updatedHullData['thrust'] = hullData['thrust'] * efficiency;
          } else if (systemKey == 'SYS_MANEUVER') {
            updatedHullData['maneuver'] = hullData['maneuver'] * efficiency;
          } else if (systemKey == 'SYS_PDC') {
            updatedHullData['pdc'] = Object.assign({}, hullData['pdc']);
            if (hullData['pdc']) {
              updatedHullData['pdc']['rotationRate'] = hullData['pdc']['rotationRate'] * efficiency;
            }
          }
      }

      return Object.assign(hullData, updatedHullData);
    }

    loadTorp(tube, torpType) {

      // check stock and only load if we have stock
      if (torpType == 0) {
        // unload, adds back to stock
        this.weaponStock[this.tubes[tube]] = this.weaponStock[this.tubes[tube]] + 1;
        this.tubes[tube] = torpType;

      } else if (this.weaponStock[torpType] > 0) {
        // super(tube, torpType);
        this.tubes[tube] = torpType;
        this.weaponStock[torpType] = this.weaponStock[torpType] - 1;
      }

    }

    addWaypoint(objId, orbit) {
        let currentWaypointIndex = this.waypoints.findIndex(function(wp) {
            return wp.objId == objId;
        });

        if (currentWaypointIndex >= 0) {
            this.waypoints[currentWaypointIndex].orbit = orbit;
        } else {
          let wp = new Waypoint();
          wp.objId = objId;
          wp.orbit = orbit;
          this.waypoints.push(wp);
        }
    }

    removeWaypoint(objId) {

      let currentWaypointIndex = this.waypoints.findIndex(function(wp) {
          return wp.objId == objId;
      });

        if (currentWaypointIndex >= 0) {
            this.waypoints.splice(currentWaypointIndex, 1);
            // note - delete this.waypoints[currentWaypointIndex] didn't work!!!
        }
    }

    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);
        game = gameEngine;
    }

    onRemoveFromWorld(gameEngine) {
        game.physicsEngine.world.removeBody(this.physicsObj);

        if (this.pdc) {
          game.removeObjectFromWorld(this.pdc);
        }

        if (this.damage && this.damage >= this.getMaxDamage()) {

          // remove players
          this.helmPlayerId = -1;
          this.navPlayerId = -1;
          this.signalsPlayerId = -1;
          this.captainPlayerId = -1;
          this.engineerPlayerId = -1;

          // was destroyed, so tell the UI
          gameEngine.emitonoff.emit('explosion', this);
        }
    }

    toString() {
        return `PlayableShip::${super.toString()} name=${this.name}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.helmPlayerId = other.helmPlayerId;
        this.navPlayerId = other.navPlayerId;
        this.signalsPlayerId = other.signalsPlayerId;
        this.captainPlayerId = other.captainPlayerId;
        this.engineerPlayerId = other.engineerPlayerId;
        this.waypoints = other.waypoints;
        this.fuel = other.fuel;
        this.power = other.power;
        this.weaponStock = other.weaponStock;
        this.oxygen = other.oxygen;
    }
}
