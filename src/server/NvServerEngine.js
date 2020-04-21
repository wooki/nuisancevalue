import { ServerEngine, TwoVector } from 'lance-gg';
import Asteroid from '../common/Asteroid';
import Bullet from '../common/Bullet';
import Ship from '../common/Ship';
import Hulls from '../common/Hulls';
import SolarObjects from '../common/SolarObjects';
import Victor from 'victor';

export default class NvServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);
        // gameEngine.physicsEngine.world.on('beginContact', this.handleCollision.bind(this));
        // gameEngine.on('shoot', this.shoot.bind(this));
    }

    // create/load world and scenario
    start() {
        super.start();

        // add the sun
        let sol = this.gameEngine.addPlanet({
            x: 0, y: 0,
            dX: 0, dY: 0,
            mass: SolarObjects.Sol.mass,
            size: SolarObjects.Sol.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'sol',
            ignoregravity: 1
        });

        // add mercury
        let mercuryOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Mercury.orbit);
        let mercury = this.gameEngine.addPlanet({
            x: SolarObjects.Mercury.orbit, y: 0,
            dX: 0, dY: 0 - mercuryOrbitSpeed,
            mass: SolarObjects.Mercury.mass,
            size: SolarObjects.Mercury.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'mercury',
            fixedgravity: sol.id.toString()
        });

        // add venus
        let venusOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Venus.orbit);
        let venus = this.gameEngine.addPlanet({
            x: SolarObjects.Venus.orbit, y: 0,
            dX: 0, dY: 0 - venusOrbitSpeed,
            mass: SolarObjects.Venus.mass,
            size: SolarObjects.Venus.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'venus',
            fixedgravity: sol.id.toString()
        });

        // add the earth
        let earthOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Earth.orbit);
        let earth = this.gameEngine.addPlanet({
            x: SolarObjects.Earth.orbit, y: 0,
            dX: 0, dY: 0 - earthOrbitSpeed,
            mass: SolarObjects.Earth.mass,
            size: SolarObjects.Earth.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'earth',
            fixedgravity: sol.id.toString()
        });

        // add mars
        let marsOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Mars.orbit);
        this.gameEngine.addPlanet({
            x: 0, y: 0 - SolarObjects.Mars.orbit,
            dX: 0 - marsOrbitSpeed, dY: 0,
            mass: SolarObjects.Mars.mass,
            size: SolarObjects.Mars.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'mars',
            fixedgravity: sol.id.toString()
        });

        // create a station around earth
        let stationOrbitDistance = Math.floor(SolarObjects.Earth.diameter/2) + 2500;
        let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Earth.mass) / stationOrbitDistance);
        this.gameEngine.addShip({
            name: "Earth Station 1",
            x: SolarObjects.Earth.orbit + stationOrbitDistance,
            y: 0,
            dX: 0, dY: (0 - (earthOrbitSpeed + stationOrbitSpeed)),
            mass: 0.1, size: 280, // need to read mass and size from hull
            hull: 'station',
            commsScript: 0,
            dockedCommsScript: 1,
            angle: 0,
            fixedgravity: earth.id.toString()
        });

        // create an asteroid
        this.gameEngine.addAsteroid({
            x: SolarObjects.Earth.orbit + stationOrbitDistance + 1000,
            y: 500,
            dX: 0, dY: (0 - (earthOrbitSpeed + stationOrbitSpeed)),
            mass: Math.random() * 100, size: 50 + Math.random() * 100,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: Math.random()
        });

        // let hullName = 'blockade-runner';
        let hullName = 'bushido';
        // // let hullName = 'tug';
        let hullData = Hulls[hullName];
        // create a single player ship for now name, x, y, dX, dY, mass, hull, size, angle (radians)
        let shipOrbitDistance = Math.floor(SolarObjects.Earth.diameter/2) + 2500;
        let shipOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Earth.mass) / shipOrbitDistance);
        this.gameEngine.addShip({
            name: "Nuisance Value",
            x: SolarObjects.Earth.orbit + shipOrbitDistance + 250,
            y: 250,
            dX: 0, dY: (0 - (earthOrbitSpeed + shipOrbitSpeed)),
            hull: hullName,
            mass: hullData.mass, size: hullData.size, // need to read mass and size from hull
            angle: Math.PI,
            playable: 1
        });
        let hullName2 = 'blockade-runner';
        let hullData2 = Hulls[hullName2];
        let shipOrbitDistance2 = Math.floor(SolarObjects.Mars.diameter/2) + 2000;
        let shipOrbitSpeed2 = Math.sqrt((SolarObjects.constants.G * SolarObjects.Mars.mass) / shipOrbitDistance2);
        this.gameEngine.addShip({
            name: "Profit Margin",
            x: 0,
            y: 0 - (SolarObjects.Mars.orbit + shipOrbitDistance2),
            dX: (0 - (marsOrbitSpeed + shipOrbitSpeed2)), dY: 0,
            hull: hullName2,
            mass: hullData2.mass, size: hullData2.size, // need to read mass and size from hull
            angle: Math.PI,
            playable: 1
        });

        // add jupiter
        let jupiterOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Jupiter.orbit);
        let jupiter = this.gameEngine.addPlanet({
            x: 0 - SolarObjects.Jupiter.orbit, y: 0,
            dX: 0, dY: jupiterOrbitSpeed,
            mass: SolarObjects.Jupiter.mass,
            size: SolarObjects.Jupiter.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'jupiter',
            fixedgravity: sol.id.toString()
        });

        // add saturn
        let saturnOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Saturn.orbit);
        let saturn = this.gameEngine.addPlanet({
            x: SolarObjects.Saturn.orbit, y: 0,
            dX: 0, dY: 0 - saturnOrbitSpeed,
            mass: SolarObjects.Saturn.mass,
            size: SolarObjects.Saturn.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'saturn',
            fixedgravity: sol.id.toString()
        });

        // add uranus
        let uranusOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Uranus.orbit);
        let uranus = this.gameEngine.addPlanet({
            x: SolarObjects.Uranus.orbit, y: 0,
            dX: 0, dY: 0 - uranusOrbitSpeed,
            mass: SolarObjects.Uranus.mass,
            size: SolarObjects.Uranus.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'uranus',
            fixedgravity: sol.id.toString()
        });

        // add neptune
        let neptuneOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Neptune.orbit);
        let neptune = this.gameEngine.addPlanet({
            x: SolarObjects.Neptune.orbit, y: 0,
            dX: 0, dY: 0 - neptuneOrbitSpeed,
            mass: SolarObjects.Neptune.mass,
            size: SolarObjects.Neptune.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'neptune',
            fixedgravity: sol.id.toString()
        });

        // add pluto
        let plutoOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / SolarObjects.Pluto.orbit);
        let pluto = this.gameEngine.addPlanet({
            x: SolarObjects.Pluto.orbit, y: 0,
            dX: 0, dY: 0 - plutoOrbitSpeed,
            mass: SolarObjects.Pluto.mass,
            size: SolarObjects.Pluto.diameter,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            texture: 'pluto',
            fixedgravity: sol.id.toString()
        });

        // create a station around jupiter
        let jupiterstationOrbitDistance = Math.floor(SolarObjects.Jupiter.diameter/2) + 5000;
        let jupiterstationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Jupiter.mass) / jupiterstationOrbitDistance);
        this.gameEngine.addShip({
            name: "Jupiter Station",
            x: 0 - (SolarObjects.Jupiter.orbit + jupiterstationOrbitDistance),
            y: 0,
            dX: 0, dY: (0 - (jupiterOrbitSpeed + jupiterstationOrbitSpeed)),
            mass: 0.08, size: 180, // need to read mass and size from hull
            hull: 'station',
            commsScript: 0,
            dockedCommsScript: 1,
            angle: 0,
            fixedgravity: jupiter.id.toString()
        });

        // create a station around saturn
        let saturnStationOrbitDistance = Math.floor(SolarObjects.Saturn.diameter/2) + 5000;
        let saturnStationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Saturn.mass) / saturnStationOrbitDistance);
        this.gameEngine.addShip({
            name: "Saturn Station",
            x: SolarObjects.Saturn.orbit + saturnStationOrbitDistance,
            y: 0,
            dX: 0, dY: (0 - (saturnOrbitSpeed + saturnStationOrbitSpeed)),
            mass: 0.07, size: 160, // need to read mass and size from hull
            hull: 'station',
            commsScript: 0,
            dockedCommsScript: 1,
            angle: 0,
            fixedgravity: saturn.id.toString()
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

        this.gameEngine.on('addwaypoint', e => {
            e.ship.addWaypoint(e.name, e.x, e.y);
        });

        this.gameEngine.on('removewaypoint', e => {
            e.ship.removeWaypoint(e.name);
        });

        // also needs a room
        // this.createRoom("Nuisance Value");
    }

    // handle a collision on server only
    // handleCollision(evt) {

    //     // identify the two objects which collided
    //     let A;
    //     let B;
    //     this.gameEngine.world.forEachObject((id, obj) => {
    //         if (obj.physicsObj === evt.bodyA) A = obj;
    //         if (obj.physicsObj === evt.bodyB) B = obj;
    //     });

    //     // check bullet-asteroid and ship-asteroid collisions
    //     if (!A || !B) return;
    //     this.gameEngine.trace.trace(() => `collision between A=${A.toString()}`);
    //     this.gameEngine.trace.trace(() => `collision and     B=${B.toString()}`);
    //     if (A instanceof Bullet && B instanceof Asteroid) this.gameEngine.explode(B, A);
    //     if (B instanceof Bullet && A instanceof Asteroid) this.gameEngine.explode(A, B);
    //     if (A instanceof Ship && B instanceof Asteroid) this.kill(A);
    //     if (B instanceof Ship && A instanceof Asteroid) this.kill(B);

    //     // restart game
    //     if (this.gameEngine.world.queryObjects({ instanceType: Asteroid }).length === 0) this.gameEngine.addAsteroids();
    // }

    // shooting creates a bullet
    // shoot(player) {

    //     let radius = player.physicsObj.shapes[0].radius;
    //     let angle = player.physicsObj.angle + Math.PI / 2;
    //     let bullet = new Bullet(this.gameEngine, {}, {
    //         mass: 0.05,
    //         position: new TwoVector(
    //             radius * Math.cos(angle) + player.physicsObj.position[0],
    //             radius * Math.sin(angle) + player.physicsObj.position[1]
    //         ),
    //         velocity: new TwoVector(
    //             2 * Math.cos(angle) + player.physicsObj.velocity[0],
    //             2 * Math.sin(angle) + player.physicsObj.velocity[1]
    //         ),
    //         angularVelocity: 0
    //     });
    //     let obj = this.gameEngine.addObjectToWorld(bullet);
    //     this.gameEngine.timer.add(this.gameEngine.bulletLifeTime, this.destroyBullet, this, [obj.id]);
    // }

    // // destroy the missile if it still exists
    // destroyBullet(bulletId) {
    //     if (this.gameEngine.world.objects[bulletId]) {
    //         this.gameEngine.trace.trace(() => `bullet[${bulletId}] destroyed`);
    //         this.gameEngine.removeObjectFromWorld(bulletId);
    //     }
    // }

    // kill(ship) {
    //     if(ship.lives-- === 0) this.gameEngine.removeObjectFromWorld(ship.id);
    // }

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
