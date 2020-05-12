import Victor from 'victor';
import Utils from '../Utils/Utils';

export default class TorpedoAi {
	execute(torpedo, game) {

		// find the target
		let target = game.world.objects[torpedo.targetId];
	    if (target) {

			// direction to target
			let ourPos = Victor.fromArray(torpedo.physicsObj.position);
			let theirPos = Victor.fromArray(target.physicsObj.position);
			let theirV = new Victor(target.physicsObj.velocity[0], 0 - target.physicsObj.velocity[1]);
			let direction = theirPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);

			// calculate closing speed
			let ourVelocity = new Victor(torpedo.physicsObj.velocity[0], 0 - torpedo.physicsObj.velocity[1]);
			let closing = (ourVelocity.clone().subtract(theirV)).dot(direction) / direction.length();
			let distance = Math.abs(direction.magnitude());

			// time to target at closing speed
			let predictedPos = theirPos;
			let timeToTarget = Math.abs(Math.round(distance / closing));

			if (timeToTarget > 30) {
				timeToTarget = 30;
			}

			if (distance > 1000) {
				let predictedPath = Utils.predictPath(target, Math.floor(timeToTarget/2)); // 1/2 because accln
				predictedPos = predictedPath[predictedPath.length - 1];
			}

			// work out how we want torp to behave
			direction = predictedPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);
			let ourBearing = torpedo.physicsObj.angle % (Math.PI*2);
			let theirBearing = direction.verticalAngle() % (Math.PI*2);

			// console.log("distance="+distance+" ourBearing="+ourBearing+" direction="+direction.verticalAngle());
			let bearingDiff = (ourBearing - theirBearing);
			let bearingDiffDeg = (ourBearing - theirBearing) / (Math.PI/180);

			// console.log("ourBearing:"+ourBearing+' theirBearing='+theirBearing);
			// console.log("distance:"+distance+" bearingDiffDeg:"+bearingDiffDeg+' angVel='+torpedo.physicsObj.angularVelocity);
			// should we turn?
			// if (distance < 5000 && Math.abs(bearingDiffDeg) > 0.1) {
			if ((Math.abs(bearingDiffDeg) > 0.2 && closing >= 0) ||
			(Math.abs(bearingDiffDeg) > 5 && closing < 0)) { // only turn if 1 deg off

				// only apply turn if we're not already turning that way
				if (bearingDiffDeg < 0) {
					let turn = 'r';

					// if our current angularVelocity will mean we will arrive at our target
					// given constant deceleration then do that deceleration
					if (torpedo.physicsObj.angularVelocity > 0) {
						let secondsToArriveAtHeading = bearingDiff / torpedo.physicsObj.angularVelocity;
						if (torpedo.physicsObj.angularVelocity > (secondsToArriveAtHeading/2)) {
							turn = 'l'
						}
					}
					torpedo.applyManeuver(turn);


				} else if (bearingDiffDeg > 0) {
					let turn = 'l';

					// if our current angularVelocity will mean we will arrive at our target
					// given constant deceleration then do that deceleration
					if (torpedo.physicsObj.angularVelocity < 0) {
						let secondsToArriveAtHeading = bearingDiff / torpedo.physicsObj.angularVelocity;
						if (torpedo.physicsObj.angularVelocity > (secondsToArriveAtHeading/2)) {
							turn = 'r'
						}
					}
					torpedo.applyManeuver(turn);

				}
				torpedo.engine = 0;

			} else {
				// fire engine if closing speed less than 100, otherwise stop it
				// for now just apply a speed limit
				if (closing < 1000) {
					torpedo.engine = 1;
				} else {
					torpedo.engine = 0;
				}
			}


		} else {
			// no target - self destruct
			game.removeObjectFromWorld(torpedo);
	        game.emitonoff.emit('explosion', torpedo);
		}
	}

};
