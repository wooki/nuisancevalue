import { PhysicalObject2D, BaseTypes, TwoVector } from 'lance-gg';
import Hulls from './Hulls';
import Factions from './Factions';
import Utils from './Utils/Utils.js';

let game = null;
let p2 = null;

export default class Ship extends PhysicalObject2D {

    constructor(gameEngine, options, props) {
      super(gameEngine, options, props);
      this.playable = 0;
      this.fuel = 10000;
      this.aiAngle = null;
      this.factions = new Factions();
    }

    static get netScheme() {
        return Object.assign({
            name: { type: BaseTypes.TYPES.STRING },
            hull: { type: BaseTypes.TYPES.STRING },
            engine: { type: BaseTypes.TYPES.UINT8 },
            commsScript: { type: BaseTypes.TYPES.UINT8 },
            commsState: { type: BaseTypes.TYPES.UINT8 },
            commsTargetId: { type: BaseTypes.TYPES.INT16 }, // currently talking to
            targetId: { type: BaseTypes.TYPES.INT32 },
            dockedId: { type: BaseTypes.TYPES.INT32 },
            aiAngle: { type: BaseTypes.TYPES.UINT8 },
            aiScript: { type: BaseTypes.TYPES.UINT8 },
            aiPlan: { type: BaseTypes.TYPES.UINT8 },
            faction: { type: BaseTypes.TYPES.INT16 },
            sensed: { type: BaseTypes.TYPES.INT16 }, // bit mask indicating state for each faction
            scanned: { type: BaseTypes.TYPES.INT16 }, // bit mask indicating state for each faction
            docked: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.CLASSINSTANCE
            },
            tubes: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.UINT8 // 0=unloaded,n=torp type
            },
            damage: { type: BaseTypes.TYPES.INT16 },
            pdcAngle: { type: BaseTypes.TYPES.FLOAT32 },
            pdcState: { type: BaseTypes.TYPES.UINT8 } //0=off,1=active,2=firing
        }, super.netScheme);
    }

    // get bending() {
    //     return {
    //         position: { percent: 0.6 },
    //         velocity: { percent: 0.6 },
    //         angularVelocity: { percent: 0.6 },
    //         angle: { percent: 0.6 }
    //     }
    // }

    getHullData() {
      return Hulls[this.hull];
    }

    // used to be a netScheme property but now we always use hull
    get size() {
        return this.getHullData().size;
    }

    getPowerAdjustedHullData() {
      return this.getHullData();
    }

    // based on hull size
    getMaxDamage() {
      let hull = this.getHullData();
      // return Math.floor((hull.size * hull.size * hull.width) / 50);
      return hull['damage'] || Math.floor((hull.size * hull.size * hull.width) / 100);
    }

    loadTorp(tube, torpType) {
      this.tubes[tube] = torpType;
    }

    sensedBy(factionId) {
      this.sensed = this.sensed | factionId;
    }

    unsensedBy(factionId) {
      this.sensed = this.sensed ^ factionId;
    }

    scannedBy(factionId) {
      this.scanned = this.scanned | factionId;
    }

    isSensedBy(factionId) {
      return (this.sensed & factionId) > 0;
    }

    isScannedBy(factionId) {
      return (this.scanned & factionId) > 0;
    }

    isFriend(factionId) {
      return this.factions.isFriendly(this.faction, factionId);
    }

    isHostile(factionId) {
      return this.factions.isHostile(this.faction, factionId);
    }

    // if the ship has active engines then apply force
    applyEngine() {
        let hullData = this.getPowerAdjustedHullData();

        if (this.dockedId !== null && this.dockedId >= 0) {
            return; // can't do this while docked
        }

        if (this.engine && this.engine > 0) {
          if (this.fuel <= 0) {
            this.engine = 0;
            return;
          }
          this.fuel = this.fuel - (this.engine/5);
          this.physicsObj.applyForceLocal([0, this.engine * hullData.thrust]);
        }
    }

    // apply two forces opposite corners to create rotation
    applyManeuver(maneuver, overrideManeuver) {
        let hullData = this.getPowerAdjustedHullData();

        let maneuverForce = hullData.maneuver;

        // allow ai to turn much more slowly
        if (overrideManeuver) {
          maneuverForce = overrideManeuver;
        }


        if (this.dockedId !== null && this.dockedId >= 0) {
            return; // can't do this while docked
        }

        // if (this.fuel <= 0) return;
        // this.fuel = this.fuel - 0.01;

        if (maneuver == 'l') {

          this.aiAngle = null;
          if (this.physicsObj.angularVelocity > 0) {
              this.physicsObj.angularVelocity = 0;
            } else {
              this.physicsObj.angularVelocity = this.physicsObj.angularVelocity - 0.5;
            }

        } else if (maneuver == 'r') {

            this.aiAngle = null;
            if (this.physicsObj.angularVelocity < 0) {
              this.physicsObj.angularVelocity = 0;
            } else {
              this.physicsObj.angularVelocity = this.physicsObj.angularVelocity + 0.5;
            }


        } else if (!isNaN(maneuver)) {

            // apply force towards angle
            let angle = parseFloat(maneuver);
            if (angle < 0) angle = 360 + angle;
            this.aiAngle = angle;
            let currentAngle = Utils.radiansToDegrees(this.physicsObj.angle);
            let deltaAngle = currentAngle - angle;
            
            if (Math.abs(deltaAngle) > 1) {
              if (deltaAngle > 0 && deltaAngle < 180) {
                this.physicsObj.angularVelocity = -2;
              } else {
                this.physicsObj.angularVelocity = 2;
              }
            } else {
              this.physicsObj.angularVelocity = 0;
            }
        }

    }

    dock(dockWith) {

        // update our data
        this.dockedId = dockWith;
        this.targetId = dockWith;
        if (this.pdcState > 0) this.pdcState = 0;
    }

    undock(undockFrom) {

        this.dockedId = -1;

        // position just behind dock with slightly slower velocity
        this.position = new TwoVector(undockFrom.physicsObj.position[0] + undockFrom.size + this.size + 100, undockFrom.physicsObj.position[1]);
        this.velocity = new TwoVector(0 + undockFrom.physicsObj.velocity[0], undockFrom.physicsObj.velocity[1]);

    }

    onAddToWorld(gameEngine) {
        game = gameEngine;
        p2 = gameEngine.physicsEngine.p2;

        // get the hull so shape can match image dimensions
        let hullData = this.getHullData();

        // Add ship physics
        this.shape = new p2.Circle({
            radius: Math.floor(this.size / 2),
            collisionGroup: game.SHIP,
            collisionMask: game.ASTEROID | game.SHIP | game.PLANET | game.TORPEDO | game.PDC | game.SCAN
        });
        // let shape = this.shape = new p2.Box({
        //     width: this.size,
        //     height: Math.floor(this.size / 3),
        //     collisionGroup: game.SHIP,
        //     collisionMask: game.ASTEROID | game.SHIP
        // });

        // depends on hull !
        // fromPolygon ---> http://schteppe.github.io/p2.js/docs/classes/Body.html#method_fromPolygon

        this.physicsObj = new p2.Body({
            mass: this.mass,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y],
            angle: this.angle,
            damping: 0, angularDamping: 0 });
        this.physicsObj.addShape(this.shape);
        gameEngine.physicsEngine.world.addBody(this.physicsObj);

        // also add a visual scan body to detect collision with objects to scan them
        this.shapeVisualScan = new p2.Circle({
            sensor: true, // we want to detect this but not actually collide
            radius: hullData.scanRanges[0],
            collisionGroup: game.SCAN,
            collisionMask: game.ASTEROID | game.SHIP | game.TORPEDO
        });
        this.physicsObjVisualScan = new p2.Body({
            mass: 0.0000001,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y],
            angle: this.angle,
            damping: 0, angularDamping: 0 });
        this.physicsObjVisualScan.addShape(this.shapeVisualScan);
        gameEngine.physicsEngine.world.addBody(this.physicsObjVisualScan);

        this.constraintVisualScan = new p2.DistanceConstraint(this.physicsObj, this.physicsObjVisualScan, {
          collideConnected: false
        });
        gameEngine.physicsEngine.world.addConstraint(this.constraintVisualScan);

        // also add a sensor body to detect collision with objects to scan them
        this.shapeSensor = new p2.Circle({
            sensor: true, // we want to detect this but not actually collide
            radius: hullData.scanRanges[1],
            collisionGroup: game.SCAN,
            collisionMask: game.ASTEROID | game.SHIP | game.TORPEDO
        });
        this.physicsObjSensor = new p2.Body({
            mass: 0.0000001,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y],
            angle: this.angle,
            damping: 0, angularDamping: 0 });
        this.physicsObjSensor.addShape(this.shapeSensor);
        gameEngine.physicsEngine.world.addBody(this.physicsObjSensor);

        this.constraintSensor = new p2.DistanceConstraint(this.physicsObj, this.physicsObjSensor, {
          collideConnected: false
        });
        gameEngine.physicsEngine.world.addConstraint(this.constraintSensor);
    }

    onRemoveFromWorld(gameEngine) {
      game.physicsEngine.world.removeConstraint(this.constraintVisualScan);
      game.physicsEngine.world.removeConstraint(this.constraintSensor);
      game.physicsEngine.world.removeBody(this.physicsObjVisualScan);
      game.physicsEngine.world.removeBody(this.physicsObjSensor);
      game.physicsEngine.world.removeBody(this.physicsObj);

        if (this.pdc) {
          game.removeObjectFromWorld(this.pdc);
        }

        if (this.damage && this.damage >= this.getMaxDamage()) {

          // was destroyed, so tell the UI
          gameEngine.emitonoff.emit('explosion', this);
        }
    }

    toString() {
        return `Ship::${super.toString()} name=${this.name}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.name = other.name;
        this.hull = other.hull;
        this.engine = other.engine;
        this.commsScript = other.commsScript;
        this.commsState = other.commsState;
        this.commsTargetId = other.commsTargetId;
        this.dockedId = other.dockedId;
        this.targetId = other.targetId;
        this.aiScript = other.aiScript;
        this.aiPlan = other.aiPlan;
        this.faction = other.faction;
        this.scanned = other.scanned;
        this.sensed = other.sensed;
        this.docked = other.docked;
        this.tubes = other.tubes;
    }
}
