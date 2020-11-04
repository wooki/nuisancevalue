import Factions from '../../common/Factions';
import Hulls from '../../common/Hulls';
import SolarObjects from '../../common/SolarObjects';
import Victor from 'victor';
import Mission from './Mission';

export default class PilotTrainingMission extends Mission {

  constructor(gameEngine) {
    super(gameEngine);

    this.playerShips = [];
    this.playerCount = 5;
    this.playerFaction = this.factions.ferrous;
  }

  build() {
    super.build();

    let star1Mass = SolarObjects.Saturn.mass * 1.2;
    this.star = this.game.addPlanet({
        name: "Planet".toUpperCase(),
				x: 0, y: 0,
				dX: 0, dY: 0,
				mass: star1Mass,
				size: SolarObjects.Saturn.diameter * 1.2,
				angle: Math.random() * 2 * Math.PI,
				angularVelocity: Math.random(),
				texture: 'saturn',
        ignoregravity: 1 // otherwise the whole map loses coherence
		});


    // add asteroid belt
    this.addAsteroids(24, false);

    // create a central station orbiting the star
    let stationOrbitDistance = this.star.size * 1.5; // size is diameter so bigger planets have slightly larger orbit
    let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * this.star.physicsObj.mass) / stationOrbitDistance);
    let stationPosition = new Victor(stationOrbitDistance, 0);
    let stationVelocity = new Victor(0, 0 - stationOrbitSpeed);
    let stationRotation = Math.random() * 359;
    stationPosition = stationPosition.rotateDeg(stationRotation);
    stationVelocity = stationVelocity.rotateDeg(stationRotation);
    stationPosition = stationPosition.add(Victor.fromArray(this.star.physicsObj.position));
    stationVelocity = stationVelocity.add(Victor.fromArray(this.star.physicsObj.velocity));

    let stationCommsScript = 1;
    this.station = this.game.addShip({
        name: "Station".toUpperCase(),
        x: stationPosition.x,
        y: stationPosition.y,
        dX: stationVelocity.x,
        dY: stationVelocity.y,
        hull: 'station',
        commsScript: stationCommsScript,
        angle: (Math.random() * 2),
        faction: this.playerFaction,
        aiScript: 5, // Orbiter
        fixedgravity: this.star.id
    });

    // add 5 planets in the outer system, orbited by player fighter
    let angleDelta = 360/this.playerCount;

    for (let i = 0; i < this.playerCount; i++) {
      let asteroidDistance = SolarObjects.Mars.orbit;
      let asteroidSpeed = Math.sqrt((SolarObjects.constants.G * star1Mass) / asteroidDistance);

      let position = new Victor(asteroidDistance, 0);
      let v = new Victor(0, 0 - asteroidSpeed);

      // rotate degrees
      let r = angleDelta * i;
      position = position.rotateDeg(r);
      v = v.rotateDeg(r);

      // this.game.addAsteroid({
      let planet = this.game.addPlanet({
          texture: 'uranus',
          x: position.x,
          y: position.y,
          dX: v.x,
          dY: v.y,
          mass: SolarObjects.Neptune.mass,
          size: SolarObjects.Neptune.diameter,
          angle: 0,
          angularVelocity: 0
      });

      // add a playable ship in orbit
      let hullName = 'fighter';
      let hullData = Hulls[hullName];
      let playerOrbitDistance = planet.size * 1.5; // size is diameter so bigger planets have slightly larger orbit
      let playerOrbitSpeed = Math.sqrt((SolarObjects.constants.G * planet.physicsObj.mass) / playerOrbitDistance);
      let playerPosition = new Victor(playerOrbitDistance, 0);
      let playerVelocity = new Victor(0, 0 - playerOrbitSpeed);
      let playerRotation = angleDelta * i;
      playerPosition = playerPosition.rotateDeg(playerRotation);
      playerVelocity = playerVelocity.rotateDeg(playerRotation);
      playerPosition = playerPosition.add(Victor.fromArray(planet.physicsObj.position));
      playerVelocity = playerVelocity.add(Victor.fromArray(planet.physicsObj.velocity));
      let playerShip = this.game.addShip({
          name: "Red-"+(i+1),
          x: playerPosition.x,
          y: playerPosition.y,
          dX: playerVelocity.x,
          dY: playerVelocity.y,
          hull: hullName,
          angle: angleDelta * i * (Math.PI/180),
          playable: 1,
          faction: this.playerFaction,
          fuel: 5000
      })
      this.playerShips.push(playerShip);

      playerShip.addWaypoint(this.star.id, 0);
      playerShip.addWaypoint(this.station.id, 0);
    }




  }


  // asteroids between mars and jupiter
  addAsteroids(asteroidCount, big) {

    let asteroidDistance = SolarObjects.Earth.orbit + ((SolarObjects.Venus.orbit - SolarObjects.Earth.orbit) / 2);
    let asteroidDistanceVariance = SolarObjects.Mercury.orbit / 2;
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
            texture: 'asteroid'+(asteroidIndex%6),
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
