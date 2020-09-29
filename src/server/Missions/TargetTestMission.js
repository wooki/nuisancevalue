import Factions from '../../common/Factions';
import Hulls from '../../common/Hulls';
import Victor from 'victor';
import Mission from './Mission';

export default class TargetTestMission extends Mission {

  constructor(gameEngine) {
    super(gameEngine);
  }

  build() {
    super.build();

    this.game.addAsteroid({
        x: 0-3000,
        y: 0,
        dX: 0,
        dY: 0,
        mass: 1, size: 500
    });

    this.game.addAsteroid({
        x: 0,
        y: 3000,
        dX: 0,
        dY: 0,
        mass: 1, size: 1000
    });

    this.game.addAsteroid({
        x: 0,
        y: 6000,
        dX: 0,
        dY: 0,
        mass: 1, size: 2000
    });

    this.game.addAsteroid({
        x: 0,
        y: 12000,
        dX: 0,
        dY: 0,
        mass: 1, size: 3000
    });

    this.game.addAsteroid({
        x: 0,
        y: 50000,
        dX: 0,
        dY: 0,
        mass: 1, size: 9000
    });

    this.game.addAsteroid({
        x: 0,
        y: 0-3000,
        dX: 0-250,
        dY: 0-400,
        mass: 1, size: 2000
    });

    let hullName = 'frigate';
    let hullData = Hulls[hullName];
    let nv = this.game.addShip({
        name: "Nuisance Value",
        x: 0,
        y: 0,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        playable: 1,
        fuel: 40000,
        faction: this.factions.jupiter
    });

    hullName = 'tug';
    hullData = Hulls[hullName];
    this.game.addShip({
        name: "Target 1",
        x: 1000,
        y: 2000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        engine: 3,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 1)
    });

    this.game.addShip({
        name: "Target 2",
        x: 0-1000,
        y: 2000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        engine: 5,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 2)
    });

    this.game.addShip({
        name: "Target 3",
        x: 0,
        y: -500,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI,
        engine: 2,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 3)
    });

    this.game.addShip({
        name: "Target 4",
        x: 20000,
        y: -10000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI/2,
        engine: 4,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 4)
    });

    this.game.addShip({
        name: "Target 5",
        x: 20000,
        y: -9000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI/2,
        engine: 3,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 5)
    });

    this.game.addShip({
        name: "Target 6",
        x: 20000,
        y: -8000,
        dX: 0,
        dY: 0,
        hull: hullName,
        angle: Math.PI/2,
        engine: 5,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 9)
    });
    this.game.addShip({
        name: "Target 7",
        x: 20000,
        y: 20000,
        dX: 0-200,
        dY: 0-700,
        hull: hullName,
        angle: Math.PI*0.66,
        engine: 5,
        aiScript: 2, // BaseShip
        faction: Math.pow(2, 2)
    });

  }



}
