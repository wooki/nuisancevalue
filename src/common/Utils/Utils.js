import Victor from 'victor';
import Hulls from '../Hulls';
import SolarObjects from '../SolarObjects';

// common functions used across both client and server
export default {

	generateAsteroidName(id, size, mass) {
		let prefix = (1850 + Math.round((size % 1) * 1000)).toString();
		let name = String.fromCharCode(97 + (id % 26));
		let suffix = (Math.round((mass % 1) * 1000).toString(16)).toString().split("").reverse().join("");
		return `${prefix}/${name}${suffix}`.toUpperCase();
	},

	radiansToDegrees(radians) {
      if (radians < 0) {
        return this.radiansToDegrees((radians + (Math.PI*2)));
      } else if (radians > (Math.PI*2)) {
        return this.radiansToDegrees((radians - (Math.PI*2)));
      } else {
        return (radians % (2 * Math.PI)) * (180 / Math.PI);
      }
  },

	checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
	    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
	    var denominator, a, b, numerator1, numerator2, result = {
	        x: null,
	        y: null,
	        onLine1: false,
	        onLine2: false
	    };
	    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
	    if (denominator == 0) {
	        return result;
	    }
	    a = line1StartY - line2StartY;
	    b = line1StartX - line2StartX;
	    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
	    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
	    a = numerator1 / denominator;
	    b = numerator2 / denominator;

	    // if we cast these lines infinitely in both directions, they intersect here:
	    result.x = line1StartX + (a * (line1EndX - line1StartX));
	    result.y = line1StartY + (a * (line1EndY - line1StartY));
	/*
	        // it is worth noting that this should be the same as:
	        x = line2StartX + (b * (line2EndX - line2StartX));
	        y = line2StartX + (b * (line2EndY - line2StartY));
	        */
	    // if line1 is a segment and line2 is infinite, they intersect if:
	    if (a > 0 && a < 1) {
	        result.onLine1 = true;
	    }
	    // if line2 is a segment and line1 is infinite, they intersect if:
	    if (b > 0 && b < 1) {
	        result.onLine2 = true;
	    }
	    // if line1 and line2 are segments, they intersect if both of the above are true
	    return result;
	},

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
		// 		velocity: gravSource.physicsObj.velocity,
		// size: gravSource.size,
		// id: gravSource.id,
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
		if (obj.getHullData) {
			hullData = obj.getHullData();
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

			// check if previous position is inside grav source - if so just write out same position
			if (predictions.length > 0 && obj.gravityData) {
				let gravityPosition = gravityPath[predictions.length - 1];

				let objectSizes = (obj.gravityData.size/2) + (obj.size/2);
				let distanceFromGravSource = Math.abs(gravityPosition.clone().subtract(predictions[predictions.length - 1]).magnitude()) - objectSizes;

				// console.log("distanceFromGravSource:"+distanceFromGravSource);

				if (distanceFromGravSource <= 0) {
					currentPos = gravityPosition;
					currentTime = s;
				} else {
					// apply current velocity - we're not hitting gravity
					currentPos = currentPos.add(v);
				}
			} else {
				// apply current velocity - no gravity source
				currentPos = currentPos.add(v);
			}

			// then add
			predictions.push(currentPos);
		}

		// return
		// console.timeEnd('predictPath');
		return predictions;
	}


}
