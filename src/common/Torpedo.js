import { PhysicalObject2D, BaseTypes } from 'lance-gg';
import Hulls from './Hulls';

let game = null;
let p2 = null;

export default class Torpedo extends PhysicalObject2D {

  constructor(gameEngine, options, props) {
      super(gameEngine, options, props);
      this.hull = "torpedo";
      this.size = Hulls['torpedo'].size;
      this.payload = Hulls['torpedo'].payload;
      this.aiScript = 0; // torpedo ai script
  }

  static get netScheme() {
      return Object.assign({
        targetId: { type: BaseTypes.TYPES.INT16 },
        fuel: { type: BaseTypes.TYPES.INT16 },
        engine: { type: BaseTypes.TYPES.UINT8 }
      }, super.netScheme);
  }

  applyManeuver(maneuver) {
        let hullData = Hulls[this.hull];

        if (maneuver == 'l') {

            if (this.physicsObj.angularVelocity > 0 && this.physicsObj.angularVelocity < 0.2) {
                this.physicsObj.angularVelocity = 0;
            } else {
                // this.physicsObj.applyForceLocal([0 - hullData.maneuver, 0], [Math.floor(this.size/2), 0]);
                // this.physicsObj.applyForceLocal([hullData.maneuver, 0], [Math.floor(this.size/2), this.size]);
                this.physicsObj.angularVelocity = this.physicsObj.angularVelocity - 0.5;
            }

        } else if (maneuver == 'r') {

            if (this.physicsObj.angularVelocity < 0 && this.physicsObj.angularVelocity > -0.2) {
                this.physicsObj.angularVelocity = 0;
            } else {
                // this.physicsObj.applyForceLocal([hullData.maneuver, 0], [Math.floor(this.size/2), 0]);
                // this.physicsObj.applyForceLocal([0 - hullData.maneuver, 0], [Math.floor(this.size/2), this.size]);
                this.physicsObj.angularVelocity = this.physicsObj.angularVelocity + 0.5;
            }

        }

    }

  // if the ship has active engines then apply force
  applyEngine() {
      let hullData = Hulls[this.hull];

      if (this.engine && this.engine > 0) {
        this.physicsObj.applyForceLocal([0, hullData.thrust]); // engine only fires 1
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

         // Create bullet shape
        let shape = new p2.Circle({
            radius: (this.size/2),
            collisionGroup: game.TORPEDO,
            collisionMask: game.ASTEROID | game.SHIP | game.PLANET | game.TORPEDO
        });
        this.physicsObj.addShape(shape);
        game.physicsEngine.world.addBody(this.physicsObj);
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
    }

    toString() {
        return `Torpedo::${super.toString()}`;
    }
}
