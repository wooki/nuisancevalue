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
    this.addAsteroids(50);

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
    this.friendlyStationsById = {};
  for (let i = 0; i < stationPlanets.length; i++) {

      let planet = stationPlanets[i];
      let stationOrbitDistance = planet.size * 2.5; // size is diameter so bigger planets have slightly larger orbit
      let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * planet.physicsObj.mass) / stationOrbitDistance);
      let position = new Victor(stationOrbitDistance, 0);
      let velocity = new Victor(0, 0 - stationOrbitSpeed);
      let rotation = 120 * Math.random();
      position = position.rotateDeg(rotation);
      velocity = velocity.rotateDeg(rotation);
      position = position.add(Victor.fromArray(planet.physicsObj.position));
      velocity = velocity.add(Victor.fromArray(planet.physicsObj.velocity));

      let stationCommsScript = 1;
      if (i == 0) {
        stationCommsScript = 100; // mission start message
      }
      let station = this.game.addShip({
          name: planet.texture + " Station".toUpperCase(),
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          size: 200 + (Math.random() * 300), // need to read mass and size from hull
          hull: 'station',
          commsScript: stationCommsScript,
          angle: (Math.random() * 2),
          faction: this.playerFaction,
          aiScript: 5, // Orbiter
          fixedgravity: planet.id.toString()
      });

      // don't store the earth station - the enemy ships won't hunt it
      if (i != 0) {
        this.friendlyStations.push(station);
        this.friendlyStationsByName[planet.texture] = station;
        this.friendlyStationsById[station.id] = station;
      }

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
    } // stationPlanets

    // create some friendly freighters
    let friendlyFreighters = [
      this.planets.Venus,
      this.planets.Earth,
      this.planets.Saturn,
      this.planets.Uranus,
      this.planets.Neptune
    ];

    this.friendlyFreighters = [];
    this.friendlyStationsById = {};
    for (let i = 0; i < friendlyFreighters.length; i++) {

      let planet = friendlyFreighters[i];
      let stationOrbitDistance = planet.size * 3; // size is diameter so bigger planets have slightly larger orbit
      let stationOrbitSpeed = Math.sqrt((SolarObjects.constants.G * planet.physicsObj.mass) / stationOrbitDistance);
      let position = new Victor(stationOrbitDistance, 0);
      let velocity = new Victor(0, 0 - stationOrbitSpeed);
      let rotation = 180 + (120 * Math.random());
      position = position.rotateDeg(rotation);
      velocity = velocity.rotateDeg(rotation);
      position = position.add(Victor.fromArray(planet.physicsObj.position));
      velocity = velocity.add(Victor.fromArray(planet.physicsObj.velocity));

      let freighter = this.game.addShip({
          name: "Freighter "+i,
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          // hull: 'tug',
          hull: 'blockade-runner',
          commsScript: 0, // none
          angle: (Math.random() * 2),
          faction: this.playerFaction,
          playable: 1,
          aiScript: 3, // Traveller
          // targetId: this.planets.Jupiter.id
          targetId: this.planets.Sol.id
          // targetId: 1 + Math.round(Math.random() * 7)
      });

      this.friendlyFreighters.push(freighter);
      this.friendlyStationsById[freighter.id] = freighter;
    } // friendlyFreighters

    // spawn 1-2 enemy ships around pluto and set random targets


    this.enemyShips = [];
    this.spawnEnemyShips(2, ['blockade-runner', 'bushido']);



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
      // pick a random target
      let targets = this.friendlyFreighters.concat(this.friendlyStations);
      if (targets.length > 0) {
        let target = targets[Math.floor(Math.random()*targets.length)];
        data.ship.targetId = target.id;
      }
    }
  }

  // spawn enemy ships
  spawnEnemyShips(number, hulls) {

    const enemyPlanet = this.planets.Mars;
    let rotation = Math.random() * 180;

    // create and add ships
    for (let j = 0; j < number; j++) {

      // pick a random target
      let targetId = -1;
      let targets = this.friendlyFreighters.concat(this.friendlyStations);
      if (targets.length > 0) {
        let target = targets[Math.floor(Math.random()*targets.length)];
        targetId = target.id;
      }

      let hullName = hulls[j];
      let hullData = Hulls[hullName];
      let shipOrbitDistance = enemyPlanet.size + 4000;
      let shipOrbitSpeed = Math.sqrt((SolarObjects.constants.G * enemyPlanet.physicsObj.mass) / shipOrbitDistance);
      let position = new Victor(shipOrbitDistance, 0);
      let velocity = new Victor(0, 0 - shipOrbitSpeed);
      rotation = rotation + (180 / number);
      position = position.rotateDeg(rotation);
      velocity = velocity.rotateDeg(rotation);
      position = position.add(Victor.fromArray(enemyPlanet.physicsObj.position));
      velocity = velocity.add(Victor.fromArray(enemyPlanet.physicsObj.velocity));

      // if (isNaN(position.x)) {
      //   console.log("enemyPlanet:");
      //   console.dir({
      //     rotation: rotation,
      //     mass: enemyPlanet.physicsObj.mass,
      //     position: enemyPlanet.physicsObj.position,
      //     velocity: enemyPlanet.physicsObj.velocity,
      //   });
      // }
      let enemyShip = this.game.addShip({
          name: "Mikkei "+hullName+" "+j,
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          hull: hullName,
          angle: Math.PI,
          playable: 1,
          faction: this.enemyFaction,
          aiScript: 4,
          targetId: targetId
      });
      this.enemyShips.push(enemyShip);
    }

  }

  // a ship with  traveller ai script has arrived - we can decide what
  // it should do next
  aiTravellerArrival(ship) {

    console.log("aiTravellerArrival "+ship.name+" at "+ship.targetId);

    // pick a new planet to travel to, after a delay
    let currentPlanet = ship.targetId;
    while (currentPlanet == ship.targetId) {
      ship.targetId = Math.round(1 + (Math.random()*8));
    }
    console.log("ship.targetId="+ship.targetId);

  }

  // asteroids between mars and jupiter
  addAsteroids(asteroidCount) {

    let asteroidDistance = SolarObjects.Mars.orbit + ((SolarObjects.Jupiter.orbit - SolarObjects.Mars.orbit) / 2);
    let asteroidDistanceVariance = SolarObjects.Jupiter.diameter * 15;

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

        // add an actual asteroid
        this.game.addAsteroid({
            x: position.x,
            y: position.y,
            dX: v.x,
            dY: v.y,
            mass: Math.random() * 100,
            size: 200 + (Math.random() * 400),
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: Math.random(),
            fixedgravity: this.planets.Sol.id.toString()
        });
    }
  }

}
