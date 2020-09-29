import { PhysicalObject2D, BaseTypes } from 'lance-gg';
import Hulls from './Hulls';

let game = null;
let p2 = null;

export default class Torpedo extends PhysicalObject2D {

  constructor(gameEngine, options, props) {
      super(gameEngine, options, props);
      this.texture = "Torpedo";
  }

  static get netScheme() {
      return Object.assign({
        targetId: { type: BaseTypes.TYPES.INT32 },
        fuel: { type: BaseTypes.TYPES.INT16 },
        engine: { type: BaseTypes.TYPES.UINT8 },
        torpType: { type: BaseTypes.TYPES.UINT8 },
        sensed: { type: BaseTypes.TYPES.INT16 }, // bit mask indicating state for each faction
        scanned: { type: BaseTypes.TYPES.INT16 }, // bit mask indicating state for each faction
      }, super.netScheme);
  }

  get bending() {
    return {
      position: { percent: 0.9, min: 0.0 },
      velocity: { percent: 0.9, min: 0.0 },
      angularVelocity: { percent: 0.3 },
      angleLocal: { percent: 0.3 }
    }
  };

  // apply two forces opposite corners to create rotation
  applyManeuver(maneuver) {
      let hullData = this.torpData;

      let height = hullData.size;
      let width = hullData.size * hullData.width;
      let halfWidth = Math.floor(width * 0.5);

      if (maneuver == 'l') {

          if (this.physicsObj.angularVelocity > 0 && this.physicsObj.angularVelocity < 0.5) {
              this.physicsObj.angularVelocity = 0;
          } else {
              this.physicsObj.applyForceLocal([0 - hullData.maneuver, 0], [halfWidth, 0]);
              this.physicsObj.applyForceLocal([hullData.maneuver, 0], [halfWidth, height]);
          }

      } else if (maneuver == 'r') {

          if (this.physicsObj.angularVelocity < 0 && this.physicsObj.angularVelocity > -0.5) {
              this.physicsObj.angularVelocity = 0;
          } else {
              this.physicsObj.applyForceLocal([hullData.maneuver, 0], [halfWidth, 0]);
              this.physicsObj.applyForceLocal([0 - hullData.maneuver, 0], [halfWidth, height]);
          }

      }

  }

  getHullData() {
    return this.torpData;
  }

  get torpData() {
    let td = Object.assign({}, Hulls['torpedo']);
    if (this.torpType || this.torpType == 0) {
      td = Object.assign(td, Hulls['torpedo'].types[this.torpType]);
    }
    return td;
  }

  get hull() {
    return "torpedo";
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

  get payload() {
    return this.torpData.payload;
  }

  get aiScript() {
    return 1; // torp ai
  }

  get thrust() {
    return this.torpData.thrust;
  }

  get maxClosing() {
    return this.torpData.maxClosing;
  }

  // if the ship has active engines then apply force
  applyEngine() {
      // let hullData = Hulls[this.hull];

      if (this.engine && this.engine > 0) {
        if (this.fuel > 0) {
          this.physicsObj.applyForceLocal([0, this.thrust]); // engine only fires 1
        }
        this.fuel = this.fuel - this.engine;
      }
  }

  onAddToWorld() {
        game = this.gameEngine;
        p2 = game.physicsEngine.p2;

        this.physicsObj = new p2.Body({
            mass: this.mass, damping: 0, angularDamping: 0,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y],
            angle: this.angle,
            angularVelocity: this.angularVelocity
        });

        let hullData = this.torpData;

         // Create bullet shape
        let shape = new p2.Box({
            height: hullData.size,
            width: hullData.size * hullData.width,
            collisionGroup: game.TORPEDO,
            collisionMask: game.ASTEROID | game.SHIP | game.PLANET | game.TORPEDO | game.PDC | game.SCAN
        });
        this.physicsObj.addShape(shape);
        game.physicsEngine.world.addBody(this.physicsObj);

        this.gameEngine.emitonoff.emit('torp', this);
    }

    onRemoveFromWorld(gameEngine) {
        game.physicsEngine.world.removeBody(this.physicsObj);

        // was destroyed, so tell the UI
        gameEngine.emitonoff.emit('explosion', this);
    }

    syncTo(other) {
        super.syncTo(other);
        this.targetId = other.targetId;
        this.fuel = other.fuel;
        this.engine = other.engine;
        this.torpType = other.torpType;
        this.scanned = other.scanned;
        this.sensed = other.sensed;
    }

    toString() {
        return `Torpedo::${super.toString()}`;
    }
}
