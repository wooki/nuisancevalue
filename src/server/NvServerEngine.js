import { ServerEngine, TwoVector } from 'lance-gg';
import Asteroid from '../common/Asteroid';
import Torpedo from '../common/Torpedo';
import Ship from '../common/Ship';
import Planet from '../common/Planet';
import Hulls from '../common/Hulls';
import SolarObjects from '../common/SolarObjects';
import Victor from 'victor';
import Damage from '../common/Damage';
import CollisionUtils from '../common/CollisionUtils';
import SolarSystem from './Missions/SolarSystem';
import TestMission from './Missions/TestMission';

export default class NvServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);
        this.collisionUtils = new CollisionUtils(gameEngine);
        this.damage = new Damage();
        this.mission = null;
        this.missions = [TestMission, SolarSystem];
    }

    // remove everything from the game
    clearWorld() {
      this.gameEngine.world.forEachObject((objId, obj) => {
        this.gameEngine.removeObjectFromWorld(obj);
      });
    }

    // create/load world and scenario
    start() {
        super.start();

        this.gameEngine.on('load-mission', e => {
          let missionId = e.missionId;
          if (missionId >= 0 && missionId < this.missions.length) {
            this.clearWorld();
            this.mission = new this.missions[missionId](this.gameEngine);
            this.mission.build();
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
            }
          }
        });

        this.gameEngine.on('damage', e => {

            // this.gameEngine.emit('damage', { ship: A, payload: acceleration, collision: e });
            let A = e.ship;
            let acceleration = e.payload;

            // 1 major damage for every 300, 1 minor damage for every 40 (left over)
            const severeDamageThreshold = 300;
            const lightDamageThreshold = 40;

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

              const hullData = Hulls[A.hull];
              const severe = Math.floor(acceleration / severeDamageThreshold);
              const light = Math.floor((acceleration % severeDamageThreshold) / lightDamageThreshold);
              if (light > 0 || severe > 0) {
                const d = this.damage.getRandomDamage(light, severe, hullData.damage);
                A.damage = A.damage | d
              }
              // every major & minor damage adds to a % chance of destruction
              const destructionChance = ((severe * 0.1) + (light * 0.02));
              const randomDestruction = Math.random();
              if (randomDestruction < destructionChance) {
                A.damage = A.damage | this.damage.DESTROYED;
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

        this.gameEngine.on('firetorp', e => {

            // drop facing the target, from the direction we are travelling from -
            // at our velocity plus/minus low speed (so we can't hit it easily ourselves)
            let ship = e.ship;
            let target = this.gameEngine.world.objects[e.targetId];
            if (target) {

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
                  fuel: 100,
                  engine: 0
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
