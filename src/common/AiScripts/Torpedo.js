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
			// let timeToTarget = Math.abs(Math.round(distance / closing));
			// if (timeToTarget > 30) timeToTarget = 30;
			// if (timeToTarget < 0) timeToTarget = 0;

// 			if (timeToTarget >= 1) { // only predict when a small distance away
// 				let predictedPath = Utils.predictPath(target, Math.floor(timeToTarget/2));
// 				predictedPos = predictedPath[predictedPath.length - 1];

// // 				// reverse our relative velocity and add to target position
// // console.log("timeToTarget:"+timeToTarget);
// // console.log("ourVelocity:"+ourVelocity);
// // 				let v = ourVelocity.invert().normalize().multiply(new Victor(timeToTarget, timeToTarget));
// // console.log("v:"+v);
// // 				predictedPos = predictedPos.add(v);
// console.log("predicted:"+timeToTarget);
// 			}

			// work out how we want torp to behave
			direction = predictedPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);
			let ourBearing = torpedo.physicsObj.angle % (Math.PI*2);
			let theirBearing = direction.verticalAngle() % (Math.PI*2);

			// average desired vector with opposite of our current vector
// 			direction = direction.add(ourVelocity.invert()).divide(new Victor(2, 2));
// console.log("direction:"+direction)
// 			theirBearing = direction.verticalAngle() % (Math.PI*2);

			let bearingDiff = (ourBearing - theirBearing);
			let bearingDiffDeg = (ourBearing - theirBearing) / (Math.PI/180);

			// should we turn?
// console.log("bearingDiffDeg:"+bearingDiffDeg);
			if (Math.abs(bearingDiffDeg) > 0.01) {

				// only apply turn if we're not already turning that way
				if (bearingDiffDeg < 0) {
// console.log("R:"+torpedo.physicsObj.angularVelocity);
					let turn = 'r';

					// if our current angularVelocity will mean we will arrive at our target
					// given constant deceleration then do that deceleration
					if (torpedo.physicsObj.angularVelocity > 0) {
						let secondsToArriveAtHeading = bearingDiff / torpedo.physicsObj.angularVelocity;
// console.log("?:"+secondsToArriveAtHeading);
						if (Math.abs(torpedo.physicsObj.angularVelocity) > Math.abs(secondsToArriveAtHeading/2)) {
							turn = 'l'
						}
					}
// console.log("turn:"+turn);
					torpedo.applyManeuver(turn);


				} else if (bearingDiffDeg > 0) {
// console.log("L:"+torpedo.physicsObj.angularVelocity);
					let turn = 'l';

					// if our current angularVelocity will mean we will arrive at our target
					// given constant deceleration then do that deceleration
					if (torpedo.physicsObj.angularVelocity < 0) {
						let secondsToArriveAtHeading = bearingDiff / torpedo.physicsObj.angularVelocity;
// console.log("?:"+secondsToArriveAtHeading);
						if (Math.abs(torpedo.physicsObj.angularVelocity) > Math.abs(secondsToArriveAtHeading/2)) {
							turn = 'r'
						}
					}
// console.log("turn:"+turn);
					torpedo.applyManeuver(turn);

				}
				if (Math.abs(bearingDiffDeg) > 0.2) torpedo.engine = 0;

			} else {
				// fire engine if closing speed less than 100, otherwise stop it
				// for now just apply a speed limit
				// if (closing < 1000) {
					torpedo.engine = 1;
				// } else {
				// 	torpedo.engine = 0;
				// }
			}


		} else {
			// no target - self destruct
			game.removeObjectFromWorld(torpedo);
	        game.emitonoff.emit('explosion', torpedo);
		}
	}

};
