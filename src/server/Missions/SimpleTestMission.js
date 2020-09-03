import Factions from '../../common/Factions';
import Hulls from '../../common/Hulls';
import Victor from 'victor';

// clear the game world and build map and objects
let game = null;

export default class SimpleTestMission {

  constructor(gameEngine) {
    game = gameEngine;
    this.factions = new Factions();
  }

  build() {

    game.addAsteroid({
        x: 0-3000,
        y: 0,
        dX: 0,
        dY: 0,
        mass: 1, size: 500
    });

    game.addAsteroid({
        x: 0,
        y: 3000,
        dX: 0,
        dY: 0,
        mass: 1, size: 1000
    });

    game.addAsteroid({
        x: 0,
        y: 6000,
        dX: 0,
        dY: 0,
        mass: 1, size: 2000
    });

    game.addAsteroid({
        x: 0,
        y: 12000,
        dX: 0,
        dY: 0,
        mass: 1, size: 3000
    });

    game.addAsteroid({
        x: 0,
        y: 50000,
        dX: 0,
        dY: 0,
        mass: 1, size: 9000
    });

    game.addAsteroid({
        x: 0,
        y: 0-3000,
        dX: 0-250,
        dY: 0-400,
        mass: 1, size: 2000
    });

    let hullName = 'bushido';
    let hullData = Hulls[hullName];
    let nv = game.addShip({
        name: "Nuisance Value",
        x: 0,
        y: 0,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        playable: 1,
        faction: this.factions.jupiter
    });

    // hullName = 'tug';
    // hullData = Hulls[hullName];
    // game.addShip({
    //     name: "Target 1",
    //     x: 1000,
    //     y: 2000,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName,
    //     angle: Math.PI,
    //     engine: 3,
    //     faction: Math.pow(2, 1)
    // });
    //
    // game.addShip({
    //     name: "Target 2",
    //     x: 0-1000,
    //     y: 2000,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName,
    //     angle: Math.PI,
    //     engine: 5,
    //     faction: Math.pow(2, 2)
    // });
    //
    // game.addShip({
    //     name: "Target 3",
    //     x: 0,
    //     y: -500,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName,
    //     angle: Math.PI,
    //     engine: 2,
    //     faction: Math.pow(2, 3)
    // });
    //
    // game.addShip({
    //     name: "Target 4",
    //     x: 20000,
    //     y: -10000,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName,
    //     angle: Math.PI/2,
    //     engine: 4,
    //     faction: Math.pow(2, 4)
    // });
    //
    // game.addShip({
    //     name: "Target 5",
    //     x: 20000,
    //     y: -9000,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName,
    //     angle: Math.PI/2,
    //     engine: 3,
    //     faction: Math.pow(2, 5)
    // });
    //
    // game.addShip({
    //     name: "Target 6",
    //     x: 20000,
    //     y: -8000,
    //     dX: 0,
    //     dY: 0,
    //     hull: hullName,
    //     angle: Math.PI/2,
    //     engine: 5,
    //     faction: Math.pow(2, 9)
    // });
    game.addShip({
        name: "Target 7",
        x: 20000,
        y: 20000,
        dX: 0-200,
        dY: 0-700,
        hull: hullName,
        angle: Math.PI*0.66,
        engine: 5,
        faction: Math.pow(2, 2)
    });

  }



}
