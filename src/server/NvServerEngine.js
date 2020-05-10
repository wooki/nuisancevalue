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

export default class NvServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);
        this.collisionUtils = new CollisionUtils(gameEngine);

        this.damage = new Damage();
    }

    addMap() {

      let planets = SolarObjects.addSolarSystem(this.gameEngine, {});

      // create a station around earth
      let stationOrbitDistance = Math.floor(SolarObjects.Earth.diameter/2) + 2500;
      let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Earth.mass) / stationOrbitDistance);
      let position = new Victor(stationOrbitDistance, 0);
      let velocity = new Victor(0, 0 - stationOrbitSpeed);
      position = position.rotateDeg(45);
      velocity = velocity.rotateDeg(45);
      position = position.add(new Victor(planets.Earth.position.x, planets.Earth.position.y));
      velocity = velocity.add(new Victor(planets.Earth.velocity.x, planets.Earth.velocity.y));

      this.gameEngine.addShip({
          name: "Earth Station 1",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          mass: 0.1, size: 280, // need to read mass and size from hull
          hull: 'station',
          commsScript: 0,
          dockedCommsScript: 1,
          angle: 0,
          fixedgravity: planets.Earth.id.toString()
      });

      let hullName = 'bushido';
      let hullData = Hulls[hullName];
      position = new Victor(stationOrbitDistance, 0);
      velocity = new Victor(0, 0 - stationOrbitSpeed);
      position = position.rotateDeg(55);
      velocity = velocity.rotateDeg(55);
      position = position.add(new Victor(planets.Earth.position.x, planets.Earth.position.y));
      velocity = velocity.add(new Victor(planets.Earth.velocity.x, planets.Earth.velocity.y));
      let nv = this.gameEngine.addShip({
          name: "Nuisance Value",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          hull: hullName,
          mass: hullData.mass, size: hullData.size, // need to read mass and size from hull
          angle: Math.PI,
          playable: 1
      });


      let hullName2 = 'blockade-runner';
      let hullData2 = Hulls[hullName2];
      let ship2OrbitDistance = Math.floor(SolarObjects.Mars.diameter/2) + 2000;
      let ship2OrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Mars.mass) / ship2OrbitDistance);
      position = new Victor(ship2OrbitDistance, 0);
      velocity = new Victor(0, 0 - ship2OrbitSpeed);
      position = position.rotateDeg(200);
      velocity = velocity.rotateDeg(200);
      position = position.add(new Victor(planets.Mars.position.x, planets.Mars.position.y));
      velocity = velocity.add(new Victor(planets.Mars.velocity.x, planets.Mars.velocity.y));
      this.gameEngine.addShip({
          name: "Profit Margin",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          hull: hullName2,
          mass: hullData2.mass, size: hullData2.size, // need to read mass and size from hull
          angle: Math.PI,
          playable: 1
      });

      let jupiterstationOrbitDistance = Math.floor(SolarObjects.Jupiter.diameter/2) + 5000;
      let jupiterOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Jupiter.mass) / jupiterstationOrbitDistance);
      position = new Victor(jupiterstationOrbitDistance, 0);
      velocity = new Victor(0, 0 - jupiterOrbitSpeed);
      position = position.rotateDeg(320);
      velocity = velocity.rotateDeg(320);
      position = position.add(new Victor(planets.Jupiter.position.x, planets.Jupiter.position.y));
      velocity = velocity.add(new Victor(planets.Jupiter.velocity.x, planets.Jupiter.velocity.y));
      this.gameEngine.addShip({
          name: "Jupiter Station",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          mass: 0.03, size: 90, // need to read mass and size from hull
          hull: 'station',
          commsScript: 0,
          dockedCommsScript: 1,
          angle: 0,
          fixedgravity: planets.Jupiter.id.toString()
      });

      let saturnStationOrbitDistance = Math.floor(SolarObjects.Saturn.diameter/2) + 5000;
      let saturnOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Saturn.mass) / saturnStationOrbitDistance);
      position = new Victor(saturnStationOrbitDistance, 0);
      velocity = new Victor(0, 0 - saturnOrbitSpeed);
      position = position.rotateDeg(30);
      velocity = velocity.rotateDeg(30);
      position = position.add(new Victor(planets.Saturn.position.x, planets.Saturn.position.y));
      velocity = velocity.add(new Victor(planets.Saturn.velocity.x, planets.Saturn.velocity.y));
      this.gameEngine.addShip({
          name: "Saturn Station",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          mass: 0.07, size: 160, // need to read mass and size from hull
          hull: 'station',
          commsScript: 0,
          dockedCommsScript: 1,
          angle: 30,
          fixedgravity: planets.Saturn.id.toString()
      });

      // asteroids between mars and jupiter
      let asteroidDistance = SolarObjects.Mars.orbit + ((SolarObjects.Jupiter.orbit - SolarObjects.Mars.orbit) / 2);
      let asteroidDistanceVariance = SolarObjects.Jupiter.diameter * 15;

      for (let asteroidIndex = 0; asteroidIndex < 12; asteroidIndex++) {

          // create a point and vector then rotate to a random position
          let x = asteroidDistance - (asteroidDistanceVariance/2) + (Math.random() * asteroidDistanceVariance);
          let position = new Victor(x, 0);
          let asteroidOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / x);
          let v = new Victor(0, 0 - asteroidOrbitSpeed);

          // rotate degrees
          let r = Math.random() * 359;
          position = position.rotateDeg(r);
          v = v.rotateDeg(r);

          // add an actual asteroid
          this.gameEngine.addAsteroid({
              x: position.x,
              y: position.y,
              dX: v.x,
              dY: v.y,
              mass: Math.random() * 100, size: 40 + Math.random() * 250,
              angle: Math.random() * 2 * Math.PI,
              angularVelocity: Math.random(),
              // fixedgravity: sol.id.toString()
          });
      }

    } // addMap


    addTestMap1() {

      // this.gameEngine.addPlanet({
      //   x: -10000,
      //   y: 3000,
      //   dX: 100,
      //   dY: 0,
      //   mass: SolarObjects.Mars.mass,
      //   size: SolarObjects.Mars.diameter,
      //   texture: 'mars',
      //   angle: Math.random() * 2 * Math.PI,
      //   angularVelocity: Math.random()
      // });

      // add an actual asteroid
      this.gameEngine.addAsteroid({
          x: 0-5000,
          y: 100,
          dX: 7,
          dY: 0,
          mass: 1, size: 300,
          angle: Math.random() * 2 * Math.PI,
          angularVelocity: Math.random()
      });
      this.gameEngine.addAsteroid({
          x: 4600,
          y: 0-500,
          dX: 0-5,
          dY: 0,
          mass: 1, size: 800,
          angle: Math.random() * 2 * Math.PI,
          angularVelocity: Math.random()
      });

      let hullName = 'bushido';
      let hullData = Hulls[hullName];
      let nv = this.gameEngine.addShip({
          name: "Nuisance Value",
          x: 0,
          y: 0,
          dX: 0,
          dY: 0,
          hull: hullName,
          mass: hullData.mass, size: hullData.size, // need to read mass and size from hull
          angle: Math.PI,
          playable: 1
          // damage: this.damage.getRandomDamage(1, 0, hullData.damage) // do some dummy damage for testing
      });

      let hullName2 = 'tug';
      let hullData2 = Hulls[hullName2];
      let tug = this.gameEngine.addShip({
          name: "Target Practice",
          x: 500,
          y: -3000,
          dX: 0,
          dY: 0,
          hull: hullName2,
          mass: hullData2.mass, size: hullData2.size, // need to read mass and size from hull
          angle: Math.PI*1.3,
          playable: 1
      });

      this.gameEngine.addTorpedo({
          x: -3000,
          y: -3000,
          dX: 0,
          dY: 0,
          mass: 0.0005, size: 30,
          angle: 0,
          targetId: tug.id,
          fuel: 100,
          engine: 0
      });

      // random asteroids
      let asteroidDistance = 4000;
      let asteroidDistanceVariance = 2000;

      for (let asteroidIndex = 0; asteroidIndex < 0; asteroidIndex++) {

          // create a point and vector then rotate to a random position
          let x = asteroidDistance - (asteroidDistanceVariance/2) + (Math.random() * asteroidDistanceVariance);
          let position = new Victor(x, 0);
          let asteroidOrbitSpeed = Math.sqrt((SolarObjects.constants.G * 100) / x);
          let v = new Victor(0, 0 - asteroidOrbitSpeed);

          // rotate degrees
          let r = Math.random() * 359;
          position = position.rotateDeg(r);
          r = Math.random() * 359; // random vector
          v = v.rotateDeg(r);

          // mass
          let asteroidSize = Math.random() * 600;

          // add an actual asteroid
          this.gameEngine.addAsteroid({
              x: position.x,
              y: position.y,
              dX: v.x,
              dY: v.y,
              mass: (asteroidSize/300), size: asteroidSize,
              angle: Math.random() * 2 * Math.PI,
              angularVelocity: Math.random() * Math.PI
          });
      }

    } // addTestMap1

    // create/load world and scenario
    start() {
        super.start();

        this.addMap();
        // this.addTestMap1();

        this.gameEngine.on('damage', e => {

            // this.gameEngine.emit('damage', { ship: A, payload: acceleration, collision: e });
            let A = e.ship;
            let acceleration = e.payload;

            // 1 major damage for every 200, 1 minor damage for every 40 (left over)
            const severeDamageThreshold = 200;
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

        // also needs a room?
        // this.createRoom("Nuisance Value");
    }

    // handle a collision on server only
    // handleCollision(e) {

    //   // identify the two objects which collided
    //   // NOT NEEDED AT PRESENT (just used in damage)
    //   // let [A, B] = this.collisionUtils.getObjects(e);
    //   // if (!A || !B) return;

    //   // do stuff depending on types
    //   this.collisionUtils.assignDamage(e);

  //} // handleCollision

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);
        // this.gameEngine.addShip(socket.playerId);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);
        // for (let o of this.gameEngine.world.queryObjects({ playerId }))
        //     this.gameEngine.removeObjectFromWorld(o.id);
    }
}
