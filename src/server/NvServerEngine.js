import { ServerEngine, TwoVector } from 'lance-gg';
import Asteroid from '../common/Asteroid';
import Bullet from '../common/Bullet';
import Ship from '../common/Ship';
import SolarObjects from '../common/SolarObjects';

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
            texture: 'sol'
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
            x: SolarObjects.Mars.orbit, y: 0,
            dX: 0, dY: 0 - marsOrbitSpeed,
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

        // create a single player ship for now name, x, y, dX, dY, mass, hull, size, angle (radians)
        let shipOrbitDistance = Math.floor(SolarObjects.Earth.diameter/2) + 2500;
        let shipOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Earth.mass) / shipOrbitDistance);
        this.gameEngine.addShip({
            name: "Nuisance Value",
            x: SolarObjects.Earth.orbit + shipOrbitDistance + 250,
            y: 250,
            dX: 0, dY: (0 - (earthOrbitSpeed + shipOrbitSpeed)),
            mass: 0.01, size: 100, // need to read mass and size from hull
            hull: 'bushido',
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

        // create a station around jupiter
        let jupiterstationOrbitDistance = Math.floor(SolarObjects.Jupiter.diameter/2) + 5000;
        let jupiterstationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Jupiter.mass) / jupiterstationOrbitDistance);
        this.gameEngine.addShip({
            name: "Jupiter Station 1",
            x: 0 - (SolarObjects.Jupiter.orbit + jupiterstationOrbitDistance),
            y: 0,
            dX: 0, dY: (0 - (jupiterOrbitSpeed + jupiterstationOrbitSpeed)),
            mass: 0.08, size: 180, // need to read mass and size from hull
            hull: 'station',
            angle: 0,
            fixedgravity: jupiter.id.toString()
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
