import { PhysicalObject2D, BaseTypes } from 'lance-gg';

let game = null;
let p2 = null;

export default class PDC extends PhysicalObject2D {

    static get netScheme() {
        return Object.assign({
            size: { type: BaseTypes.TYPES.INT32 }
        }, super.netScheme);
    }

    onAddToWorld(gameEngine) {
        game = gameEngine;
        p2 = gameEngine.physicsEngine.p2;

        // Add physics
        let shape = this.shape = new p2.Circle({
            radius: Math.floor(this.size / 2),
            collisionGroup: game.PDC,
            collisionMask: game.SHIP | game.PLANET | game.ASTEROID | game.TORPEDO
        });
        this.physicsObj = new p2.Body({
            mass: this.mass,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y],
            angle: this.angle, angularVelocity: this.angularVelocity,
            damping: 0, angularDamping: 0 });
        this.physicsObj.addShape(shape);
        gameEngine.physicsEngine.world.addBody(this.physicsObj);
    }

    onRemoveFromWorld(gameEngine) {
        game.physicsEngine.world.removeBody(this.physicsObj);
    }

    toString() {
        return `PDC::${super.toString()} size=${this.size}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.size = other.size;
    }
}
