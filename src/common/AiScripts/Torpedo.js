const Victor = require('victor');

module.exports = function(torpedo, game) {

	// find the target
	let target = game.world.objects[torpedo.targetId];
    if (target) {

		// predict movement of target
		

		// direction to target
		let ourPos = Victor.fromArray(torpedo.physicsObj.position);
		let theirPos = Victor.fromArray(target.physicsObj.position);
		let direction = theirPos.clone().subtract(ourPos);
		direction = new Victor(0 - direction.x, direction.y);
		let distance = Math.abs(direction.magnitude());
		let ourBearing = torpedo.physicsObj.angle % (Math.PI*2);
		let theirBearing = direction.verticalAngle() % (Math.PI*2);

		// console.log("distance="+distance+" ourBearing="+ourBearing+" direction="+direction.verticalAngle());
		let bearingDiff = (ourBearing - theirBearing);
		let bearingDiffDeg = (ourBearing - theirBearing) / (Math.PI/180);


		// console.log("ourBearing:"+ourBearing+' theirBearing='+theirBearing);
		// console.log("distance:"+distance+" bearingDiffDeg:"+bearingDiffDeg+' angVel='+torpedo.physicsObj.angularVelocity);
		// should we turn?
		// if (distance < 5000 && Math.abs(bearingDiffDeg) > 0.1) {
		if (Math.abs(bearingDiffDeg) > 1) { // only turn if 1 deg off

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
			torpedo.engine = 1;
		}


	} else {
		// no target - self destruct
		game.removeObjectFromWorld(torpedo);
        game.emitonoff.emit('explosion', torpedo);
	}

};
