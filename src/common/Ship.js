import { PhysicalObject2D, BaseTypes } from 'lance-gg';

let game = null;
let p2 = null;

export default class Ship extends PhysicalObject2D {

    static get netScheme() {
        return Object.assign({
            name: { type: BaseTypes.TYPES.STRING },
            size: { type: BaseTypes.TYPES.INT16 },
            hull: { type: BaseTypes.TYPES.STRING },
            engine: { type: BaseTypes.TYPES.UINT8 },
            helmPlayerId: { type: BaseTypes.TYPES.UINT8 },
            navPlayerId: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    // get bending() {
    //     return {
    //         position: { max: 4.0 },
    //         angularVelocity: { percent: 0.0 },
    //         angleLocal: { percent: 0.0 }
    //     };
    // }

    // if the ship has active engines then apply force
    applyEngine() {
        if (this.engine && this.engine > 0) {
            this.physicsObj.applyForceLocal([0, this.engine * 100]);
        }
    }

    // apply two forces opposite corners to create rotation
    applyManeuver(maneuver) {
        // if (this.engine && this.engine > 0) {
            if (maneuver == 'l') {

                this.physicsObj.applyForceLocal([-500, 0], [Math.floor(this.size/2), 0]);
                this.physicsObj.applyForceLocal([500, 0], [Math.floor(this.size/2), this.size]);

            } else if (maneuver == 'r') {

                this.physicsObj.applyForceLocal([500, 0], [Math.floor(this.size/2), 0]);
                this.physicsObj.applyForceLocal([-500, 0], [Math.floor(this.size/2), this.size]);
            } else if (maneuver == 'f') {

                this.physicsObj.applyForceLocal([0, 100], [Math.floor(this.size/2), Math.floor(this.size)]);

            } else if (maneuver == 'b') {

                this.physicsObj.applyForceLocal([0, -100], [Math.floor(this.size/2), 0]);
            }
        // }
    }

    onAddToWorld(gameEngine) {
        game = gameEngine;
        p2 = gameEngine.physicsEngine.p2;

        // Add ship physics
        let shape = this.shape = new p2.Circle({
            radius: Math.floor(this.size / 2),
            collisionGroup: game.SHIP,
            collisionMask: game.ASTEROID | game.SHIP | game.PLANET
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
        this.physicsObj.addShape(shape);
        gameEngine.physicsEngine.world.addBody(this.physicsObj);
    }

    onRemoveFromWorld(gameEngine) {
        game.physicsEngine.world.removeBody(this.physicsObj);
    }

    toString() {
        return `Ship::${super.toString()} name=${this.name}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.name = other.name;
        this.size = other.size;
        this.hull = other.hull;
        this.engine = other.engine;
        this.helmPlayerId = other.helmPlayerId;
        this.navPlayerId = other.navPlayerId;
    }
}
