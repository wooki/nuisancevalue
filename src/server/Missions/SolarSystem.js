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
    this.addAsteroids(25);

    // count player kills
    this.playerKills = 0;

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
            fuel: 4000
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
          hull: 'tug',
          commsScript: 0, // none
          angle: (Math.random() * 2),
          faction: this.playerFaction,
          aiScript: 3, // Traveller
          targetId: 1 + Math.round(Math.random() * 7)
      });

      this.friendlyFreighters.push(freighter);
      this.friendlyStationsById[freighter.id] = freighter;
    } // friendlyFreighters

    // spawn 1-2 enemy ships around pluto and set random targets


    this.enemyShips = [];
    let saturnStation = this.friendlyStationsByName['saturn'];
    this.spawnEnemyShips(1, ['blockade-runner'], saturnStation.id);



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

  missionComplete(game, seconds) {

    // look for earthStation - or any friendly
    let earthStation = this.friendlyStationsByName['earth'];
    if (!earthStation) {
      earthStation = this.friendlyStations[0];
    }

    if (earthStation && this.playerShip) {

      earthStation.commsScript = 2;

      if (this.playerShip.commsState == 0 && earthStation.commsTargetId < 0) {

        // suggest call
        this.playerShip.commsTargetId = earthStation.id;

      } else {
        // try again later
        this.addTimedEvent(seconds+10, this.missionComplete.bind(this));
      }
    }

  }

  // if an enemy ship is destroyed, spawn 1-2 new ones
  // if a friendly station is destroyed remove it from
  // the array - fail mission when last one destroyed
  destroyed(obj) {

    let id = obj.id;

    // check for, remove and replace enemy ships - and check for victory
    for (let i = 0; i < this.enemyShips.length; i++) {
        if (this.enemyShips[i] && this.enemyShips[i].id == id) {
          delete this.enemyShips[i];
          this.playerKills = this.playerKills + 1;
          console.log("Player Kills:"+this.playerKills);

          // spawn 2 replacements
          if (this.playerKills < 6 && this.enemyShips.length < 3) {
            this.spawnEnemyShips(2, ["blockade-runner", "blockade-runner"]);
          } else if (this.playerKills == 6) {

            // send end-game mission message
            this.addTimedEvent(5, this.missionComplete.bind(this));
          }
        }
    }

    // check for and remove friendly stations
    for (let j = 0; j < this.friendlyStations.length; j++) {
      if (this.friendlyStations[j] && this.friendlyStations[j].id == id) {
        delete this.friendlyStations[j];
        delete this.friendlyStationsById[id];
      }
    }

    // check for and remove friendly freighters
    for (let k = 0; k < this.friendlyFreighters.length; k++) {
      if (this.friendlyFreighters[k] && this.friendlyFreighters[k].id == id) {
        delete this.friendlyFreighters[k];
        delete this.friendlyFreightersById[id];
      }
    }

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
  spawnEnemyShips(number, hulls, fixedTargetId) {

    const enemyPlanet = this.planets.Pluto;
    let rotation = Math.random() * 180;

    // create and add ships
    for (let j = 0; j < number; j++) {

      // pick a random target
      let targetId = -1;
      if (fixedTargetId) {
        targetId = fixedTargetId;
      } else {
        let targets = this.friendlyFreighters.concat(this.friendlyStations);
        if (targets.length > 0) {
          let target = targets[Math.floor(Math.random()*targets.length)];
          console.log("Target:"+target.name);
          targetId = target.id;
        }
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

      let enemyShip = this.game.addShip({
          name: "Mikkei "+j,
          x: position.x,
          y: position.y,
          dX: velocity.x,
          dY: velocity.y,
          hull: hullName,
          angle: Math.PI,
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
      ship.targetId = Math.round(1 + (Math.random()*7));
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
