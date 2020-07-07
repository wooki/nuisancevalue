import Victor from 'victor';
import Utils from '../Utils/Utils';

export default class TorpedoAi {
	
	execute(torpedo, game) {
		console.log("execute:"+torpedo.targetId);
		// find the target
		let target = game.world.objects[torpedo.targetId];
	    if (target) {

				console.log("target");
			// get our data
			let ourPos = Victor.fromArray(torpedo.physicsObj.position);
			let ourVelocity = new Victor(torpedo.physicsObj.velocity[0], torpedo.physicsObj.velocity[1]);

			// if we're stationary always fire the engine (helps prevent hitting our own ship
			// and kickstarts the calculations)
			if (ourVelocity.length() == 0) {
				torpedo.engine = 1;
				return;
			}

			// get their data
			let theirPos = Victor.fromArray(target.physicsObj.position);
			let theirVelocity = new Victor(target.physicsObj.velocity[0], target.physicsObj.velocity[1]);

			// get relative velocity
			// let relativeVelocity = theirVelocity.clone().subtract(ourVelocity);

			// direction to target
			let direction = theirPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);

			// estimate time to arrive - this isn't very accurarte but good enough
			const maxPredictionTime = 30;

			// try and reserve fuel by reducing speed as fuel depletes
			let torpTopSpeed = 10 * torpedo.fuel;

			let closing = ((ourVelocity.clone().subtract(theirVelocity)).dot(direction) / direction.length());
			// console.log("closing:"+closing);
			// let time = direction.length() / closing;
			// let time = direction.length() / (1000 + theirVelocity.length()); // assume half max speed plus their absolute speed
			let time = direction.length() / torpTopSpeed; // assume half max speed plus their absolute speed
			if (closing < 0) closing = 1;

			if (time < 0 || isNaN(time)) time = 1;
			if (time > maxPredictionTime) time = 1;

			// if (time > 10 && closing > 100) {
			// 	// for long distance try and predict
			// 	let predictedPath = Utils.predictPath(target, time);
			// 	theirPos = predictedPath[predictedPath.length - 1];
			//
			// } else if (time > 1) {
			// console.log("TIME-----------------------:>"+time);
			if (time > 0 && theirVelocity.magnitude() != 0) {

				// set the target position to their current position plus our relative velocity over the time
				let theirPredictedVelocity = theirVelocity.clone().multiply(new Victor(time, time));
				let theirPredictedPos = theirPos.clone().add(theirPredictedVelocity);

				let ourPredictedVelocity = ourVelocity.clone().multiply(new Victor(time, time));
				let ourPredictedPos = ourPos.clone().add(ourPredictedVelocity);

				// if our predicted position is PAST their predicted position (ie we are hitting or overshooting)
				if ((ourPredictedPos.x > theirPredictedPos.x && ourPos.x < theirPredictedPos.x) ||
					  (ourPredictedPos.x < theirPredictedPos.x && ourPos.x > theirPredictedPos.x) ||
				    (ourPredictedPos.y > theirPredictedPos.y && ourPos.y < theirPredictedPos.y) ||
						(ourPredictedPos.y < theirPredictedPos.y && ourPos.y > theirPredictedPos.y)) {

						// overshoot is fine - but we need to adjust our course to intercept
						let intersect = Utils.checkLineIntersection(theirPos.x, theirPos.y, theirPredictedPos.x, theirPredictedPos.y,
							ourPos.x, ourPos.y, ourPredictedPos.x, ourPredictedPos.y);
						ourPredictedPos = new Victor(intersect.x, intersect.y);
				}
				theirPos = theirPredictedPos;
				ourPos = ourPredictedPos;
			}

			// recalculate (but remember original)
			let currentDirection = direction.clone();
			direction = theirPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);

			// compare our velocity to the direction
			// let ourHeading = ourVelocity.verticalAngle() % (Math.PI*2);
			// let angleToTarget = direction.verticalAngle() % (Math.PI*2);

			// subtract our velocity from the direction to get the desired bearing
			// let desiredBearing = direction.clone().subtract(relativeVelocity).verticalAngle() % (Math.PI*2);
			let desiredBearing = direction.verticalAngle() % (Math.PI*2);
			// console.log("ourHeading:"+Utils.radiansToDegrees(ourHeading));
			// console.log("angleToTarget:"+Utils.radiansToDegrees(angleToTarget));

			// data to work out how we want torp to behave
			let ourBearing = torpedo.physicsObj.angle % (Math.PI*2);

			// let theirBearing = predictedDirection.verticalAngle() % (Math.PI*2);
			let bearingDiff = (ourBearing - desiredBearing);
			let bearingDiffDeg = ((ourBearing - desiredBearing) / (Math.PI/180)) % 360;
			// if (bearingDiffDeg > 180) bearingDiffDeg = 360 - bearingDiffDeg;

			// calculate the current bearing diff
			let currentBearingDiffDeg = ((ourBearing - currentDirection) / (Math.PI/180)) % 360;
			// if (currentBearingDiffDeg > 180) currentBearingDiffDeg = 360 - currentBearingDiffDeg;

			// turn if predicted positions are not aligned.
			if (Math.abs(bearingDiffDeg) > 0) {

				// apply enough turn to turn us to our desired bearing in 1/60th of a second
				// let bearingChange = -60 * bearingDiff;
				let bearingChange = -5 * bearingDiff;

				// are we turning the right way??
				// TOO FAST
				// why TURNING LEFT AND THEN RIGHT??

				// remove our current angular velocity
				bearingChange = bearingChange - torpedo.physicsObj.angularVelocity;
				torpedo.physicsObj.angularVelocity = torpedo.physicsObj.angularVelocity + (bearingChange);

				// continue to fire engine if angle not too great
				if (Math.abs(bearingDiffDeg) < 1) {
					if (closing < torpTopSpeed) {
						torpedo.engine = 0.66;
					}
				} else if (Math.abs(bearingDiffDeg) < 3) {
					if (closing < torpTopSpeed) {
						torpedo.engine = 0.33;
					}
				} else if (closing < 0 && Math.abs(currentBearingDiffDeg) < 90) {
					torpedo.engine = 1;
				} else {
					torpedo.engine = 0;
				}

			} else {
				// fire engine if closing speed less than 100, otherwise stop it
				torpedo.physicsObj.angularVelocity = 0;
				if (closing < torpTopSpeed || Math.abs(currentBearingDiffDeg) > 90) {
					torpedo.engine = 1;
				}
			}


		} else {
			// no target - self destruct
			game.removeObjectFromWorld(torpedo);
	    game.emitonoff.emit('explosion', torpedo);
		}
	}

};
