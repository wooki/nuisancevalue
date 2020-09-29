import Hulls from '../../common/Hulls';
import Factions from '../../common/Factions';
import SolarObjects from '../../common/SolarObjects';
import Victor from 'victor';
import Mission from './Mission';

export default class ExplorationMission extends Mission {

  constructor(game) {
    super(game);
  }

  build() {
    super.build();

    // add two stars
    let star1Mass = SolarObjects.Sol.mass * 2.5;
    let star2Mass = SolarObjects.Sol.mass * 0.6;
    let distanceApart = (SolarObjects.Sol.diameter * 1.6) * 2;
    let star2OrbitSpeed = 0 - Math.sqrt((SolarObjects.constants.G * star1Mass) / distanceApart);

    this.star1 = this.game.addPlanet({
				x: 1, y: 0,
				dX: 0, dY: 0,
				mass: star1Mass,
				size: SolarObjects.Sol.diameter * 0.5,
				angle: Math.random() * 2 * Math.PI,
				angularVelocity: Math.random(),
				texture: 'sol'
		});

    this.star2 = this.game.addPlanet({
				x: distanceApart, y: 0,
				dX: 0, dY: star2OrbitSpeed,
				mass: star2Mass,
				size: SolarObjects.Sol.diameter * 1.6,
				angle: Math.random() * 2 * Math.PI,
				angularVelocity: 0 - Math.random(),
				texture: 'sol',
        fixedgravity: this.star1.id
		});

    this.star1.fixedgravity = this.star2.id;

    // add asteroid belt
    this.addAsteroids(12, true);
    this.addAsteroids(58, false);

    // player faction
    this.playerFaction = this.factions.ferrous;

    // add player ship
    this.playerShip = this.game.addShip({
        name: "Nuisance Value",
        x: 0 - SolarObjects.Neptune.orbit,
        y: 0 - (SolarObjects.Neptune.orbit / 2),
        dX: 0,
        dY: 0,
        hull: 'bushido',
        angle: 0 - (Math.PI * 0.25),
        playable: 1,
        faction: this.playerFaction,
        fuel: 10000
    });
  }


  // asteroids between mars and jupiter
  addAsteroids(asteroidCount, big) {

    let asteroidDistance = SolarObjects.Mercury.orbit + ((SolarObjects.Jupiter.orbit - SolarObjects.Mercury.orbit) / 2);
    let asteroidDistanceVariance = SolarObjects.Earth.orbit;
    let addFunc = this.game.addAsteroid.bind(this.game);
    if (big) {
      addFunc = this.game.addPlanet.bind(this.game);
    }
    let bigHalfSize = SolarObjects.Mercury.diameter;
    let bigHalfMass = SolarObjects.Mercury.mass;
    let bigDensity = bigHalfSize / bigHalfMass;

    for (let asteroidIndex = 0; asteroidIndex < asteroidCount; asteroidIndex++) {

        // create a point and vector then rotate to a random position
        let x = asteroidDistance - (asteroidDistanceVariance/2) + (Math.random() * asteroidDistanceVariance);
        let position = new Victor(x, 0);
        let asteroidOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / x);
        let v = new Victor(0, 0 - asteroidOrbitSpeed);

        // rotate degrees
        let r = Math.random() * 359;
        position = position.rotateDeg(r);
        v = v.rotateDeg(r);

        let mass = (bigHalfMass/8) + (Math.random() * (bigHalfMass/4));
        if (big) {
          mass = bigHalfMass + (Math.random() * bigHalfMass);
        }
        let size = mass * bigDensity;

        // this.game.addAsteroid({
        addFunc({
            texture: 'asteroid',
            x: position.x,
            y: position.y,
            dX: v.x,
            dY: v.y,
            mass: mass,
            size: size,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: Math.random()
        });
    }
  }


}
