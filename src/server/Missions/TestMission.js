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
      x: 0,
      y: 0,
      dX: 0-100,
      dY: 0-25,
      mass: SolarObjects.Mars.mass,
      size: SolarObjects.Mars.diameter,
      texture: 'mars',
      angle: Math.random() * 2 * Math.PI,
      angularVelocity: Math.random()
    });

    let hullName = 'spacebug';
    let hullData = Hulls[hullName];
    let nv = game.addShip({
        name: "Spacebug 1",
        x: 3000,
        y: 3000,
        dX: 0,
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
        x: 5000,
        y: 0,
        dX: 0,
        dY: 0,
        hull: hullName2,
        angle: Math.PI*0.5,
        // angle: Math.PI*0.5,
        playable: 0,
        aiScript: 2
    });

    // setTimeout(function() {
    //
    //   game.addTorpedo({
    //       x: -4000,
    //       y: 8000,
    //       dX: 0,
    //       dY: 0,
    //       mass: 0.0005,
    //       angle: 0,
    //       targetId: tug.id,
    //       fuel: 100,
    //       engine: 0
    //   });
    // }.bind(this), 5000);
    //
    // game.addTorpedo({
    //     x: -3000,
    //     y: -3000,
    //     dX: 0,
    //     dY: 0,
    //     mass: 0.0005,
    //     angle: Math.PI,
    //     targetId: tug.id,
    //     fuel: 100,
    //     engine: 0
    // });
    //
    // // random asteroids
    // let asteroidDistance = 6000;
    // let asteroidDistanceVariance = 2000;
    //
    // for (let asteroidIndex = 0; asteroidIndex < 20; asteroidIndex++) {
    //
    //     // create a point and vector then rotate to a random position
    //     let x = asteroidDistance - (asteroidDistanceVariance/2) + (Math.random() * asteroidDistanceVariance);
    //     let position = new Victor(x, 0);
    //     let asteroidOrbitSpeed = Math.sqrt((SolarObjects.constants.G * 100) / x);
    //     let v = new Victor(0, 0 - asteroidOrbitSpeed);
    //
    //     // rotate degrees
    //     let r = Math.random() * 359;
    //     position = position.rotateDeg(r);
    //     r = Math.random() * 359; // random vector
    //     v = v.rotateDeg(r);
    //
    //     // mass
    //     let asteroidSize = 200 + (Math.random() * 500);
    //
    //     // add an actual asteroid
    //     game.addAsteroid({
    //         x: position.x,
    //         y: position.y,
    //         dX: v.x,
    //         dY: v.y,
    //         mass: (asteroidSize/300), size: asteroidSize,
    //         angle: Math.random() * 2 * Math.PI,
    //         angularVelocity: Math.random() * Math.PI
    //     });
    // }
  }



}
