import Victor from 'victor';
import Hulls from '../Hulls';
import SolarObjects from '../SolarObjects';

// common functions used across both client and server
export default {

  // using the velocity and gravity effecting the object, predict a path
	// for the next s seconds
	predictPath(obj, s, predictionsPerSecond) {
		// console.time('predictPath');

		// ignore if we don't have a physicsObj
		if (!obj.physicsObj) {
			return [];
		}

		if (predictionsPerSecond === undefined) {
			predictionsPerSecond = 1;
		}
		let timeStep = (1 / predictionsPerSecond);
		let predictions = [new Victor(obj.physicsObj.position[0], obj.physicsObj.position[1])]; // start at the current position

		// data we may have in obj.gravityData
		//  {
		// 		source: gravSource.physicsObj.position,
		// 		direction: direction,
		// 		amount: gravSourceAmount,
		// 		vector: gravVector,
		// 		mass: gravSource.physicsObj.mass,
		// 		velocity: gravSource.physicsObj.velocity
		// }

		// if we have a gravity source, predict it's path first (this ignores gravity/engine acting on it)
		let gravityPath = null;
		if (obj.gravityData) {
			gravityPath = this.predictPath({
				physicsObj: {
					position: obj.gravityData.source,
					velocity: obj.gravityData.velocity,
					mass: obj.gravityData.mass
				}
			}, s, predictionsPerSecond);
		}

		// keep track of velocity, as that can change with gravity and engine
		let currentVelocity = new Victor(obj.physicsObj.velocity[0], obj.physicsObj.velocity[1]);

		let hullData = null;
		if (obj.hull) {
			hullData = Hulls[obj.hull];
		}

		// iterate timeStep for duration
		let currentTime = 0;
		while (currentTime < s) {

			// start 1 timeStep into the future
			currentTime = currentTime + timeStep;

			// start at the previous position
			let lastPrediction = predictions[predictions.length - 1]; // we always have at least one, so no need to check
			let currentPos = lastPrediction.clone();

			// apply engine to velocity (angularVelocity effects engine direction!)
			if (hullData && obj.engine && this.engine > 0) {

					// acceleration due to engine = F=m*a : a=F/m
					let engineVector = new Victor(0, (obj.engine * hullData.thrust) / obj.physicsObj.mass);

					// rotate to our facing
					engineVector = engineVector.rotate(obj.physicsObj.angle);

					// apply
					currentVelocity = currentVelocity.add(engineVector);
			}

			// apply gravity (from predicted gravity position) to velocity
			if (obj.gravityData) {
				let gravityPosition = gravityPath[predictions.length - 1];

				// work out gravity from our position to this position
				let d = currentPos.distance(gravityPosition);
				let g = (SolarObjects.constants.G * obj.physicsObj.mass * obj.gravityData.mass) / (d*d);
				let direction = gravityPosition.clone().subtract(currentPos);

				// acceleration due to gravity = F=m*a : a=F/m
				let accelerationVector = direction.clone().normalize().multiply(new Victor((g/obj.physicsObj.mass), (g/obj.physicsObj.mass)));

				// velocity = v=a*t (timeStep already adjusts at the end - so we're using 1s everywhere - can ignore)
				// accelerate towards the gravity source
				currentVelocity = currentVelocity.add(accelerationVector);
			}

			// multiply current velocity to adjust for our step time
			let v = currentVelocity.clone().multiply(new Victor(timeStep, timeStep));

			// apply current velocity
			currentPos = currentPos.add(v);

			// then add
			predictions.push(currentPos);
		}

		// return
		// console.timeEnd('predictPath');
		return predictions;
	}


}
