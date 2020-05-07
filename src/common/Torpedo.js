import { PhysicalObject2D, BaseTypes } from 'lance-gg';
import Hulls from './Hulls';

let game = null;
let p2 = null;

export default class Torpedo extends PhysicalObject2D {

  constructor(gameEngine, options, props) {
      super(gameEngine, options, props);
      this.hull = "torpedo";
      this.size = 30;
  }

  static get netScheme() {
      return Object.assign({
        targetId: { type: BaseTypes.TYPES.INT16 },
        fuel: { type: BaseTypes.TYPES.INT16 },
        engine: { type: BaseTypes.TYPES.UINT8 }
      }, super.netScheme);
  }

  // if the ship has active engines then apply force
  applyEngine() {
      let hullData = Hulls[this.hull];

      if (this.engine && this.engine > 0) {
          this.physicsObj.applyForceLocal([0, this.engine * hullData.thrust]);
      }
  }

  onAddToWorld() {
        game = this.gameEngine;
        p2 = game.physicsEngine.p2;

        this.physicsObj = new p2.Body({
            mass: this.mass, damping: 0, angularDamping: 0,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y]
        });

         // Create bullet shape
        let shape = new p2.Circle({
            radius: (this.size/2),
            collisionGroup: game.TORPEDO, // Belongs to the BULLET group
            collisionMask: game.ASTEROID | game.SHIP | game.PLANET | game.TORPEDO
        });
        this.physicsObj.addShape(shape);
        game.physicsEngine.world.addBody(this.physicsObj);
    }

    onRemoveFromWorld(gameEngine) {
        game.physicsEngine.world.removeBody(this.physicsObj);
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
