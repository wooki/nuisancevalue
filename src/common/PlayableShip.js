import { PhysicalObject2D, BaseTypes, TwoVector } from 'lance-gg';
import Hulls from './Hulls';
import Ship from './Ship';
import Systems from './Systems';

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
            helmPlayerId: { type: BaseTypes.TYPES.UINT8 },
            navPlayerId: { type: BaseTypes.TYPES.UINT8 },
            signalsPlayerId: { type: BaseTypes.TYPES.UINT8 },
            captainPlayerId: { type: BaseTypes.TYPES.UINT8 },
            engineerPlayerId: { type: BaseTypes.TYPES.UINT8 },
            waypoints: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.STRING
            },
            power: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.INT16
            },
            weaponStock: { // only playable ships have limited ammo
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.INT16 // 0=PDC, n-1=torp type - value = ammo
            },
            fuel: { type: BaseTypes.TYPES.INT16 }
        }, super.netScheme);
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

    addWaypoint(name, x, y) {
        let currentWaypointIndex = this.waypoints.findIndex(function(wp) {
            return wp.startsWith(name+',')
        });

        if (currentWaypointIndex >= 0) {
            this.waypoints[currentWaypointIndex] = name + "," + Math.round(x) + "," + Math.round(y);
        } else {
            this.waypoints.push(name + "," + Math.round(x) + "," + Math.round(y));
        }
    }

    removeWaypoint(name) {
        let currentWaypointIndex = this.waypoints.findIndex(function(wp) {
            return wp.startsWith(name+',')
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
    }
}
