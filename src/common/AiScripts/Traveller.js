import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';

// leaves orbit, travels then enter orbit at destination
export default class Traveller {

	// check what phase we want to be in
	plan(ship, game) {

		// default to stabilise orbit
		if (!ship.aiPlan) {
			ship.aiPlan = 1;
			// ship.orbitTime = 30 + (Math.random()*90);
			ship.orbitTime = 8;
		}


		// in stable orbit
		if (ship.aiPlan == 1) {
			ship.orbitTime = ship.orbitTime - 1;
			console.log("ship.orbitTime="+ship.orbitTime);
			if (ship.orbitTime <= 0 && ship.targetId > -1) {
				ship.aiPlan = 2; // leave orbit once orbit for some time
			}
		}

		// leaving orbit
		if (ship.aiPlan == 2) {

			// start to travel once 10k away from surface of gravity source
			if (ship.targetId > -1) {

				let ourPos = Victor.fromArray(ship.physicsObj.position);
				let gravVector = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);

				if (gravVector.magnitude() > 10000) {
					ship.aiPlan = 3; // travel to destination
				}
			}
		}

		// in travel
		if (ship.aiPlan == 3) {

			// start to orbit once 10k away from target
			if (ship.targetId > -1) {

				let ourPos = Victor.fromArray(ship.physicsObj.position);
				let target = game.world.queryObject({ id: parseInt(ship.targetId) });
				let targetPos = Victor.fromArray(target.physicsObj.position);
				let distance = ourPos.clone().subtract(targetPos);

				// if we're within 20,000 enter orbit
				if (distance.magnitude() < 10000) {
					ship.aiPlan = 1;
					ship.orbitTime = 30 + (Math.random()*180);
					ship.targetId = 9; // pluto maybe
					this.fuel = 10000;
				}
			}
		}

	}

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
			if (distance < (desiredOrbitDistance * 0.8)) {
				orbitSpeed = orbitSpeed * 1.25;
			} else if (distance > (desiredOrbitDistance * 1.2)) {
				orbitSpeed = orbitSpeed * 0.75;
			}

			// create a vector that matches that speed, perpendicular (anti-clockwise) from gravity source
			let orbitV = new Victor(0, orbitSpeed);
			orbitV = orbitV.rotate(0 - gDistance.verticalAngle()); // rotate to face grav source
			orbitV = orbitV.rotateDeg(90);

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

	// desired vector is directly towards target at magnitude=travelSpeed
	// turn to face orbital path and fire only when within 30deg of target
	leaveOrbit(ship, travelSpeed, game) {

		if (ship.gravityData && ship.gravityData.direction) {

			// our data
			let ourPos = Victor.fromArray(ship.physicsObj.position);
			let ourVelocity = new Victor(ship.physicsObj.velocity[0], ship.physicsObj.velocity[1]);

			// remove grav sources velocity
			let gravVelocity = new Victor(ship.gravityData.velocity[0], ship.gravityData.velocity[1]);
			let ourRelativeVelocity = ourVelocity.clone().subtract(gravVelocity);

			// target/destination
			let target = game.world.queryObject({ id: parseInt(ship.targetId) });
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

			if (Math.abs(angleFromTarget) < 0.2 && Math.abs(bearingChange) < 0.2) {
				ship.engine = 5;
			} else {
				ship.engine = 0;
			}

		} else {
			// no gravity to start to travel
			ship.aiPlan = 3;
		}

	}


	// work out desired vector towards target, adjust for current velocity
	travel(ship, travelSpeed, game) {

		let maxSpeed = travelSpeed;

		if (ship.targetId > -1) {

			// our data
			let ourPos = Victor.fromArray(ship.physicsObj.position);
			let ourVelocity = new Victor(ship.physicsObj.velocity[0], ship.physicsObj.velocity[1]);

			// target/destination
			let target = game.world.queryObject({ id: parseInt(ship.targetId) });
			let targetPos = Victor.fromArray(target.physicsObj.position);
			let targetVelocity = new Victor(target.physicsObj.velocity[0], target.physicsObj.velocity[1]);
			let targetV = targetPos.clone().subtract(ourPos);

			// check distance to target and slow down when approaching
			let distance = ourPos.clone().subtract(targetPos).magnitude();

			// if we're in the gavity well or approaching set a speed limit
			if ((ship.gravityData && ship.gravityData.id == ship.targetId) || (distance < travelSpeed * 15)) {
				maxSpeed = Math.min(travelSpeed, 300);
			} else if (distance < travelSpeed * 30) {
				maxSpeed = Math.min(travelSpeed, 600);
			} else if (distance < travelSpeed * 60) {
				maxSpeed = Math.min(travelSpeed, 1200);
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

	execute(ship, game) {

		const favOrbitDistance = 3000;
		const favTravelSpeed = 2000;

		// process depending on our plan
		if (ship.aiPlan == 2) {

			this.leaveOrbit(ship, favTravelSpeed, game);

		} else if (ship.aiPlan == 3) {

			this.travel(ship, favTravelSpeed, game);

		} else { // plan 1 (or unknown)
			// default plan is to stabilise orbit
			this.stabiliseOrbit(ship, favOrbitDistance, game);
		}

	}

};
