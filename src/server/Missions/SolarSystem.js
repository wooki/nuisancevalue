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

    this.planets = SolarObjects.addSolarSystem(this.game, {});

    // player faction
    this.playerFaction = this.factions.ferrous;
    this.enemyFaction = this.factions.mikkei;

    // create friendly stations around a number of planets
    let stationPlanets = [
      this.planets.Earth,
      this.planets.Jupiter,
      this.planets.Saturn,
      this.planets.Neptune,
      this.planets.Uranus
    ];

    this.friendlyStations = [];
    this.friendlyStationsByName = {};
    for (let i = 0; i < stationPlanets.length; i++) {

      let planet = stationPlanets[i];
      let stationOrbitDistance = planet.size * 2.5; // size is diameter so bigger planets have slightly larger orbit
      let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * planet.physicsObj.mass) / stationOrbitDistance);
      let position = new Victor(stationOrbitDistance, 0);
      let velocity = new Victor(0, 0 - stationOrbitSpeed);
      let rotation = 360 * Math.random();
      position = position.rotateDeg(rotation);
      velocity = velocity.rotateDeg(rotation);
      position = position.add(Victor.fromArray(planet.physicsObj.position));
      velocity = velocity.add(Victor.fromArray(planet.physicsObj.velocity));

      let station = this.game.addShip({
          name: planet.texture + " Station".toUpperCase(),
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          size: 200 + (Math.random() * 300), // need to read mass and size from hull
          hull: 'station',
          commsScript: 1,
          dockedCommsScript: 2,
          angle: (Math.random() * 2),
          faction: this.playerFaction,
          fixedgravity: planet.id.toString()
      });

      this.friendlyStations.push(station);
      this.friendlyStationsByName[planet.texture] = station;

      // create player ship around earth
      if (i == 0) {

        let hullName = 'bushido';
        let hullData = Hulls[hullName];
        let playerPosition = new Victor(stationOrbitDistance, 0);
        let playerVelocity = new Victor(0, 0 - stationOrbitSpeed);
        playerPosition = playerPosition.rotateDeg(rotation + 10);
        playerVelocity = playerVelocity.rotateDeg(rotation + 10);
        playerPosition = playerPosition.add(Victor.fromArray(planet.physicsObj.position));
        playerVelocity = playerVelocity.add(Victor.fromArray(planet.physicsObj.velocity));
        this.playerShip = this.game.addShip({
            name: "Nuisance Value",
            x: playerPosition.x,
            y: playerPosition.y,
            dX: playerVelocity.x,
            dY: playerVelocity.y,
            hull: hullName,
            angle: Math.PI,
            playable: 1,
            faction: this.playerFaction,
            fuel: 2500
        });
      }


    }



    this.enemyShips = [];
      for (let j = 0; j < 9; j++) {
        let hullName2 = 'bushido';
        if (j % 2 == 0) hullName2 = 'blockade-runner';
        if (j > 5) hullName2 = 'spacebug';
        if (j > 6 && j % 2 == 0) hullName2 = 'tug';
        let hullData2 = Hulls[hullName2];
        let ship2OrbitDistance = this.planets.Pluto.size + 4000;
        let ship2OrbitSpeed = Math.sqrt((SolarObjects.constants.G * this.planets.Pluto.physicsObj.mass) / ship2OrbitDistance);
        let position = new Victor(ship2OrbitDistance, 0);
        let velocity = new Victor(0, 0 - ship2OrbitSpeed);
        let rotation = Math.round(j * 40);
        position = position.rotateDeg(rotation);
        velocity = velocity.rotateDeg(rotation);
        position = position.add(Victor.fromArray(this.planets.Pluto.physicsObj.position));
        velocity = velocity.add(Victor.fromArray(this.planets.Pluto.physicsObj.velocity));
        let enemyShip = this.game.addShip({
            name: "Profit Margin "+j,
            x: position.x,
            y: position.y,
            dX: velocity.x,
            dY: velocity.y,
            hull: hullName2,
            angle: Math.PI,
            playable: 1,
            faction: this.enemyFaction,
            aiScript: 3, // Traveller
            // aiScript: 4, // Hunter
            targetId: j
            // targetId: planets.Earth.id
            // targetId: this.playerShip.id
        });
        this.enemyShips.push(enemyShip);
      }

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
      this.missionIntro = function(game, seconds) {

        // both still in game
        let earthStation = this.friendlyStationsByName['earth'];
        if (earthStation && this.playerShip) {

          if (this.playerShip.commsState == 0 && earthStation.commsTargetId < 0) {

            // suggest call
            this.playerShip.commsTargetId = earthStation.id;

          } else {
            // try again later
            this.addTimedEvent(seconds+10, this.missionIntro);
          }
        }

      }.bind(this);

      this.addTimedEvent(15, this.missionIntro);
  }

  // step(seconds) {
  //   super.step(seconds);
  //
  // }

  // scanned(scanned, scannedBy) {
  //   super.scanned(scanned, scannedBy);
  //
  // }

  sensed(sensed, sensedBy) {
    super.sensed(sensed, sensedBy);

    // don't wait for scan - if sensed enemy message the player with an under attack message

    // set comms script to under attack (when closed, this reverts to default)

    // start call
  }

  // if an enemy ship is destroyed, spawn 1-2 new ones
  // if a friendly station is destroyed remove it from
  // the array - fail mission when last one destroyed
  destroyed(obj) {

    console.log("OBJECT DESTROYED:"+obj.name);

  }

  event(name, data) {
    super.event(name, data);

    if (name == "AI.Traveller.Arrived") {
      this.aiTravellerArrival(data.ship);
    }

    if (name == "AI.Hunter.NoTarget") {
      console.log("AI.Hunter.NoTarget");
    }
  }

  // a ship with  traveller ai script has arrived - we can decide what
  // it should do next
  aiTravellerArrival(ship) {

    console.log("aiTravellerArrival "+ship.name);

    // pick a new planet to travel to, after a delay
    let currentPlanet = ship.targetId;
    while (currentPlanet == ship.targetId) {
      ship.targetId = Math.round(1 + (Math.random()*8));
    }
    console.log("ship.targetId="+ship.targetId);

    ship.fuel = 10000; // refuel as ai is wasteful
  }

}
