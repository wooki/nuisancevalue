import { PhysicalObject2D } from 'lance-gg';

let game = null;
let p2 = null;

export default class Torpedo extends PhysicalObject2D {

  static get netScheme() {
      return Object.assign({
        targetId: { type: BaseTypes.TYPES.INT16 },
        fuel: { type: BaseTypes.TYPES.INT16 }
      }, super.netScheme);
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
            radius: 10,
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
    }

    toString() {
        return `Torpedo::${super.toString()}`;
    }
}
