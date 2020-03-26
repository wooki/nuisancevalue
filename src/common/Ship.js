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
            waypoints: {
                type: BaseTypes.TYPES.LIST,
                itemType: BaseTypes.TYPES.STRING
            }
        }, super.netScheme);
    }

    // get bending() {
    //     return {
    //         position: { percent: 0.0 },
    //         velocity: { percent: 0.0 },
    //         angularVelocity: { percent: 0.0 },
    //         angle: { percent: 0.0 },
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

            this.physicsObj.applyForceLocal([-1, 0], [Math.floor(this.size/2), 0]);
            this.physicsObj.applyForceLocal([1, 0], [Math.floor(this.size/2), this.size]);

        } else if (maneuver == 'r') {

            this.physicsObj.applyForceLocal([1, 0], [Math.floor(this.size/2), 0]);
            this.physicsObj.applyForceLocal([-1, 0], [Math.floor(this.size/2), this.size]);
        } else if (maneuver == 'f') {

            this.physicsObj.applyForceLocal([0, 0.05], [Math.floor(this.size/2), Math.floor(this.size)]);

        } else if (maneuver == 'b') {

            this.physicsObj.applyForceLocal([0, -0.05], [Math.floor(this.size/2), 0]);
        }

    }

    dock(dockWith) {
        console.log("dock: "+dockWith);

        // find the target
        let mothership = game.world.objects[dockWith];

        // update our data
        this.dockedId = dockWith;

        // remove shape and replace with non-collision version
        // game.physicsEngine.world.removeBody(this.physicsObj);
        this.physicsObj.removeShape(this.shape);
        this.shape = new p2.Circle({
            radius: Math.floor(this.size / 2),
            collisionGroup: game.DOCKED_SHIP
        });
        this.physicsObj.addShape(this.shape);

        console.log("dock:"+mothership.physicsObj.position[0] + "," + mothership.physicsObj.position[1]);

        // match position and velocity to dock
        this.physicsObj.angularVelocity = 0;
        this.physicsObj.position = [mothership.physicsObj.position[0], mothership.physicsObj.position[1]];
        this.physicsObj.velocity = [mothership.physicsObj.velocity[0], mothership.physicsObj.velocity[1]];
        this.position = new TwoVector(mothership.physicsObj.position[0], mothership.physicsObj.position[1]);
        this.velocity = new TwoVector(mothership.physicsObj.velocity[0], mothership.physicsObj.velocity[1]);
        // game.physicsEngine.world.addBody(this.physicsObj);

        // NOTE: client side we will remove sprite and add sprite to dock target sprite
    }

    undock() {

        if (this.dockedId !== null && this.dockedId >= 0) {

            // find the target
            let mothership = game.world.objects[this.dockedId];
            if (mothership) {

                // update our data
                this.dockedId = -1;

                // remove shape and replace with proper version
                // game.physicsEngine.world.removeBody(this.physicsObj);
                this.physicsObj.removeShape(this.shape);
                this.shape = this.shape = new p2.Circle({
                    radius: Math.floor(this.size / 2),
                    collisionGroup: game.SHIP,
                    collisionMask: game.ASTEROID | game.SHIP | game.PLANET
                });
                this.physicsObj.addShape(this.shape);

                console.log("undock:"+mothership.physicsObj.position[0] + "," + mothership.physicsObj.position[1]);

                // position just behind dock with slightly slower velocity
                this.physicsObj.angularVelocity = 0;
                this.physicsObj.position = [mothership.physicsObj.position[0] + mothership.size + this.size, mothership.physicsObj.position[1] + mothership.size + this.size];
                this.physicsObj.velocity = [mothership.physicsObj.velocity[0], mothership.physicsObj.velocity[1]];
                this.position = new TwoVector(mothership.physicsObj.position[0], mothership.physicsObj.position[1]);
                this.velocity = new TwoVector(mothership.physicsObj.velocity[0], mothership.physicsObj.velocity[1]);

                // game.physicsEngine.world.addBody(this.physicsObj);
            }

        }

    }

    onAddToWorld(gameEngine) {
        game = gameEngine;
        p2 = gameEngine.physicsEngine.p2;

        // get the hull so shape can match image dimensions
        let hullData = Hulls[this.hull];

        // Add ship physics
        this.shape = this.shape = new p2.Circle({
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
        this.dockedId  = other.dockedId;
    }
}
