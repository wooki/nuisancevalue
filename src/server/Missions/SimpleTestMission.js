import Hulls from '../../common/Hulls';
import Victor from 'victor';

// clear the game world and build map and objects
let game = null;

export default class SimpleTestMission {

  constructor(gameEngine) {
    game = gameEngine;
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
        playable: 1
    });

  }



}
