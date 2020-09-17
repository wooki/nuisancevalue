import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';
import Ship from '../Ship';
import Torpedo from '../Torpedo';

// useful baseclass for ships - manages scanning, sensed objects and firing on
// enemies if armed..
// maybe more in the future - e.g. avoid torps
// maybe util methods such as orbit/dock etc
export default class BaseShip {

	// start checking for enemy ship in range and firing
	scanned(ship, target, mission, game) {
		// console.log("TODO: BaseShip scanned");

		if (!ship.aiTargets) ship.aiTargets = [];
		if (target instanceof Ship) {
			ship.aiTargets.push(target);
		}
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

		this.scanTargets(ship, mission, game);
		this.fireAtTargets(ship, mission, game);
	}

	fireAtTargets(ship, mission, game) {

		// update the AI torpedo reload - if present
		if (ship.aiTorpReload && ship.aiTorpReload > 0) {
			ship.aiTorpReload = ship.aiTorpReload - 1;
		}

		// check if any ships we have scanned are in weapons range and we're ready to fire
		if (ship.aiTargets) {
			for (let i = 0; i < ship.aiTargets.length; i++) {

				let target = ship.aiTargets[i];
				let hullData = ship.getHullData();

				// check if we can fire torps
				if (hullData.ai && hullData.ai.torpedo) {

					// are we not reloading
					if (!ship.aiTorpReload || ship.aiTorpReload <= 0) {

						// also check we haven't fired all of the volley
						if (!ship.aiTorpVolley || ship.aiTorpVolley < hullData.ai.torpedo.volley) {

							// check if enemy
							if (target.isHostile && target.isHostile(ship.faction)) {

								let range = Victor.fromArray(ship.physicsObj.position).distance(Victor.fromArray(target.physicsObj.position));
								if (range <= hullData.ai.torpedo.range) {

									// fire !
									if (!ship.aiTorpVolley) ship.aiTorpVolley = 0;
									let tube = ship.aiTorpVolley;
									ship.aiTorpVolley = ship.aiTorpVolley + 1;
									if (ship.aiTorpVolley >= hullData.ai.torpedo.volley) {
										// start reload (but actually set what is in the tubes now)
										ship.aiTorpReload = hullData.ai.torpedo.reload;
										ship.aiTorpVolley = 0;

										for (let t = 0; t < ship.tubes; t++) {
											ship.loadTorp(t, 1);
										}
									}

									// actually fire
									game.emit('firetorp', { ship: ship, targetId: target.id, tube: tube });

								} // not in range

							}	// not hostile
						} // volley fired
					} // not reloading
				} // no weapon ai

			} // every target
		} // has targets
	}

	scanTargets(ship, mission, game) {
		// check for aiScanTargets and dependent on hull ai data
		// give chance to scan
		if (ship.aiScanTargets) {
			let removeTargets = [];
			for (let i = 0; i < ship.aiScanTargets.length; i++) {

				if (ship.aiScanTargets[i] && ship.aiScanTargets[i].scannedBy) {

					let hullData = ship.getHullData();

					// has our faction already scanned?
					let scanned = ship.aiScanTargets[i].isScannedBy(ship.faction);

					// can we scan?
					if (!scanned && hullData.ai && hullData.ai.scan) {

						// only scan ourselves if not already scanned and within range
						let range = Victor.fromArray(ship.physicsObj.position).distance(Victor.fromArray(ship.aiScanTargets[i].physicsObj.position));
						if (hullData.ai && hullData.ai.scan && range <= hullData.scanRanges[1]) {
							let rnd = Math.random();
							scanned = (rnd < hullData.ai.scan);							
						} else {
							// out of range so stop looking for scan
							removeTargets.push(i);
						}
					}

					// if faction has already scanned, or our scanners scan - then scan
					// as if just scanned, so AI can then start to target or mission
					// can trigger other events etc.
					if (scanned) {
						ship.aiScanTargets[i].scannedBy(ship.faction);
						this.scanned(ship, ship.aiScanTargets[i], mission, game);
						removeTargets.push(i);
					}
				}
			}
			if (removeTargets.length > 0) {
				ship.aiScanTargets = ship.aiScanTargets.filter(function(t, i) {
					return !removeTargets.includes(i);
				});
			}
		}
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
