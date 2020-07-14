import { PhysicalObject2D, BaseTypes, TwoVector } from 'lance-gg';
import Hulls from './Hulls';
import Ship from './Ship';

let game = null;

export default class PlayableShip extends Ship {

    constructor(gameEngine, options, props) {
      super(gameEngine, options, props);
      this.playable = 1;
    }

    static get netScheme() {
        return Object.assign({
            name: { type: BaseTypes.TYPES.STRING },
            size: { type: BaseTypes.TYPES.INT16 },
            hull: { type: BaseTypes.TYPES.STRING },
            engine: { type: BaseTypes.TYPES.UINT8 },
            helmPlayerId: { type: BaseTypes.TYPES.UINT8 },
            navPlayerId: { type: BaseTypes.TYPES.UINT8 },
            signalsPlayerId: { type: BaseTypes.TYPES.UINT8 },
            captainPlayerId: { type: BaseTypes.TYPES.UINT8 },
            engineerPlayerId: { type: BaseTypes.TYPES.UINT8 },
            commsScript: { type: BaseTypes.TYPES.UINT8 },
            dockedCommsScript: { type: BaseTypes.TYPES.UINT8 },
            commsState: { type: BaseTypes.TYPES.UINT8 },
            commsTargetId: { type: BaseTypes.TYPES.INT16 }, // currently talking to
            targetId: { type: BaseTypes.TYPES.INT16 },
            dockedId: { type: BaseTypes.TYPES.INT16 },
            aiScript: { type: BaseTypes.TYPES.UINT8 },
            aiPlan: { type: BaseTypes.TYPES.UINT8 },
            docked: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.CLASSINSTANCE
            },
            waypoints: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.STRING
            },
            tubes: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.UINT8 // 0=unloaded,n=torp type
            },
            fuel: { type: BaseTypes.TYPES.INT16 },
            damage: { type: BaseTypes.TYPES.INT16 },
            pdcAngle: { type: BaseTypes.TYPES.FLOAT32 },
            pdcState: { type: BaseTypes.TYPES.UINT8 } //0=off,1=active,2=firing
        }, super.netScheme);
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
        this.name = other.name;
        this.size = other.size;
        this.hull = other.hull;
        this.engine = other.engine;
        this.helmPlayerId = other.helmPlayerId;
        this.navPlayerId = other.navPlayerId;
        this.signalsPlayerId = other.signalsPlayerId;
        this.captainPlayerId = other.captainPlayerId;
        this.engineerPlayerId = other.engineerPlayerId;
        this.waypoints = other.waypoints;
        this.commsScript = other.commsScript;
        this.dockedCommsScript = other.dockedCommsScript;
        this.commsState = other.commsState;
        this.commsTargetId = other.commsTargetId;
        this.dockedId = other.dockedId;
        this.targetId = other.targetId;
        this.aiScript = other.aiScript;
        this.aiPlan = other.aiPlan;
        this.docked = other.docked;
        this.fuel = other.fuel;
        this.tubes = other.tubes;
    }
}
