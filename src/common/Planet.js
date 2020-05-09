import { PhysicalObject2D, BaseTypes } from 'lance-gg';

let game = null;
let p2 = null;

export default class Planet extends PhysicalObject2D {

    static get netScheme() {
        return Object.assign({
            size: { type: BaseTypes.TYPES.INT32 },
            texture: { type: BaseTypes.TYPES.STRING },
            fixedgravity: { type: BaseTypes.TYPES.STRING },
            ignoregravity: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    // get bending() {
    //     return {
    //         position: { max: 4.0 },
    //         angularVelocity: { percent: 0.0 },
    //         angleLocal: { percent: 0.0 }
    //     };
    // }

    onAddToWorld(gameEngine) {
        game = gameEngine;
        p2 = gameEngine.physicsEngine.p2;

        // Add ship physics
        let shape = this.shape = new p2.Circle({
            radius: Math.floor(this.size / 2),
            collisionGroup: game.PLANET,
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
        return `Planet::${super.toString()} texture=${this.texture} size=${this.size} fixedgravity=${this.fixedgravity} ignoregravity=${this.ignoregravity}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.size = other.size;
        this.texture = other.texture;
        this.fixedgravity = other.fixedgravity;
        this.ignoregravity = other.ignoregravity;
    }
}
