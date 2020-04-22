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
        this.gameEngine.addShip({
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
