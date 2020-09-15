import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';

// useful baseclass for ships - manages scanning, sensed objects and firing on
// enemies if armed..
// maybe more in the future - e.g. avoid torps
// maybe util methods such as orbit/dock etc
export default class BaseShip {

	// start checking for enemy ship in range and firing
	scanned(ship, target, mission, game) {
		// console.log("TODO: BaseShip scanned");

		if (!ship.aiTargets) ship.aiTargets = [];
		ship.aiTargets.push(target);
	}

	// start attempting a scan
	sensed(ship, target, mission, game) {
		// console.log("TODO: BaseShip sensed");

		// log this ship as a potential to scan
		if (!ship.aiScanTargets) ship.aiScanTargets = [];
		ship.aiScanTargets.push(target);
	}

	// better place to scan/fire from as less frequent
	// should be every 1s - plus server only
	plan(ship, mission, game) {
	}

	// check for scanned enemies and possibly fire
	// attempt scan of sensed objects
	execute(ship, game) {
		// console.log("TODO: BaseShip execute");

		// always refuel
		let hullData = ship.getHullData();
		if (hullData.ai && hullData.ai.refuel) {
			ship.fuel = ship.fuel + hullData.ai.refuel;
			if (ship.fuel > hullData.fuel) {
				ship.fuel = hullData.fuel;
			}
		}
	}

	// utility for subclasses
	// desired vector is directly towards target at magnitude=travelSpeed
	// turn to face orbital path and fire only when within 30deg of target
	leaveOrbit(ship, target, travelSpeed, game) {

		if (ship.gravityData && ship.gravityData.direction) {

			// our data
			let ourPos = Victor.fromArray(ship.physicsObj.position);
			let ourVelocity = new Victor(ship.physicsObj.velocity[0], ship.physicsObj.velocity[1]);

			// remove grav sources velocity
			let gravVelocity = new Victor(ship.gravityData.velocity[0], ship.gravityData.velocity[1]);
			let ourRelativeVelocity = ourVelocity.clone().subtract(gravVelocity);

			// target/destination
			if (target && target.physicsObj) {
				let targetV = Victor.fromArray(target.physicsObj.position).subtract(ourPos);
				let targetAngle = 0 - targetV.verticalAngle() % (Math.PI*2);

				// calculate which way we should face (along orbit path - hopefully)
				let directionAngle = 0 - ourRelativeVelocity.verticalAngle() % (Math.PI*2);
				let ourBearing = ship.physicsObj.angle % (Math.PI*2);
				let bearingChange = directionAngle - ourBearing;
				if (bearingChange < -Math.PI) bearingChange = bearingChange + (Math.PI*2)
				if (bearingChange > Math.PI) bearingChange = bearingChange - (Math.PI*2)

				// turn to face path - prefer turning right, because of anticlockwise orbit
				if (bearingChange > 0.1) {
					if (ship.physicsObj.angularVelocity <= 0.1) {
						ship.applyManeuver('r');
					}
				} else if (bearingChange < -0.1) {
					if (ship.physicsObj.angularVelocity >= -0.1) {
						ship.applyManeuver('l');
					}
				}

				// if we're close to facing our destination then fire engine
				let angleFromTarget = targetAngle - ourBearing;
				if (angleFromTarget < -Math.PI) angleFromTarget = angleFromTarget + (Math.PI*2)
				if (angleFromTarget > Math.PI) angleFromTarget = angleFromTarget - (Math.PI*2)

				if (Math.abs(angleFromTarget) < 0.2 && Math.abs(bearingChange) < 0.4) {
					ship.engine = 5;
				} else {
					ship.engine = 0;
				}
			} else {
				ship.engine = 0;
			}

		} else {
			// no gravity to start so travel
			ship.aiPlan = 3;
		}

	}

