import Hulls from '../../common/Hulls';
import SolarObjects from '../../common/SolarObjects';
import Victor from 'victor';

// clear the game world and build map and objects
let game = null;

export default class TestMission {

  constructor(gameEngine) {
    game = gameEngine;
  }

  build() {

    game.addPlanet({
      x: -6000,
      y: 3000,
      dX: 200,
      dY: 0,
      mass: SolarObjects.Mars.mass,
      size: SolarObjects.Mars.diameter,
      texture: 'mars',
      angle: Math.random() * 2 * Math.PI,
      angularVelocity: Math.random()
    });

    // add an actual asteroid
    game.addAsteroid({
        x: 0-5000,
        y: 100,
        dX: 7,
        dY: 0,
        mass: 1, size: 1200,
        angle: Math.random() * 2 * Math.PI,
        angularVelocity: Math.random()
    });
    game.addAsteroid({
        x: 4600,
        y: 0-500,
        dX: 0-5,
        dY: 0,
        mass: 1, size: 800,
        angle: Math.random() * 2 * Math.PI,
        angularVelocity: Math.random()
    });

    let hullName = 'spacebug';
    let hullData = Hulls[hullName];
    let nv = game.addShip({
        name: "Spacebug 1",
        x: -2000,
        y: 1000,
        dX: -60,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        playable: 1
        // damage: this.damage.getRandomDamage(1, 0, hullData.damage) // do some dummy damage for testing
    });

    let hullName2 = 'tug';
    let hullData2 = Hulls[hullName2];
    let tug = game.addShip({
        name: "Target Practice",
        x: 500,
        y: 800,
        dX: 0-40,
        dY: 0-5,
        hull: hullName2,
        angle: Math.PI*1.3,
        playable: 1,
        angularVelocity: Math.random()
    });

    setTimeout(function() {

      game.addTorpedo({
          x: -4000,
          y: 8000,
          dX: 0,
          dY: 0,
          mass: 0.0005,
          angle: 0,
          targetId: tug.id,
          fuel: 100,
          engine: 0
      });
    }.bind(this), 5000);

    game.addTorpedo({
        x: -3000,
        y: -3000,
        dX: 0,
        dY: 0,
        mass: 0.0005,
        angle: Math.PI,
        targetId: tug.id,
        fuel: 100,
        engine: 0
    });

    // random asteroids
    let asteroidDistance = 6000;
    let asteroidDistanceVariance = 2000;

    for (let asteroidIndex = 0; asteroidIndex < 20; asteroidIndex++) {

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
        let asteroidSize = 200 + (Math.random() * 500);

        // add an actual asteroid
        game.addAsteroid({
            x: position.x,
            y: position.y,
            dX: v.x,
            dY: v.y,
            mass: (asteroidSize/300), size: asteroidSize,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: Math.random() * Math.PI
        });
    }
  }



}
