import Hulls from '../../common/Hulls';
import Factions from '../../common/Factions';
import SolarObjects from '../../common/SolarObjects';
import Victor from 'victor';

// clear the game world and build map and objects
let game = null;

export default class TestMission {

  constructor(gameEngine) {
    game = gameEngine;
    this.factions = new Factions();
  }

  build() {

    game.addAsteroid({
        x: 110000,
        y: 0,
        dX: 0,
        dY: 0,
        mass: 1, size: 500
    });

    game.addAsteroid({
        x: 210000,
        y: 0,
        dX: 0,
        dY: 0,
        mass: 1, size: 1500
    });

    game.addAsteroid({
        x: 510000,
        y: 0,
        dX: 0,
        dY: 0,
        mass: 1, size: 2500
    });

    game.addAsteroid({
        x: 310000,
        y: 0,
        dX: 0,
        dY: 0,
        mass: 1, size: 2200
    });

    // let mars = game.addPlanet({
    //   x: 20000,
    //   y: 0,
    //   dX: 0,
    //   dY: 0,
    //   mass: SolarObjects.Mars.mass,
    //   size: SolarObjects.Mars.diameter,
    //   texture: 'mars',
    //   angle: Math.random() * 2 * Math.PI,
    //   angularVelocity: Math.random()
    // });

    for (let i = 0; i < 1; i++) {
      let hullName = 'spacebug';
      let hullData = Hulls[hullName];
      let nv = game.addShip({
          name: "Spacebug "+i,
          x: -3000 + (Math.random() * 6000),
          y: -3000 + (Math.random() * 6000),
          dX: 0,
          dY: 0,
          hull: hullName,
          angle: Math.PI,
          faction: this.factions.spaceForce,
          playable: (i == 0 ? 1 : 0),
          aiScript: (i == 0 ? 0 : 2),
          // targetId: mars.id
          // damage: this.damage.getRandomDamage(1, 0, hullData.damage) // do some dummy damage for testing
      });
    }

    let earthStation1 = game.addShip({
        name: "Earth Station 1",
        x: 60000,
        y: 0,
        dX: 0,
        dY: 0,
        size: 560, // need to read mass and size from hull
        hull: 'station',
        commsScript: 1,
        dockedCommsScript: 2,
        angle: 2,
        faction: this.factions.russian,
    });

    // let hullName2 = 'tug';
    // let hullData2 = Hulls[hullName2];
    // let tug = game.addShip({
    //     name: "Target Practice",
    //     x: 5000,
    //     y: 0,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName2,
    //     angle: Math.PI*0.5,
    //     // angle: Math.PI*0.5,
    //     playable: 0,
    //     aiScript: 2
    // });

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
    // random asteroids
    let asteroidDistance = 20000;
    let asteroidDistanceVariance = 5000;

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
        let asteroidSize = 200 + (Math.random() * 500);

        // add an actual asteroid
        game.addAsteroid({
            x: position.x,
            y: position.y,
            // dX: v.x,
            // dY: v.y,
            dX: 0,
            dY: 0,
            mass: (asteroidSize/300), size: asteroidSize,
            angle: Math.random() * 2 * Math.PI,
            // angularVelocity: Math.random() * Math.PI
        });
    }
  }



}
