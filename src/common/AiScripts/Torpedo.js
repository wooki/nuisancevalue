import Victor from 'victor';
import Utils from '../Utils/Utils';

export default class TorpedoAi {
	execute(torpedo, game) {

		// find the target
		let target = game.world.objects[torpedo.targetId];
	    if (target) {

			// get our data
			let ourPos = Victor.fromArray(torpedo.physicsObj.position);
			let ourVelocity = new Victor(torpedo.physicsObj.velocity[0], 0 - torpedo.physicsObj.velocity[1]);

			// get their data
			let theirPos = Victor.fromArray(target.physicsObj.position);
			let theirVelocity = new Victor(target.physicsObj.velocity[0], 0 - target.physicsObj.velocity[1]);

			// get relative velocity
			let relativeVelocity = theirVelocity.clone().subtract(ourVelocity);

			// direction to target
			let direction = theirPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);

			// estimate time to arrive - this isn't very accurarte but good enough
			const maxPredictionTime = 30;

			let closing = -1 * ((ourVelocity.clone().subtract(theirVelocity)).dot(direction) / direction.length());
			let time = direction.length() / closing;
			if (closing < 0) closing = 1;

			if (time < 0 || isNaN(time)) time = 1;
			if (time > maxPredictionTime) time = 1;

			// if (time > 10 && closing > 100) {
			// 	// for long distance try and predict
			// 	let predictedPath = Utils.predictPath(target, time);
			// 	theirPos = predictedPath[predictedPath.length - 1];
			//
			// } else if (time > 1) {
			if (time > 3) {
				// set the target position to their current position plus our relative velocity over the time
				let theirPredictedVelocity = theirVelocity.multiply(new Victor(time, time));
				theirPos = theirPos.add(theirPredictedVelocity);
			}

			// recalculate (but remember original)
			let currentDirection = direction.clone();
			direction = theirPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);

			// compare our velocity to the direction
			let ourHeading = ourVelocity.verticalAngle() % (Math.PI*2);
			let angleToTarget = direction.verticalAngle() % (Math.PI*2);

			// subtract our velocity from the direction to get the desired bearing
			let desiredBearing = direction.clone().subtract(relativeVelocity).verticalAngle() % (Math.PI*2);

			let distance = Math.abs(direction.magnitude());

			// data to work out how we want torp to behave
			let ourBearing = torpedo.physicsObj.angle % (Math.PI*2);
			// let theirBearing = predictedDirection.verticalAngle() % (Math.PI*2);
			let bearingDiff = (ourBearing - desiredBearing);
			let bearingDiffDeg = ((ourBearing - desiredBearing) / (Math.PI/180)) % 360;
			if (bearingDiffDeg > 180) bearingDiffDeg = 360 - bearingDiffDeg;

			// calculate the current beari--ng diff
			let currentBearingDiffDeg = ((ourBearing - currentDirection) / (Math.PI/180)) % 360;
			if (currentBearingDiffDeg > 180) currentBearingDiffDeg = 360 - currentBearingDiffDeg;

			// should we turn?
			if (Math.abs(bearingDiffDeg) > 0.01) {

				// apply enough turn to turn us to our desired bearing in 1/60th of a second
				let bearingChange = -60 * bearingDiff;

				// remove our current angular velocity
				bearingChange = bearingChange - torpedo.physicsObj.angularVelocity;
				torpedo.physicsObj.angularVelocity = torpedo.physicsObj.angularVelocity + (bearingChange);

				// continue to fire engine if angle not too great
				if (Math.abs(bearingDiffDeg) < 1) {
					if (closing < 1000 || Math.abs(currentBearingDiffDeg) > 30) torpedo.engine = 0.5;
				} else if (Math.abs(bearingDiffDeg) < 3) {
					if (closing < 1000 || Math.abs(currentBearingDiffDeg) > 30) torpedo.engine = 0.3;
				} else if (closing < 1000 || Math.abs(currentBearingDiffDeg) < 1) {
					torpedo.engine = 0.5;
				} else {
					torpedo.engine = 0;
				}

			} else {
				// fire engine if closing speed less than 100, otherwise stop it
				torpedo.physicsObj.angularVelocity = 0;
				if (closing < 1000 || Math.abs(currentBearingDiffDeg) > 30) torpedo.engine = 1;
			}


		} else {
			// no target - self destruct
			game.removeObjectFromWorld(torpedo);
	    game.emitonoff.emit('explosion', torpedo);
		}
	}

};
