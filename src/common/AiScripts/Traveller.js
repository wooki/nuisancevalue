import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';

// leaves orbit, travels then enter orbit at destination
export default class Traveller {

	// check what phase we want to be in
	plan(ship, game) {

		// stabilise orbit
		ship.aiPlan = 1;

		// leave orbit

		// travel to destination

		// enter orbit

		// stabilise orbit

	}

	// given our distance from current gravity source calculate circular orbit
	// as vector, work out vector that will get from our current vector to the
	// desired one and try to maneuver/engine to that vector
	stabiliseOrbit(ship, game) {

		// set some criteria for orbit distance
		const minOrbit = 3000;
		const maxOrbit = 5000;


		// get our current gravity source
		if (ship.gravityData && ship.gravityData.direction) {

			let ourPos = Victor.fromArray(ship.physicsObj.position);
			let ourVelocity = new Victor(ship.physicsObj.velocity[0], ship.physicsObj.velocity[1]);

			// what speed need we be at to be in circular orbit at current distance
			let gDistance = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);
			let distance = gDistance.length();
			let orbitSpeed = Math.sqrt((SolarObjects.constants.G * ship.gravityData.mass) / distance + 1);
			// if (distance < minOrbit) {
			// 	orbitSpeed = orbitSpeed * 1.5;
			// } else if (distance > maxOrbit) {
			// 	orbitSpeed = orbitSpeed * 0.9;
			// }

			// create a vector that matches that speed, perpendicular (anti-clockwise) from gravity source
			let orbitV = new Victor(0, orbitSpeed);
			orbitV = orbitV.rotate(0 - gDistance.verticalAngle()); // rotate to face grav source
			orbitV = orbitV.rotateByDeg(90);

			// add on the sources actual velocity as well
			let sourceV = Victor.fromArray(ship.gravityData.velocity);
			orbitV = sourceV.add(orbitV);

			let correctionV = orbitV.clone().subtract(ourVelocity);

			// console.log("mag:"+correctionV.magnitude());
			// if our bearing does not match then rotate
			let correctionAngle = 0 - correctionV.verticalAngle() % (Math.PI*2);
			let ourBearing = ship.physicsObj.angle % (Math.PI*2);
			let bearingChange = correctionAngle - ourBearing;

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
			if (Math.abs(bearingChange) < 0.1 && correctionV.magnitude() > 50) { // only bother when drifting away from desired
				ship.engine = 5;
			} else {
				ship.engine = 0;
			}

		} else {
			ship.engine = 0;
		}

	}

	leaveOrbit(ship, game) {
	}

	travel(ship, game) {
	}

	enterOrbit(ship, game) {
	}


	execute(ship, game) {

		// process depending on our plan
		if (ship.aiPlan == 2) {

			this.leaveeOrbit(ship, game);

		} else { // plan 1 (or unknown)
			// default plan is to stabilise orbit
			this.stabiliseOrbit(ship, game);
		}

	}

};
