import { ServerEngine, TwoVector } from 'lance-gg';
import Asteroid from '../common/Asteroid';
import Torpedo from '../common/Torpedo';
import PDC from '../common/PDC';
import Ship from '../common/Ship';
import PlayableShip from '../common/PlayableShip';
import Systems from '../common/Systems';
import Planet from '../common/Planet';
import Hulls from '../common/Hulls';
import SolarObjects from '../common/SolarObjects';
import Victor from 'victor';
import CollisionUtils from '../common/CollisionUtils';
import SolarSystem from './Missions/SolarSystem';
import TestMission from './Missions/TestMission';
import SimpleTestMission from './Missions/SimpleTestMission';

export default class NvServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);
        this.collisionUtils = new CollisionUtils(gameEngine);
        this.mission = null;
        this.lastMissionSeconds = 0;
        this.missionSecondsOffset = 0;
        this.missions = [TestMission, SimpleTestMission, SolarSystem];
    }

    // remove everything from the game
    clearWorld() {
      try {
        this.gameEngine.world.forEachObject((objId, obj) => {
          this.gameEngine.removeObjectFromWorld(obj);
        });
      } catch (error) {
      }
    }

    // create/load world and scenario
    start() {
        super.start();

        this.gameEngine.on('ai-plan', e => {
          let obj = e.obj;
          let ai = this.gameEngine.ai;
          if (ai) {
            ai.plan(obj, this.mission);
          }
        });

        this.gameEngine.on('mission-step', e => {
          let seconds = e.seconds;
          if (this.mission && this.mission.step) {
            this.mission.step(seconds - this.lastMissionSeconds);
          } else {
            this.lastMissionSeconds = seconds;
          }
        });

        this.gameEngine.on('load-mission', e => {
          let missionId = e.missionId;
          if (missionId >= 0 && missionId < this.missions.length) {
            this.clearWorld();
            this.mission = new this.missions[missionId](this.gameEngine);
            this.mission.build();
            this.missionStepOffset = this.lastMissionSeconds;
          }
        });

        this.gameEngine.on('join-ship', e => {
          //  playerId: playerId, ship: ship
          let playerId = e.playerId;
          let ship = e.ship;
          let station = e.station;
          // let ship = this.world.objects[inputData.options.objId];

          // might be docked
          if (!ship) {
            this.gameEngine.world.forEachObject((objId, obj) => {
              if (obj instanceof Ship && !ship) {
                ship = obj.docked.find(function(dockedShip) {
                  return (objId == obj.id);
                });
              }
            });
          } else {

            // try and add them
            if (station == "helm" && ship.helmPlayerId == 0) {
                ship.helmPlayerId = playerId;
                ship.playerId = playerId; // set the ownership to last player to join
            } else if (station == "nav" && ship.navPlayerId == 0) {
                ship.navPlayerId = playerId;
                ship.playerId = playerId; // set the ownership to last player to join
            } else if (station == "signals" && ship.signalsPlayerId == 0) {
                ship.signalsPlayerId = playerId;
                ship.playerId = playerId; // set the ownership to last player to join
            } else if (station == "engineer" && ship.engineerPlayerId == 0) {
                ship.engineerPlayerId = playerId;
                ship.playerId = playerId; // set the ownership to last player to join
            } else if (station == "captain" && ship.captainPlayerId == 0) {
                ship.captainPlayerId = playerId;
                ship.playerId = playerId; // set the ownership to last player to join
            }
          }
        });

        this.gameEngine.on('endpdchit', e => {
          e.pdc.removeContact(e.obj);
        });

        this.gameEngine.on('pdchit', e => {
          e.pdc.addContact(e.obj);
        });

        this.gameEngine.on('damage', e => {

            // this.gameEngine.emit('damage', { ship: A, payload: acceleration, collision: e });
            let A = e.ship;
            let payload = e.payload;

            // only ships take damage at the moment
            if (A instanceof Ship) {

              // could do damage based on actual contact location - but not yet!!
              // console.log("Contact Eq contactPointA:");
              // console.dir(e.contactEquations[0].contactPointA);
              // console.log("Contact Eq penetrationVec:");
              // console.dir(e.contactEquations[0].penetrationVec);
              // console.log("Contact Eq contactPointB:");
              // console.dir(e.contactEquations[0].contactPointB);
              // console.log("Contact Eq normalA:");
              // console.dir(e.contactEquations[0].normalA);

              // const hullData = A.hullData();
              // const maxDamage = a.getMaxDamage();
              A.damage = A.damage + payload;

              // playable ship also take damage to power grid
              if (A instanceof PlayableShip) {
                A.grid = new Systems();
                A.grid.unpack(A.power);

                // add some damage
                let powergridHits = Math.floor(payload / 33);
                for (let i = 0; i < powergridHits; i++) {
                  let gridSize = A.grid.getGridSize();
                  let damageRow = Math.floor(gridSize[0] * Math.random());
                  let damageCol = Math.floor(gridSize[1] * Math.random());
                  A.grid.setConnector(damageRow, damageCol, 0);
                }

                A.power = A.grid.pack();
              }

            } else if (A instanceof Asteroid) {

              let splitChance = 0.1;
              if (payload >= A.size) {
                splitChance = 0.8;
              }

              // remove asteroid, replace with two smaller
              try{
                this.gameEngine.removeObjectFromWorld(A);
              } catch (e) {}

              // position 1/2 size away in random direction
              // ( we dont know where the damage cafe from)
              // add velocity in that same direction
              let randomVector = new Victor(0, A.size/2);
              let r = Math.random() * 359;
              randomVector.rotateDeg(r);
              let asteroid1Pos = Victor.fromObject(A.position);
              asteroid1Pos.add(randomVector);
              let asteroid1Vel = Victor.fromObject(A.velocity);
              asteroid1Vel.add(randomVector.clone().normalize().multiply(new Victor(payload, payload)));
              let asteroid1size = A.size * 0.4;

              if (asteroid1size > 100) {
                let asteroid1 = this.gameEngine.addAsteroid({
                  mass: A.mass * 0.4,
                  angularVelocity: A.angularVelocity,
                  x: asteroid1Pos.x,
                  y: asteroid1Pos.y,
                  dX: asteroid1Vel.x,
                  dY: asteroid1Vel.y,
                  angle: Math.random() * 2 * Math.PI,
                  size: asteroid1size
                });
              }

              randomVector.invert();
              let asteroid2Pos = Victor.fromObject(A.position).add(randomVector);
              let asteroid2Vel = Victor.fromObject(A.velocity).add(randomVector.clone().normalize());
              let asteroid2sizeRatio = 0.5;
              if (Math.random() < 0.5) {
                asteroid2sizeRatio = 0.2;
              }
              let asteroid2size = A.size * asteroid2sizeRatio;
              if (asteroid2size > 100 && Math.random() < splitChance) {
                let asteroid2 = this.gameEngine.addAsteroid({
                  mass: A.mass * asteroid2sizeRatio,
                  angularVelocity: 0 - A.angularVelocity,
                  x: asteroid2Pos.x,
                  y: asteroid2Pos.y,
                  dX: asteroid2Vel.x,
                  dY: asteroid2Vel.y,
                  angle: Math.random() * 2 * Math.PI,
                  size: asteroid2size
                });
              }

            }
        });

        // listen to server only events
        this.gameEngine.on('dock', e => {
            // e.ship, e.target

            // shunt ship into targets dock, remove ship from map
            let mothership = this.gameEngine.world.objects[e.target];
            if (mothership) {
              e.ship.dock(e.target);
              mothership.docked.push(e.ship);
              this.gameEngine.removeObjectFromWorld(e.ship);
            }
        });

        this.gameEngine.on('undock', e => {
            // e.ship

            // add ship back into game
            if (e.ship.dockedId != null && e.ship.dockedId >= 0) {

              let mothership = this.gameEngine.world.objects[e.ship.dockedId];
              if (mothership) {
                mothership.docked = mothership.docked.filter(function(m) {
                  return !(m.id == e.ship.id);
                });
                e.ship.undock(mothership);
                this.gameEngine.addObjectToWorld(e.ship);
              }
            }
        });

        this.gameEngine.on('settarget', e => {
            e.ship.targetId = e.targetId;
        });

        this.gameEngine.on('pdc', e => {

          let ship = e.ship;
          let hullData = Hulls[ship.hull];
          if (hullData.pdc) {
            let angle = e.angle;
            let state = e.state;

            // if we are starting or stopping fire then change to world
            if (state == 2 && ship.pdcState != 2) {
              // add PDC to the world and link to this ship
              let size = hullData.pdc.size;
              let range = hullData.pdc.range;

              // position range away at angle from ships bearing
              let p = new Victor(0, range);

              // rotate
              p.rotate(ship.pdcAngle);

              // add the current ship position
              p = p.add(Victor.fromArray(ship.physicsObj.position));
              let v = Victor.fromArray(ship.physicsObj.velocity);

              let pdc = new PDC(this.gameEngine, {}, {
                  position: new TwoVector(p.x, p.y),
                  velocity: new TwoVector(v.x, v.y)
              });
              pdc.size = size;

              // store locally only on ship
              ship.pdc = this.gameEngine.addObjectToWorld(pdc);
            }

            if (state != 2 && ship.pdcState == 2) {
              // remove linked PDC from the world
              if (ship.pdc) {
                this.gameEngine.removeObjectFromWorld(ship.pdc);
                ship.pdc = null;
              }
            }

            // update the ship
            ship.pdcAngle = angle;
            ship.pdcState = state;
          }
        });

        this.gameEngine.on('firetorp', e => {

            // drop facing the target, from the direction we are travelling from -
            // at our velocity plus/minus low speed (so we can't hit it easily ourselves)
            let ship = e.ship;
            let target = this.gameEngine.world.objects[e.targetId];
            let tube = e.tube;

            if (target) {

              // check the ship has a torp loaded in the specified tube
              // TODO:!!!

              // find direction to target
              let shipPos = Victor.fromArray(ship.physicsObj.position);
              let targetPos = Victor.fromArray(target.physicsObj.position);
              let direction = targetPos.clone().subtract(shipPos);

              // position is our size (plus torp size) in the direction
              let startDistance = ship.size;
              let torpPos = shipPos.add(direction.normalize().multiply(new Victor(startDistance, startDistance)));
              let torpVelocity = Victor.fromArray(ship.physicsObj.velocity);
              let torpDirection = new Victor(0 - direction.x, direction.y);
              let torpAngle = torpDirection.verticalAngle();

              this.gameEngine.addTorpedo({
                  x: torpPos.x,
                  y: torpPos.y,
                  dX: torpVelocity.x,
                  dY: torpVelocity.y,
                  mass: 0.0005, size: 30,
                  angle: torpAngle,
                  angularVelocity: 0,
                  targetId: e.targetId,
                  fuel: 200,
                  engine: 1
              });
            }

        });

        this.gameEngine.on('addwaypoint', e => {
            e.ship.addWaypoint(e.name, e.x, e.y);
        });

        this.gameEngine.on('removewaypoint', e => {
            e.ship.removeWaypoint(e.name);
        });
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);
    }
}
