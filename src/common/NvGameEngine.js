import { GameEngine, P2PhysicsEngine, TwoVector } from 'lance-gg';
import { Ray, RaycastResult } from 'p2';
import Ship from './Ship';
import PlayableShip from './PlayableShip';
import Asteroid from './Asteroid';
import Planet from './Planet';
import Torpedo from './Torpedo';
import PDC from './PDC';
import Victor from 'victor';
import SolarObjects from './SolarObjects';
import Hulls from './Hulls';
import Factions from './Factions';
import Comms from './Comms';
import EmitOnOff from 'emitonoff';
import CollisionUtils from './CollisionUtils';
import Ai from './Ai';
import Systems from './Systems';
import Waypoint from './Waypoint';

let gravityObjects = {};

export default class NvGameEngine extends GameEngine {

    constructor(options) {
        super(options);

        this.physicsEngine = new P2PhysicsEngine({ gameEngine: this });

        this.physicsEngine.world.islandSplit = false; // suggestion for odd error
        // https://github.com/schteppe/p2.js/issues/223
        // https://stackoverflow.com/questions/55385238/running-several-physics-worlds-on-node-js-not-getting-most-out-of-server

        // this.physicsEngine.world.defaultContactMaterial.friction = 100;
        this.physicsEngine.world.on('impact', this.handleCollision.bind(this));
        this.physicsEngine.world.on('beginContact', this.beginContact.bind(this));
        this.physicsEngine.world.on('endContact', this.endContact.bind(this));
        this.collisionUtils = new CollisionUtils(this);

        this.ai = new Ai(this);
        this.systems = new Systems();
        this.factions = new Factions();

        // game variables
        Object.assign(this, {
            SHIP: Math.pow(2, 0),
            PLANET: Math.pow(2, 1),
            ASTEROID: Math.pow(2, 2),
            TORPEDO: Math.pow(2, 3),
            PDC: Math.pow(2, 4),
            SCAN: Math.pow(2, 5)
        });

        this.on('preStep', this.preStep.bind(this));
        // this.on('postStep', this.postStep.bind(this));
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
            if (ship.captainPlayerId == playerId) {
                ship.captainPlayerId = 0;
            }
            if (ship.engineerPlayerId == playerId) {
                ship.engineerPlayerId = 0;
            }
        }
    }

    // postStep(params) {
      // console.timeEnd("step");
    // }

    // update world objects for engines/gravity etc
    preStep(params) {

        // console.time("step");
        let step = params.step;
        let isReenact = params.isReenact;
        let dt = params.dt;

        // every 60 steps (every second)
        if ((step % 60) == 0) {
          this.emit('mission-step', { seconds: step/60, step: step });
        }

        // loop world objects once here instead of looping in specific functions
        this.world.forEachObject((objId, obj) => {

            if (obj === undefined) {

              console.info("UNDEFINED OBJ FOUND IN WORLD");

            } else if (obj.oxygen <= 0) {

              // remove players
              obj.helmPlayerId = -1;
              obj.navPlayerId = -1;
              obj.signalsPlayerId = -1;
              obj.engineerPlayerId = -1;
              obj.captainPlayerId = -1;

              // make unplayable
              obj.playable = 0;

            } else if (obj.damage && obj.damage >= obj.getMaxDamage()) {

              // remove players
              obj.helmPlayerId = -1;
              obj.navPlayerId = -1;
              obj.signalsPlayerId = -1;
              obj.engineerPlayerId = -1;
              obj.captainPlayerId = -1;

              // remove the object
              this.removeObjectFromWorld(obj);
              this.emitonoff.emit('explosion', obj);  // object itself does this - but do here (in case we skip on client)

            } else if (obj.dockedId !== null && obj.dockedId >= 0) {

              // docked ships can ignore everything and just copy the position and vector
              // from the ship they are docked with

                // docked objects not on the map so ignore (although this should never happen)

            } else if (obj instanceof Torpedo && obj.fuel <= -20) {

              // torps with no fuel just explode
              this.removeObjectFromWorld(obj);
              this.emitonoff.emit('explosion', obj);  // object itself does this - but do here (in case we skip on client)

            } else {

                // for every hundred steps (offset by id so we only process 1 obj per step until > 100 objects)
                // server only event to re-evaluate the AI
                if (obj.aiScript) {
                  let aiStep = step + obj.id;
                  if ((aiStep % 100) == 0) {
                    this.emit('ai-plan', { obj: obj });
                  }
                }

                // apply current AI
                this.ai.execute(obj);

                // if this is a playable ship some additional things
                if (obj instanceof PlayableShip) {

                  // unpack it's power grid
                  obj.grid = new Systems();
                  obj.grid.unpack(obj.power);

                  // update the ships sensor range
                  obj.updateSenseorRange();

                  // increase/decrease oxgyen
                  let standardOxygenUse = 0.03;
                  let standardOxygenExtra = 0.003; // at 100% we want some extra
                  let lifeSupportEfficiency = obj.getLifeSupportEfficiency();
                  let oxygenGen = standardOxygenUse * lifeSupportEfficiency;
                  obj.oxygen = obj.oxygen + standardOxygenExtra + (oxygenGen - standardOxygenUse);
                  if (obj.oxygen > 100) obj.oxygen = 100;
                  if (obj.oxygen < 0) {
                    obj.oxygen = 0;
                    // crew dead!!
                  };

                  // fuel production
                  let fuelProduction = 0.2;
                  let fuelProductionEfficiency = obj.getFuelProductionEfficiency();
                  obj.fuel = obj.fuel + (fuelProduction * fuelProductionEfficiency);
                }

                // only certain types have engines
                if (obj.applyEngine) {
                    obj.applyEngine();
                }

                // if this has gravity then add to gravity objects
                if (obj instanceof Planet) { // only planets for now!
                    gravityObjects[objId] = obj.id;
                }

                if (obj instanceof PDC) {
                  obj.processContact();
                }

                // if this object has a PDC then update it
                if (obj instanceof Ship && obj.pdc) {

                  if (obj.weaponStock[0] > 0) {

                    // reduce ammo
                    obj.weaponStock[0] = obj.weaponStock[0] - 1;

                      // this is server only as the pdc is local
                    let hullData = obj.getHullData();
                    if (hullData.pdc) {
                      let angle = obj.pdcAngle;
                      let range = hullData.pdc.range;

                      // position range away at angle from ships bearing
                      let p = new Victor(0, range);

                      // rotate
                      p.rotate(angle);

                      // add the current ship position
                      p = p.add(Victor.fromArray(obj.physicsObj.position));
                      let v = Victor.fromArray(obj.physicsObj.velocity);

                      obj.pdc.physicsObj.position = [p.x, p.y];
                      obj.pdc.physicsObj.velocity = [v.x, v.y];

                      // also fire a single ray from one ship to the other to hit anything directy between
                      let ray = new Ray({
                        mode: Ray.ALL,
                        from: obj.physicsObj.position,
                        to: obj.pdc.physicsObj.position,
                        callback: function(result){
                          // find the hit
                          let hitObj = null;
                          this.world.forEachObject((id, o) => {
                            if (o.physicsObj === result.body) {
                              hitObj = o;
                            }
                            if (hitObj) {
                              if (hitObj === obj) {
                                // hit firing ship (ignore)
                              } else if (hitObj === obj.pdc) {
                                // hit PDC (ignore)
                              } else {
                                // do damage
                                obj.pdc.processSingleContact(hitObj);
                              }
                            }
                          });
                        }.bind(this)
                      });
                      let result = new RaycastResult();
                      this.physicsEngine.world.raycast(result, ray);
                    }
                  } else {
                    // if we've run out of ammo stop firing
                    this.emit('pdc', { ship: obj, angle: obj.pdcAngle, state: 1 });
                  }
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
                            size: gravSource.size,
                            id: gravSource.id,
                            velocity: gravSource.physicsObj.velocity
                        };

                        // accelerate towards the gravity source
                        obj.physicsObj.applyForce(gravVector.toArray()); // apply to centre of mass

                    }
                } // if (obj.physicsObj)

            } // not docked or destroyed

        });
    }

    registerClasses(serializer) {
      serializer.registerClass(Ship);
      serializer.registerClass(PlayableShip);
      serializer.registerClass(Asteroid);
      serializer.registerClass(Planet);
      serializer.registerClass(Torpedo);
      serializer.registerClass(PDC);
      serializer.registerClass(Waypoint);
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
                } else if (obj.captainPlayerId == playerId && role == 'captain') {
                    ship = obj;
                } else if (obj.engineerPlayerId == playerId && role == 'engineer') {
                      ship = obj;
                } else if ((obj.helmPlayerId == playerId ||
                  obj.navPlayerId == playerId ||
                  obj.captainPlayerId == playerId ||
                  obj.engineerPlayerId == playerId ||
                  obj.signalsPlayerId == playerId) && role === undefined) {
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
                  return (dockedShip.helmPlayerId == playerId || dockedShip.navPlayerId == playerId || dockedShip.captainPlayerId == playerId || dockedShip.engineerPlayerId == playerId || dockedShip.signalsPlayerId == playerId);
                });
              }
            }
          });
        }

        return ship;
    }

    handleCollision(e) {

      this.collisionUtils.assignDamage(e);
    }

    // PDCs managed with contact not impact as they are sensors and we want
    // to check damage each tick
    // Sensor and Visual Scan are similar
    beginContact(e) {

        // console.log("beginContact");

        let [A, B, typeA, typeB] = this.collisionUtils.getObjects(e);
        if (!A || !B) return;

        if (typeA == 'VisualScan') {

          B.scannedBy(A.faction);

        } else if (typeB == 'VisualScan') {

          A.scannedBy(B.faction);

        } else if (typeA == 'Sensor') {

          B.sensedBy(A.faction);

        } else if (typeB == 'Sensor') {

          A.sensedBy(B.faction);

        } else if (A instanceof PDC && !(B instanceof PDC)) {
          // PDC hit must be managed by the server because there is a % changce
          this.emit('pdchit', { obj: B, pdc: A, collision: e });

        } else if (B instanceof PDC && !(A instanceof PDC)) {
          // PDC hit must be managed by the server because there is a % changce
          this.emit('pdchit', { obj: A, pdc: B, collision: e });

        }
    }

    endContact(e) {

      // console.log("endContact");

        let [A, B, typeA, typeB] = this.collisionUtils.getObjects(e);
        if (!A || !B) return;

        if (typeA == 'Sensor') {

          B.unsensedBy(A.faction);

        } else if (typeB == 'Sensor') {

          A.unsensedBy(B.faction);

        } else if (A instanceof PDC && !(B instanceof PDC)) {
          // PDC hit must be managed by the server because there is a % changce
          this.emit('endpdchit', { obj: B, pdc: A, collision: e });

        } else if (B instanceof PDC && !(A instanceof PDC)) {
          // PDC hit must be managed by the server because there is a % changce
          this.emit('endpdchit', { obj: A, pdc: B, collision: e });
        }
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
                let dockedWithShip = null;

                // might be docked!
                if (!ship) {
                  this.world.forEachObject((objId, obj) => {
                    if (obj instanceof Ship && !ship) {
                      ship = obj.docked.find(function(dockedShip) {
                        return (objId == obj.id);
                      });
                      if (ship) {
                        dockedWithShip = obj;
                      }
                    }
                  });
                }

                this.emit('join-ship', { playerId: playerId, ship: ship, dockedWithShip: dockedWithShip, station: inputData.options.station });
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
                let objId = inputData.options.objId;
                let orbit = inputData.options.orbit;

                if (orbit === undefined || orbit < 0) {
                    this.emit('removewaypoint', { ship: ship, objId: objId });
                } else {
                    this.emit('addwaypoint', { ship: ship, objId: objId, orbit: orbit });
                }
            }

            if (inputData.input == 'firetorp') {

                let ship = this.getPlayerShip(playerId);
                let targetId = inputData.options.objId;
                let tube = inputData.options.tube;
                this.emit('firetorp', { ship: ship, targetId: targetId, tube: tube });
            }


            if (inputData.input == 'loadtorp') {

                let ship = this.getPlayerShip(playerId);
                let tube = inputData.options.tube;
                let torpType = inputData.options.torpType;
                ship.loadTorp(tube, torpType);
            }



            if (inputData.input == 'pdcangle') {
              let ship = this.getPlayerShip(playerId);
              let hullData = ship.getPowerAdjustedHullData();
              if (hullData.pdc) {
                console.log("hullData.pdc.rotationRate="+hullData.pdc.rotationRate);
                let newAngle = ship.pdcAngle;
                if (inputData.options.direction == '+') {
                  newAngle = (newAngle + hullData.pdc.rotationRate) % (Math.PI*2);
                } else if (inputData.options.direction == '-') {
                  newAngle = (newAngle - hullData.pdc.rotationRate) % (Math.PI*2);
                }
                ship.pdcAngle = newAngle;
              }
            }

            if (inputData.input == 'pdcstate') {
              let ship = this.getPlayerShip(playerId);
              let hullData = ship.getHullData();
              if (hullData.pdc) {
                let newState = ship.pdcState;
                if (inputData.options.direction == '+') {
                  newState = newState + 1;
                } else if (inputData.options.direction == '-') {
                  newState = newState - 1;
                } else {
                  newState = parseInt(inputData.options.direction);
                }
                if (newState < 0) newState = 0;
                if (newState > 2) newState = 2;
                this.emit('pdc', { ship: ship, angle: ship.pdcAngle, state: newState });
              }
            }

            // handle target - signals only
            if (inputData.input == 'target') {

                let ship = this.getPlayerShip(playerId);
                let targetId = inputData.options.objId;
                this.emit('settarget', { ship: ship, targetId: targetId });
            }

            // update a powercell
            if (inputData.input == 'powercell') {

                let ship = this.getPlayerShip(playerId);
                let row = inputData.options.row;
                let col = inputData.options.col;
                let state = inputData.options.state;

                // get the ship, unpack the state - set new state and repack
                this.systems.unpack(ship.power);
                this.systems.setConnector(row, col, state);
                ship.power = this.systems.pack();
            }

            // comms updates
            if (inputData.input == 'comms') {

                let ship = this.world.objects[inputData.options.id];

                // if ship not found - may be destroyed or docked
                if (!ship) {

                    // find if docked
                    this.world.forEachObject((objId, obj) => {
                      if (obj instanceof Ship) {
                        if (obj.docked && obj.docked.length > 0) {
                          let dockedMatch = obj.docked.find((dockedShip) => {
                            return (dockedShip.id == inputData.options.id);
                          });
                          if (dockedMatch) {
                            ship = dockedMatch;
                          }
                        }
                      }
                    });
                }

                if (ship && inputData.options.target != undefined) {

                    ship.commsTargetId = inputData.options.target;

                    let playerShip = this.getPlayerShip(playerId);

                    // chance to change/update script/state when ending call
                    if (ship.commsTargetId == -1) {
                      let c = new Comms(this, null);
                      c.executeOnCloseComms(ship, playerShip);
                    }
                }
                if (ship && inputData.options.state != undefined){
                    // let previousState = ship.commsState;

                    let playerShip = this.getPlayerShip(playerId);
                    ship.commsState = inputData.options.state;

                    // chance for script to send commands to ship or game
                    let c = new Comms(this, null);
                    c.executeOnEnter(ship, playerShip);
                }
            } // end of comms

            if (inputData.input == 'scan') {

                let ship = this.getPlayerShip(playerId);
                let obj = this.world.objects[inputData.options.objId];
                if (obj && obj.scannedBy) {
                  console.log("SET SCANNED");
                  obj.scannedBy(ship.faction);
                }
            }

        }

    }

    // create ship
    addShip(params) {

        let hullData = Hulls[params['hull']];

        let s = null;

        if (params['playable']) {
          s = new PlayableShip(this, {}, {
              mass: params['mass'] || hullData.mass, angularVelocity: 0,
              position: new TwoVector(params['x'], params['y']),
              velocity: new TwoVector(params['dX'], params['dY']),
              angle: params['angle']
          });
          s.weaponStock = hullData.defaultWeaponStock || [];
          s.oxygen = params['oxygen'] || 100;

        } else {
          s = new Ship(this, {}, {
              mass: params['mass'] || hullData.mass, angularVelocity: 0,
              position: new TwoVector(params['x'], params['y']),
              velocity: new TwoVector(params['dX'], params['dY']),
              angle: params['angle']
          });
        }

        s.engine = params['engine'];
        s.name = params['name'];
        s.hull = params['hull'];
        s.size = params['size'] || hullData.size;
        s.helmPlayerId = 0;
        s.navPlayerId = 0;
        s.captainPlayerId = 0;
        s.engineerPlayerId = 0;
        s.signalsPlayerId = 0;
        s.waypoints = [];
        s.commsScript = params['commsScript'] || 0;
        s.dockedCommsScript = params['dockedCommsScript'] || 0;
        s.commsState = params['commsState'] || 0;
        s.commsTargetId = params['commsTargetId'] || -1;
        s.targetId = params['targetId'] || -1;
        s.aiScript = params['aiScript'] || 0;
        s.aiPlan = params['aiPlan'] || 0;
        s.faction = params['faction'] || this.factions.defaultFaction;
        s.sensed = params['sensed'] || 0;
        s.scanned = params['scanned'] || 0;
        s.dockedId = params['dockedId'] || -1;
        s.docked = [];
        s.damage = params['damage'] || 0;
        s.fuel = params['fuel'] || hullData.fuel;

        s.tubes = [];
        for (let tube = 0; tube < hullData.tubes; tube++) {
          s.tubes[tube] = 0;
        }
        if (params['tubes']) s.tubes = params['tubes'];

        if (hullData.pdc) {
          s.pdcState = 0;
          s.pdcAngle = params['angle'];
        }

        // scan own faction, if friendly
        if (s.isFriend(s.faction)) {
          s.sensedBy(s.faction);
          s.scannedBy(s.faction);
        }

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
        a.sensed = params['sensed'] || 0;
        a.scanned = params['scanned'] || 0;
        return this.addObjectToWorld(a);
    }

    // create Torpedo
    addTorpedo(params) {

        // get some settings from torpedo type: mass, size, fuel
        let td = Object.assign({}, Hulls['torpedo']);
        if (this.torpType) {
          td = Object.assign(td, Hulls['torpedo'].types[this.torpType]);
        }
        let mass = td.mass;
        let size = td.size;

        // x, y, dX, dY, mass, size, angle, angularVelocity
        let t = new Torpedo(this, {}, {
            mass: mass,
            size: size,
            angularVelocity: params['angularVelocity'],
            position: new TwoVector(params['x'], params['y']),
            velocity: new TwoVector(params['dX'], params['dY']),
            angle: params['angle']
        });
        t.targetId = params['targetId'];
        t.fuel = params['fuel'];
        t.engine = params['engine'];
        t.torpType = params['torpType'];
        t.sensed = params['sensed'] || 0;
        t.scanned = params['scanned'] || 0;

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
        p.commsScript = params['commsScript'] || 0;
        p.commsState = params['commsState'] || 0;
        p.commsTargetId = params['commsTargetId'] || -1;
        return this.addObjectToWorld(p);
    }


}
