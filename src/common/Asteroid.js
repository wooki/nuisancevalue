import { PhysicalObject2D, BaseTypes } from 'lance-gg';

let game = null;
let p2 = null;

export default class Asteroid extends PhysicalObject2D {

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.texture = "Asteroid";
    }

    static get netScheme() {
        return Object.assign({
            size: { type: BaseTypes.TYPES.INT16 },
            fixedgravity: { type: BaseTypes.TYPES.INT32 },
            sensed: { type: BaseTypes.TYPES.INT16 }, // bit mask indicating state for each faction
            scanned: { type: BaseTypes.TYPES.INT16 }, // bit mask indicating state for each faction
        }, super.netScheme);
    }

    sensedBy(factionId) {
      // console.log("asteroid sensedBy:"+factionId);
      // console.log(this.sensed);
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
            collisionGroup: game.ASTEROID,
            // collisionMask: game.SHIP | game.PLANET | game.TORPEDO | game.PDC
            // having too many things on the map that can collide massively effects the performance
            // NOTE: actually solved better by slowing down the frequency of data being sent out by server
            // since most movement is predictable you don't notice a slower update rate at all
            collisionMask: game.SHIP | game.PLANET | game.ASTEROID | game.TORPEDO | game.PDC | game.SCAN
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

        gameEngine.emitonoff.emit('explosion', this);
    }

    toString() {
        return `Asteroid::${super.toString()} size=${this.size}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.size = other.size;
        this.fixedgravity = other.fixedgravity;
        this.scanned = other.scanned;
        this.sensed = other.sensed;
    }
}
