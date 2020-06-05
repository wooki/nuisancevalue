import Hulls from '../../common/Hulls';
import Victor from 'victor';

// clear the game world and build map and objects
let game = null;

export default class SimpleTestMission {

  constructor(gameEngine) {
    game = gameEngine;
  }

  build() {

    // game.addAsteroid({
    //     x: 0-3000,
    //     y: 0,
    //     dX: 0,
    //     dY: 0,
    //     mass: 1, size: 500
    // });
    //
    // game.addAsteroid({
    //     x: 0,
    //     y: 3000,
    //     dX: 0,
    //     dY: 0,
    //     mass: 1, size: 1000
    // });
    //
    // game.addAsteroid({
    //     x: 0,
    //     y: 0-3000,
    //     dX: 0-250,
    //     dY: 0-400,
    //     mass: 1, size: 2000
    // });

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
        playable: 1
    });

    hullName = 'tug';
    hullData = Hulls[hullName];
    game.addShip({
        name: "Target 1",
        x: 1000,
        y: -1000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        engine: 2
    });

    game.addShip({
        name: "Target 2",
        x: 0-1000,
        y: -1000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        engine: 3
    });

    game.addShip({
        name: "Target 3",
        x: 0,
        y: -1000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        engine: 5
    });

    game.addShip({
        name: "Target 4",
        x: 20000,
        y: -10000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI/2,
        engine: 4
    });

    game.addShip({
        name: "Target 5",
        x: 20000,
        y: -9000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI/2,
        engine: 3
    });

    game.addShip({
        name: "Target 6",
        x: 20000,
        y: -8000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI/2,
        engine: 5
    });
    game.addShip({
        name: "Target 7",
        x: 20000,
        y: 20000,
        dX: 0-200,
        dY: 0-700,
        hull: hullName,
        angle: Math.PI*0.66,
        engine: 5
    });

  }



}