	// utility for subclasses
	// work out desired vector towards target, adjust for current velocity
	travel(ship, target, travelSpeed, game) {

		let maxSpeed = travelSpeed;

		// our data
		let ourPos = Victor.fromArray(ship.physicsObj.position);
		let ourVelocity = new Victor(ship.physicsObj.velocity[0], ship.physicsObj.velocity[1]);
		let ourSpeed = ourVelocity.magnitude();

		// target/destination
		if (target && target.physicsObj) {
			let targetPos = Victor.fromArray(target.physicsObj.position);
			let targetVelocity = new Victor(target.physicsObj.velocity[0], target.physicsObj.velocity[1]);
			let targetV = targetPos.clone().subtract(ourPos);

			// check distance to target and slow down when approaching
			let distance = ourPos.clone().subtract(targetPos).magnitude();

			//  calculate linear deceleration from 2 mins
			let hullData = ship.getHullData(); // calculate based on thrust/weight
			const deccelrationRatio = 12 / (hullData.thrust / hullData.mass);
			const startDeceleration = ourSpeed * 60 * deccelrationRatio; // start 2 mins out

			if (distance < startDeceleration) {
				let percentageThroughDecel = (distance / startDeceleration);
				maxSpeed = 200 + (ourSpeed * percentageThroughDecel);
			}

			// normalise then set to our desired speed
			targetV = targetV.normalize().multiply(new Victor(maxSpeed, maxSpeed));

			// work out best vector to burn engine along
			let correctionV = targetV.clone().subtract(ourVelocity);

			// if our bearing does not match then rotate
			let correctionAngle = 0 - correctionV.verticalAngle() % (Math.PI*2);
			let ourBearing = ship.physicsObj.angle % (Math.PI*2);
			let bearingChange = correctionAngle - ourBearing;
			if (bearingChange < -Math.PI) bearingChange = bearingChange + (Math.PI*2)
			if (bearingChange > Math.PI) bearingChange = bearingChange - (Math.PI*2)

			if (bearingChange < 0.1) {
					ship.engine = 0;
					if (ship.physicsObj.angularVelocity >= -0.1) {
						ship.applyManeuver('l');
					}

			} else if (bearingChange > -0.1) {
					ship.engine = 0;
					if (ship.physicsObj.angularVelocity <= 0.1) {
						ship.applyManeuver('r');
					}
			}

			// if our bearing is close to desired then fire engine
			if (Math.abs(bearingChange) < 0.1 && correctionV.magnitude() > 20) { // only bother when drifting away from desired
				ship.engine = 5;
			} else {
				ship.engine = 0;
			}
		}
	}

	// utility for subclasses
	// given our distance from current gravity source calculate circular orbit
	// as vector, work out vector that will get from our current vector to the
	// desired one and try to maneuver/engine to that vector
	stabiliseOrbit(ship, favouredOrbit, game) {

		// get our current gravity source
		if (ship.gravityData && ship.gravityData.direction) {

			const desiredOrbitDistance = favouredOrbit + (ship.gravityData.size / 2);

			let ourPos = Victor.fromArray(ship.physicsObj.position);
			let ourVelocity = new Victor(ship.physicsObj.velocity[0], ship.physicsObj.velocity[1]);

			// what speed need we be at to be in circular orbit at current distance
			let gDistance = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);
			let distance = gDistance.length();
			let orbitSpeed = Math.sqrt((SolarObjects.constants.G * ship.gravityData.mass) / distance + 1);
			let angleOffset = 90;
			if (distance < (desiredOrbitDistance * 0.8)) {
				// orbitSpeed = orbitSpeed * 1.1;
			} else if (distance > (desiredOrbitDistance * 2)) {
				angleOffset = 60;
				// orbitSpeed = orbitSpeed * 0.75;
			} else if (distance > desiredOrbitDistance) {
				// orbitSpeed = orbitSpeed * 0.9;
			}

			// create a vector that matches that speed, perpendicular (anti-clockwise) from gravity source
			let orbitV = new Victor(0, orbitSpeed);
			orbitV = orbitV.rotate(0 - gDistance.verticalAngle()); // rotate to face grav source
			orbitV = orbitV.rotateDeg(angleOffset);

			// add on the sources actual velocity as well
			let sourceV = Victor.fromArray(ship.gravityData.velocity);
			orbitV = sourceV.add(orbitV);

			let correctionV = orbitV.clone().subtract(ourVelocity);

			// if our bearing does not match then rotate
			let correctionAngle = 0 - correctionV.verticalAngle() % (Math.PI*2);
			let ourBearing = ship.physicsObj.angle % (Math.PI*2);
			let bearingChange = correctionAngle - ourBearing;
			if (bearingChange < -Math.PI) bearingChange = bearingChange + (Math.PI*2)
			if (bearingChange > Math.PI) bearingChange = bearingChange - (Math.PI*2)

			if (bearingChange < 0.1) {
					ship.engine = 0;
					if (ship.physicsObj.angularVelocity >= -0.1) {
						ship.applyManeuver('l');
					}

			} else if (bearingChange > -0.1) {
					ship.engine = 0;
					if (ship.physicsObj.angularVelocity <= 0.1) {
						ship.applyManeuver('r');
					}

			}

			// if our bearing is close to desired then fire engine
			if (Math.abs(bearingChange) < 0.1 && correctionV.magnitude() > 20) { // only bother when drifting away from desired
				ship.engine = 5;
			} else {
				ship.engine = 0;
			}

		} else {
			ship.engine = 0;
		}

	}

};
