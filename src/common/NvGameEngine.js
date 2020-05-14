import { GameEngine, P2PhysicsEngine, TwoVector } from 'lance-gg';
import Ship from './Ship';
import Asteroid from './Asteroid';
import Planet from './Planet';
import Torpedo from './Torpedo';
import Victor from 'victor';
import SolarObjects from './SolarObjects';
import Comms from './Comms';
import Damage from '../common/Damage';
import EmitOnOff from 'emitonoff';
import CollisionUtils from './CollisionUtils';
import Ai from './Ai';

let gravityObjects = {};

export default class NvGameEngine extends GameEngine {

    constructor(options) {
        super(options);

        this.physicsEngine = new P2PhysicsEngine({ gameEngine: this });
        this.physicsEngine.world.defaultContactMaterial.friction = 100;
        this.physicsEngine.world.on('impact', this.handleCollision.bind(this));
        this.collisionUtils = new CollisionUtils(this);

        this.damage = new Damage();
        this.ai = new Ai(this);

        // game variables
        Object.assign(this, {
            SHIP: Math.pow(2, 0),
            PLANET: Math.pow(2, 1),
            ASTEROID: Math.pow(2, 2),
            TORPEDO: Math.pow(2, 3)
        });

        this.on('preStep', this.preStep.bind(this));
        this.on('playerDisconnected', this.playerDisconnected.bind(this));

        this.emitonoff = EmitOnOff();
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
            if (ship.signalsPlayerId == playerId) {
                ship.signalsPlayerId = 0;
            }
        }
    }

    // update world objects for engines/gravity etc
    preStep(params) {

        let step = params.step;
        let isReenact = params.isReenact;
        let dt = params.dt;

        // loop world objects once here instead of looping in specific functions
        this.world.forEachObject((objId, obj) => {

            if (obj.damage && ((obj.damage | this.damage.DESTROYED) > 0)) {

              // remove players
              this.helmPlayerId = -1;
              this.navPlayerId = -1;
              this.signalsPlayerId = -1;

              // remove the object
              this.removeObjectFromWorld(obj);
              this.emitonoff.emit('explosion', obj);  // object itself does this - but do here (in case we skip on client)

            } else if (obj.dockedId !== null && obj.dockedId >= 0) {

              // docked ships can ignore everything and just copy the position and vector
              // from the ship they are docked with

                // docked objects not on the map so ignore (although this should never happen)

            } else {
                // only certain types have engines
                if (obj.applyEngine) {
                    obj.applyEngine();
                }

                // if this has gravity then add to gravity objects
                if (obj instanceof Planet) { // only planets for now!
                    gravityObjects[objId] = obj.id;
                }

                // apply gravity
                if (obj.physicsObj) {
                    let gravSource = null;
                    let gravDistance = null;
                    let gravSourceAmount = 0;

                    // allow for objects with fixed gravity source - planets in orbit around sun
                    if (obj.fixedgravity !== undefined && obj.fixedgravity !== null && obj.fixedgravity !== '') {

                        let gravObj = this.world.queryObject({ id: parseInt(obj.fixedgravity) });
                        if (gravObj) {
                            let d = Victor.fromArray(obj.physicsObj.position).distance(Victor.fromArray(gravObj.physicsObj.position));
                            let g = (SolarObjects.constants.G * obj.physicsObj.mass * gravObj.physicsObj.mass) / (d*d);
                            gravDistance = d;
                            gravSourceAmount = g;
                            gravSource = gravObj;
                        }
                    } else if (obj.ignoregravity) {

                        // allow a planet to ignore gravity (the sun doesn't get attracted to other planets)

                    } else {

                        // find biggest gravity effect, only apply gravity on smaller objects
                        Object.keys(gravityObjects).forEach((gravObjId) => {

                            // let gravObj = gravityObjects[gravObjId];
                            let gravObj = this.world.queryObject({ id: gravityObjects[gravObjId] });

                            if (gravObj && gravObj.id != objId && gravObj.physicsObj) {
                                if (gravObj.physicsObj.mass > obj.physicsObj.mass) {

                                    let d = Victor.fromArray(obj.physicsObj.position).distance(Victor.fromArray(gravObj.physicsObj.position));
                                    let g = (SolarObjects.constants.G * obj.physicsObj.mass * gravObj.physicsObj.mass) / (d*d);

                                    if (gravSourceAmount === null || gravSourceAmount < g) {
                                        gravDistance = d;
                                        gravSourceAmount = g;
                                        gravSource = gravObj;
                                    }
                                }
                            }
                        });
                    }

                    // apply force towards source
                    if (gravSourceAmount && gravSource) {

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
                            mass: gravSource.physicsObj.mass,
                            velocity: gravSource.physicsObj.velocity
                        };

                        // accelerate towards the gravity source
                        obj.physicsObj.applyForce(gravVector.toArray()); // apply to centre of mass

                    }
                } // if (obj.physicsObj)

                // apply AI
                this.ai.execute(obj, dt);

            } // not docked or destroyed

        });

    }

    registerClasses(serializer) {
        serializer.registerClass(Ship);
        serializer.registerClass(Asteroid);
        serializer.registerClass(Planet);
        serializer.registerClass(Torpedo);
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
                } else if (obj.signalsPlayerId == playerId && role == 'signals') {
                    ship = obj;
                } else if ((obj.helmPlayerId == playerId || obj.navPlayerId == playerId || obj.signalsPlayerId == playerId) && role === undefined) {
                    ship = obj;
                }
            }
        });

        // check docked
        if (!ship) {
          this.world.forEachObject((objId, obj) => {
            if (obj instanceof Ship) {
              if (!ship) {
                ship = obj.docked.find(function(dockedShip) {
                  return (dockedShip.helmPlayerId == playerId || dockedShip.navPlayerId == playerId || dockedShip.signalsPlayerId == playerId);
                });
              }
            }
          });
        }

        return ship;
    }

    handleCollision(e) {

        // handle collission
        this.collisionUtils.assignDamage(e);
    }


    processInput(inputData, playerId) {

        super.processInput(inputData, playerId);
        // console("processInput:"+playerId);
        // console.dir(inputData);

        if (playerId != 0) {


          // handle loading mission
          if (inputData.input == 'load-mission') {
              this.emit('load-mission', { playerId: playerId, missionId: inputData.options.missionId });
          }

            // handle joining ship
            if (inputData.input == 'join-ship') {
                let ship = this.world.objects[inputData.options.objId];
                this.emit('join-ship', { playerId: playerId, ship: ship, station: inputData.options.station });
            }

            // handle engine - helm only (no options, so we can bind to keys)
            if (inputData.input == 'engine') {

                let ship = this.getPlayerShip(playerId);
                let level = inputData.options.level;
                if (level == '+') { level = ship.engine + 1; }
                if (level == '-') { level = ship.engine - 1; }
                if (ship) {
                    ship.engine = level || 0;
                    if (ship.engine < 0) { ship.engine = 0; }
                    if (ship.engine > 5) { ship.engine = 5; }
                }
            }

            // handle maneuver - helm only (no options, so we can bind to keys)
            if (inputData.input == 'maneuver') {

                let ship = this.getPlayerShip(playerId);
                let direction = inputData.options.direction;
                if (ship && direction) {
                    ship.applyManeuver(direction);
                }
            }

            // handle dock - helm only
            if (inputData.input == 'dock') {
                let ship = this.getPlayerShip(playerId);
                if (ship) {
                    if (inputData.options.target != undefined) {
                        // ship.dock(inputData.options.target); // MOVED TO SERVER ONLY via event
                        this.emit('dock', { ship: ship, target: inputData.options.target });
                    }
                }
            }

            // handle undock - helm only
            if (inputData.input == 'undock') {

                let ship = this.getPlayerShip(playerId);
                if (ship) {
                    // ship.undock(); // MOVED TO SERVER ONLY via event
                    this.emit('undock', { ship: ship });
                }
            }

            // handle add waypoint - nav only
            if (inputData.input == 'waypoint') {

                let ship = this.getPlayerShip(playerId);
                let name = inputData.options.name;
                let x = inputData.options.x;
                let y = inputData.options.y;
                if (x === undefined || y === undefined) {
                    // ship.removeWaypoint(name); // MOVED TO SERVER ONLY via event
                    this.emit('removewaypoint', { ship: ship, name: name });
                } else {
                    // ship.addWaypoint(name, x, y); // MOVED TO SERVER ONLY via event
                    this.emit('addwaypoint', { ship: ship, name: name, x: x, y: y });
                }
            }

            if (inputData.input == 'firetorp') {

                let ship = this.getPlayerShip(playerId);
                let targetId = inputData.options.objId;
                this.emit('firetorp', { ship: ship, targetId: targetId });
            }

            // handle target - signals only
            if (inputData.input == 'target') {

                let ship = this.getPlayerShip(playerId);
                let targetId = inputData.options.objId;
                this.emit('settarget', { ship: ship, targetId: targetId });
            }

            if (inputData.input == 'comms') {

                let ship = this.world.objects[inputData.options.id];
                if (inputData.options.target != undefined) {

                    let originalShip = this.getPlayerShip(ship.commsTargetId);
                    ship.commsTargetId = inputData.options.target;

                    // chance to change/update script/state when ending call
                    if (ship.commsTargetId == -1) {
                      let c = new Comms(this, null);
                      c.executeOnCloseComms(ship, originalShip);
                    }
                }
                if (inputData.options.state != undefined){
                    // let previousState = ship.commsState;
                    ship.commsState = inputData.options.state;

                    // chance for script to send commands to ship or game
                    let c = new Comms(this, null);
                    c.executeOnEnter(ship);
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
        s.signalsPlayerId = 0;
        s.waypoints = [];
        s.playable = params['playable'] || 0;
        s.commsScript = params['commsScript'] || 0;
        s.dockedCommsScript = params['dockedCommsScript'] || 0;
        s.commsState = params['commsState'] || 0;
        s.commsTargetId = params['commsTargetId'] || -1;
        s.targetId = params['targetId'] || -1;
        s.dockedId = params['dockedId'] || -1;
        s.docked = [];
        s.damage = params['damage'] || 0;

        return this.addObjectToWorld(s);
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
        return this.addObjectToWorld(a);
    }

    // create Torpedo
    addTorpedo(params) {

        // x, y, dX, dY, mass, size, angle, angularVelocity
        let t = new Torpedo(this, {}, {
            mass: params['mass'],
            angularVelocity: params['angularVelocity'],
            position: new TwoVector(params['x'], params['y']),
            velocity: new TwoVector(params['dX'], params['dY']),
            angle: params['angle']
        });
        t.targetId = params['targetId'];
        t.fuel = params['fuel'];
        t.engine = params['engine'];
        return this.addObjectToWorld(t);
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
        p.fixedgravity = params['fixedgravity'] || '';
        p.ignoregravity = params['ignoregravity'] || 0;
        return this.addObjectToWorld(p);
    }


}
