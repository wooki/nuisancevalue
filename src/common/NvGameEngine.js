import { GameEngine, P2PhysicsEngine, TwoVector } from 'lance-gg';
// import Bullet from './Bullet';
import Ship from './Ship';
import Asteroid from './Asteroid';
import Planet from './Planet';
import Victor from 'victor';
import SolarObjects from './SolarObjects';

let gravityObjects = {};

export default class NvGameEngine extends GameEngine {

    constructor(options) {
        super(options);

        this.physicsEngine = new P2PhysicsEngine({ gameEngine: this });
        this.physicsEngine.world.defaultContactMaterial.friction = 1;
        this.physicsEngine.world.on('beginContact', this.handleCollision.bind(this));

        // game variables
        Object.assign(this, {
            SHIP: Math.pow(2, 0), PLANET: Math.pow(2, 1), ASTEROID: Math.pow(2, 2)
        });

        this.on('preStep', this.preStep.bind(this));
        this.on('playerDisconnected', this.playerDisconnected.bind(this));
    }

    // when disconnected remove from any ship stations
    playerDisconnected(disconnectData) {
        let playerId = disconnectData.playerId;
        let ship = this.getPlayerShip(playerId);
        if (ship) {
            if (ship.helmPlayerId == playerId) {
                ship.helmPlayerId = 0;
            }
            if (ship.navPlayerId == playerId) {
                ship.navPlayerId = 0;
            }
        }
    }

    // handle a collision on server only
    handleCollision(evt) {

// console.log("handleCollision");

        // identify the two objects which collided
        let A;
        let B;
        this.world.forEachObject((id, obj) => {
            if (obj.physicsObj === evt.bodyA) A = obj;
            if (obj.physicsObj === evt.bodyB) B = obj;
        });

        // check bullet-asteroid and ship-asteroid collisions
        if (!A || !B) return;
// console.log("A) " + A.toString());
// console.log("B) " + B.toString());

        // if (A instanceof Ship && B instanceof Asteroid) this.kill(A);
        // if (B instanceof Ship && A instanceof Asteroid) this.kill(B);


    }


    // degreesToRadians: function(degrees) {
    //   return degrees * (Math.PI/180);
    // },

    // radiansToDegrees: function(radians) {
    //   return radians * (180/Math.PI);
    // },

    // update world objects for engines/gravity etc
    preStep(params) {

        let step = params.step;
        let isReenact = params.isReenact;
        let dt = params.dt;

        // loop world objects once here instead of looping in specific functions
        this.world.forEachObject((objId, obj) => {

            // only certain types have engines
            if (obj.applyEngine) {
                obj.applyEngine();
            }

            // if this has gravity then add to gravity objects
            if (obj instanceof Planet) {
                gravityObjects[objId] = obj.id;
            }

            // apply gravity
            if (obj.physicsObj) {
                let gravSource = null;
                let gravDistance = null;
                let gravSourceAmount = 0;

                // find biggest gravity effect, only apply gravity on smaller objects
                Object.keys(gravityObjects).forEach((gravObjId) => {

                    // let gravObj = gravityObjects[gravObjId];
                    let gravObj = this.world.queryObject({ id: gravityObjects[gravObjId] });

                    if (gravObj && gravObj.id != objId && gravObj.physicsObj) {
                        if (gravObj.physicsObj.mass > obj.physicsObj.mass) {

                            let d = Victor.fromArray(obj.physicsObj.position).distance(Victor.fromArray(gravObj.physicsObj.position));
                            let g = (obj.physicsObj.mass + gravObj.physicsObj.mass) / (d*d);

                            if (gravSourceAmount === null || gravSourceAmount < g) {
                                gravDistance = d;
                                gravSourceAmount = g;
                                gravSource = gravObj;
                            }
                        }
                    }
                });

                // apply force towards source
                if (gravSourceAmount && gravSource) {

// console.log(`d=${gravDistance}, g=${gravSourceAmount} obj=${obj.toString()}`);

                    // flip x coord of obj because our 0,0 is top left
                    // let objV = new Victor(obj.physicsObj.position[0], 0 - obj.physicsObj.position[1]);
                    let objV = Victor.fromArray(obj.physicsObj.position);
                    let gravObjV = Victor.fromArray(gravSource.physicsObj.position);

                    let direction = gravObjV.clone().subtract(objV);
                    let gravVector = direction.clone().normalize().multiply(new Victor(gravSourceAmount, gravSourceAmount));

                    // write to the local object (not transmitted - just for display)
                    obj.gravityData = {
                        source: gravSource.physicsObj.position,
                        direction: direction,
                        amount: gravSourceAmount,
                        vector: gravVector,
                        mass: gravSource.physicsObj.mass
                    };

                    // accelerate towards the gravity source
                    obj.physicsObj.applyForce(gravVector.toArray()); // apply to centre of mass

                }
            } // if (obj.physicsObj)

        });

    }

