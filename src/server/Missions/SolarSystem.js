import Hulls from '../../common/Hulls';
import SolarObjects from '../../common/SolarObjects';
import Victor from 'victor';
import Mission from './Mission';

export default class SolarSystem extends Mission {

  constructor(gameEngine) {
    super(gameEngine);
  }

  build() {
    super.build();

    let planets = SolarObjects.addSolarSystem(this.game, {});

      // create a station around earth
      let stationOrbitDistance = Math.floor(SolarObjects.Earth.diameter/2) + 2500;
      let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Earth.mass) / stationOrbitDistance);
      let position = new Victor(stationOrbitDistance, 0);
      let velocity = new Victor(0, 0 - stationOrbitSpeed);
      position = position.rotateDeg(45);
      velocity = velocity.rotateDeg(45);
      position = position.add(new Victor(planets.Earth.position.x, planets.Earth.position.y));
      velocity = velocity.add(new Victor(planets.Earth.velocity.x, planets.Earth.velocity.y));

      let earthStation1 = this.game.addShip({
          name: "Earth Station 1",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          size: 560, // need to read mass and size from hull
          hull: 'station',
          commsScript: 1,
          dockedCommsScript: 2,
          angle: 2,
          fixedgravity: planets.Earth.id.toString()
      });

      let hullName = 'bushido';
      let hullData = Hulls[hullName];
      position = new Victor(stationOrbitDistance, 0);
      velocity = new Victor(0, 0 - stationOrbitSpeed);
      position = position.rotateDeg(55);
      velocity = velocity.rotateDeg(55);
      position = position.add(new Victor(planets.Earth.position.x, planets.Earth.position.y));
      velocity = velocity.add(new Victor(planets.Earth.velocity.x, planets.Earth.velocity.y));
      let nv = this.game.addShip({
          name: "Nuisance Value",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          hull: hullName,
          angle: Math.PI,
          playable: 1,
          fuel: 2500
      });


      let hullName2 = 'blockade-runner';
      let hullData2 = Hulls[hullName2];
      let ship2OrbitDistance = Math.floor(SolarObjects.Mars.diameter/2) + 2000;
      let ship2OrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Mars.mass) / ship2OrbitDistance);
      position = new Victor(ship2OrbitDistance, 0);
      velocity = new Victor(0, 0 - ship2OrbitSpeed);
      position = position.rotateDeg(75);
      velocity = velocity.rotateDeg(75);
      position = position.add(new Victor(planets.Mars.position.x, planets.Mars.position.y));
      velocity = velocity.add(new Victor(planets.Mars.velocity.x, planets.Mars.velocity.y));
      this.game.addShip({
          name: "Profit Margin",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          hull: hullName2,
          angle: Math.PI,
          playable: 1,
          aiScript: 2, // Traveller
          targetId: planets.Earth.id
      });

      let jupiterstationOrbitDistance = Math.floor(SolarObjects.Jupiter.diameter/2) + 5000;
      let jupiterOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Jupiter.mass) / jupiterstationOrbitDistance);
      position = new Victor(jupiterstationOrbitDistance, 0);
      velocity = new Victor(0, 0 - jupiterOrbitSpeed);
      position = position.rotateDeg(320);
      velocity = velocity.rotateDeg(320);
      position = position.add(new Victor(planets.Jupiter.position.x, planets.Jupiter.position.y));
      velocity = velocity.add(new Victor(planets.Jupiter.velocity.x, planets.Jupiter.velocity.y));
      this.game.addShip({
          name: "Jupiter Station",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          mass: 0.03, size: 180, // need to read mass and size from hull
          hull: 'station',
          commsScript: 1,
          dockedCommsScript: 2,
          angle: 0,
          fixedgravity: planets.Jupiter.id.toString()
      });

      let saturnStationOrbitDistance = Math.floor(SolarObjects.Saturn.diameter/2) + 5000;
      let saturnOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Saturn.mass) / saturnStationOrbitDistance);
      position = new Victor(saturnStationOrbitDistance, 0);
      velocity = new Victor(0, 0 - saturnOrbitSpeed);
      position = position.rotateDeg(30);
      velocity = velocity.rotateDeg(30);
      position = position.add(new Victor(planets.Saturn.position.x, planets.Saturn.position.y));
      velocity = velocity.add(new Victor(planets.Saturn.velocity.x, planets.Saturn.velocity.y));
      this.game.addShip({
          name: "Saturn Station",
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          mass: 0.07, size: 320, // need to read mass and size from hull
          hull: 'station',
          commsScript: 1,
          dockedCommsScript: 2,
          angle: 30,
          fixedgravity: planets.Saturn.id.toString()
      });

      // asteroids between mars and jupiter
      let asteroidDistance = SolarObjects.Mars.orbit + ((SolarObjects.Jupiter.orbit - SolarObjects.Mars.orbit) / 2);
      let asteroidDistanceVariance = SolarObjects.Jupiter.diameter * 15;

      for (let asteroidIndex = 0; asteroidIndex < 20; asteroidIndex++) {

          // create a point and vector then rotate to a random position
          let x = asteroidDistance - (asteroidDistanceVariance/2) + (Math.random() * asteroidDistanceVariance);
          let position = new Victor(x, 0);
          let asteroidOrbitSpeed = Math.sqrt((SolarObjects.constants.G * SolarObjects.Sol.mass) / x);
          let v = new Victor(0, 0 - asteroidOrbitSpeed);

          // rotate degrees
          let r = Math.random() * 359;
          position = position.rotateDeg(r);
          v = v.rotateDeg(r);

          // add an actual asteroid
          this.game.addAsteroid({
              x: position.x,
              y: position.y,
              dX: v.x,
              dY: v.y,
              mass: Math.random() * 100, size: 200 + (Math.random() * 400),
              angle: Math.random() * 2 * Math.PI,
              angularVelocity: Math.random(),
              // fixedgravity: sol.id.toString()
          });
      }

      // set-up some events

      // if NV comms closed then call from Earth Station 1
      let callNuisanceValue = function(game, seconds) {

        // both still in game
        if (earthStation1 && nv) {

          if (nv.commsState == 0 && earthStation1.commsTargetId < 0) {

            // suggest call
            nv.commsTargetId = earthStation1.id;

          } else {
            // try again later
            this.addTimedEvent(seconds+10, callNuisanceValue);
          }
        }

      }.bind(this);

      this.addTimedEvent(15, callNuisanceValue);
  }

  step(seconds) {
    super.step(seconds);

  }

}
