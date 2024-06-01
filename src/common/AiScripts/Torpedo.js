import Victor from 'victor';
import Utils from '../Utils/Utils.js';

export default class TorpedoAi {

	execute(torpedo, game) {

		// find the target
		let target = game.world.objects[torpedo.targetId];
	    if (target) {

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

			// direction to target
			let direction = theirPos.clone().subtract(ourPos);
			direction = new Victor(0 - direction.x, direction.y);

			// max speed depends on torp type
			let torpTopSpeed = torpedo.maxClosing;

			// calculate our ideal velocity
			let idealV = new Victor(0, torpTopSpeed);
			idealV = idealV.rotate(direction.verticalAngle()); // rotate to face grav source

			// add on the target actual velocity as well
			idealV = theirVelocity.clone().add(idealV);

			// calculate adjustment towards ideal
			let correctionV = idealV.clone().subtract(ourVelocity);
			
			// if our bearing does not match then rotate
			let correctionAngle = 0 - correctionV.verticalAngle() % (Math.PI*2);
			let ourBearing = torpedo.physicsObj.angle % (Math.PI*2);

			let bearingChange = correctionAngle - ourBearing;			

			if (bearingChange < -Math.PI) bearingChange = bearingChange + (Math.PI*2)
			if (bearingChange > Math.PI) bearingChange = bearingChange - (Math.PI*2)

			torpedo.applyManeuver(Utils.radiansToDegrees(correctionAngle));
			
			// if our bearing is close to desired then fire engine
			if (Math.abs(bearingChange) <= 0.1) {			
				torpedo.engine = 1;
			} else {
				torpedo.engine = 0;
			}

		} else {
			// no target - self destruct
			game.removeObjectFromWorld(torpedo);
	    game.emitonoff.emit('explosion', torpedo);
		}
	}

};