    registerClasses(serializer) {
        serializer.registerClass(Ship);
        serializer.registerClass(Asteroid);
        serializer.registerClass(Planet);
    }

    // finds the player (optionally in a specific role)
    getPlayerShip(playerId, role) {

        let ship = null;
        this.world.forEachObject((objId, obj) => {
            if (obj instanceof Ship) {
                if (obj.helmPlayerId == playerId && role == 'helm') {
                    ship = obj;
                } else if (obj.navPlayerId == playerId && role == 'nav') {
                    ship = obj;
                } else if ((obj.helmPlayerId == playerId || obj.navPlayerId == playerId) && role === undefined) {
                    ship = obj;
                }
            }
        });

        return ship;
    }

    processInput(inputData, playerId) {

        super.processInput(inputData, playerId);
        console.log("processInput:"+playerId);
        console.dir(inputData);

        if (playerId != 0) {

            // handle joining ship
            if (inputData.input == 'join-ship') {
                let ship = this.world.objects[inputData.options.objId];
                if (inputData.options.station == "helm" && ship.helmPlayerId == 0) {
                    ship.helmPlayerId = playerId;
                    ship.playerId = playerId; // set the ownership to last player to join
                } else if (inputData.options.station == "nav" && ship.navPlayerId == 0) {
                    ship.navPlayerId = playerId;
                    ship.playerId = playerId; // set the ownership to last player to join
                }
            }

            // handle engine - helm only (no options, so we can bind to keys)
            if (inputData.input.startsWith('engine')) {

                let ship = this.getPlayerShip(playerId);
                let level = inputData.options.level;
                if (ship) {
                    ship.engine = level || 0;
                    if (ship.engine < 0) { ship.engine = 0; }
                    if (ship.engine > 5) { ship.engine = 5; }
                }
            }

            // handle maneuver - helm only (no options, so we can bind to keys)
            if (inputData.input.startsWith('maneuver')) {

                let ship = this.getPlayerShip(playerId);
                let direction = inputData.options.direction;
                if (ship && direction) {
                    ship.applyManeuver(direction);
                }
            }

        }

    }

    // create ship
    addShip(params) {

        // name, x, y, dX, dY, mass, hull, size, angle
        let s = new Ship(this, {}, {
            mass: params['mass'], angularVelocity: 0,
            position: new TwoVector(params['x'], params['y']),
            velocity: new TwoVector(params['dX'], params['dY']),
            angle: params['angle']
        });
        s.name = params['name'];
        s.hull = params['hull'];
        s.size = params['size'];
        s.helmPlayerId = 0;
        s.navPlayerId = 0;
        this.addObjectToWorld(s);
    }

    // create asteroid
    addAsteroid(params) {

        // x, y, dX, dY, mass, size, angle, angularVelocity
        let a = new Asteroid(this, {}, {
            mass: params['mass'], angularVelocity: params['angularVelocity'],
            position: new TwoVector(params['x'], params['y']),
            velocity: new TwoVector(params['dX'], params['dY']),
            angle: params['angle']
        });
        a.size = params['size'];
        this.addObjectToWorld(a);
    }

    // create planet
    addPlanet(params) {

        // x, y, dX, dY, mass, size, angle, angularVelocity
        let p = new Planet(this, {}, {
            mass: params['mass'], angularVelocity: params['angularVelocity'],
            position: new TwoVector(params['x'], params['y']),
            velocity: new TwoVector(params['dX'], params['dY']),
            angle: params['angle']
        });
        p.size = params['size'];
        p.texture = params['texture'];
        this.addObjectToWorld(p);
    }



    // asteroid explosion
    // explode(asteroid, bullet) {

    //     // Remove asteroid and bullet
    //     let asteroidBody = asteroid.physicsObj;
    //     let level = asteroid.level;
    //     let x = asteroidBody.position[0];
    //     let y = asteroidBody.position[1];
    //     let r = this.asteroidRadius * (this.numAsteroidLevels - level) / this.numAsteroidLevels;
    //     this.removeObjectFromWorld(asteroid);
    //     this.removeObjectFromWorld(bullet);

    //     // Add new sub-asteroids
    //     if (level < 3) {
    //         let angleDisturb = Math.PI/2 * Math.random();
    //         for (let i=0; i<4; i++) {
    //             let angle = Math.PI/2 * i + angleDisturb;
    //             let subAsteroid = new Asteroid(this, {}, {
    //                 mass: 10,
    //                 position: new TwoVector(x + r * Math.cos(angle), y + r * Math.sin(angle)),
    //                 velocity: new TwoVector(this.rand(), this.rand())
    //             });
    //             subAsteroid.level = level + 1;
    //             this.trace.info(() => `creating sub-asteroid with radius ${r}: ${subAsteroid.toString()}`);
    //             this.addObjectToWorld(subAsteroid);
    //         }
    //     }
    // }
}
