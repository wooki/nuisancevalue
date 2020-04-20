import { PhysicalObject2D, BaseTypes, TwoVector } from 'lance-gg';
import Hulls from './Hulls';

let game = null;
let p2 = null;

export default class Ship extends PhysicalObject2D {

    static get netScheme() {
        return Object.assign({
            name: { type: BaseTypes.TYPES.STRING },
            size: { type: BaseTypes.TYPES.INT16 },
            hull: { type: BaseTypes.TYPES.STRING },
            engine: { type: BaseTypes.TYPES.UINT8 },
            playable: { type: BaseTypes.TYPES.UINT8 },
            helmPlayerId: { type: BaseTypes.TYPES.UINT8 },
            navPlayerId: { type: BaseTypes.TYPES.UINT8 },
            signalsPlayerId: { type: BaseTypes.TYPES.UINT8 },
            commsScript: { type: BaseTypes.TYPES.UINT8 },
            commsState: { type: BaseTypes.TYPES.UINT8 },
            commsTargetId: { type: BaseTypes.TYPES.INT16 },
            dockedId: { type: BaseTypes.TYPES.INT16 },
            docked: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.CLASSINSTANCE
            },
            waypoints: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.STRING
            },
            // docked: {
            //     type: BaseTypes.TYPES.LIST,
            //     itemType: BaseTypes.TYPES.CLASSINSTANCE
            // }
        }, super.netScheme);
    }

    // get bending() {
    //     return {
    //         position: { percent: 1.0 },
    //         velocity: { percent: 1.0 },
    //         angularVelocity: { percent: 1.0 },
    //         angle: { percent: 1.0 },
    //     }
    // }

    // if the ship has active engines then apply force
    applyEngine() {
        if (this.dockedId !== null && this.dockedId >= 0) {
            return; // can't do this while docked
        }

        if (this.engine && this.engine > 0) {
            this.physicsObj.applyForceLocal([0, this.engine * 0.1]);
        }
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

    // apply two forces opposite corners to create rotation
    applyManeuver(maneuver) {

        if (this.dockedId !== null && this.dockedId >= 0) {
            return; // can't do this while docked
        }

        if (maneuver == 'l') {

            if (this.physicsObj.angularVelocity > 0 && this.physicsObj.angularVelocity < 0.2) {
                this.physicsObj.angularVelocity = 0;
            } else {
                this.physicsObj.applyForceLocal([-1, 0], [Math.floor(this.size/2), 0]);
                this.physicsObj.applyForceLocal([1, 0], [Math.floor(this.size/2), this.size]);
            }

        } else if (maneuver == 'r') {

            if (this.physicsObj.angularVelocity < 0 && this.physicsObj.angularVelocity > -0.2) {
                this.physicsObj.angularVelocity = 0;
            } else {
                this.physicsObj.applyForceLocal([1, 0], [Math.floor(this.size/2), 0]);
                this.physicsObj.applyForceLocal([-1, 0], [Math.floor(this.size/2), this.size]);
            }

        } else if (maneuver == 'f') {

            this.physicsObj.applyForceLocal([0, 0.5], [Math.floor(this.size/2), Math.floor(this.size/2)]);

        } else if (maneuver == 'b') {

            this.physicsObj.applyForceLocal([0, -0.5], [Math.floor(this.size/2), Math.floor(this.size/2)]);
        }

    }

    dock(dockWith) {

        // update our data
        this.dockedId = dockWith;

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
        let hullData = Hulls[this.hull];

        // Add ship physics
        this.shape = new p2.Circle({
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
        this.physicsObj.addShape(this.shape);
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
        this.playable = other.playable;
        this.helmPlayerId = other.helmPlayerId;
        this.navPlayerId = other.navPlayerId;
        this.signalsPlayerId = other.signalsPlayerId;
        this.waypoints = other.waypoints;
        this.commsScript = other.commsScript;
        this.commsState = other.commsState;
        this.commsTargetId = other.commsTargetId;
        this.dockedId = other.dockedId;
        this.docked = other.docked;
    }
}
