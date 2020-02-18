import Victor from 'victor';

export default class Predict {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {

		let obj = null;
        if (!(aliases[this.command.parameters.alias] === null)) {
            obj = game.world.queryObject({id: parseInt(aliases[this.command.parameters.alias])})
        }
        if (obj) {

            let time = parseInt(this.command.parameters.time);

            // get the velocity of the object
            let v = new Victor(obj.physicsObj.velocity[0], obj.physicsObj.velocity[1]);

            // apply gravity
            if (obj.gravityData) {

            	// this simply applies the same gravity over the time
            	// (aprox works - only accurate if we and grav source are stationary)
            	let gravV = obj.gravityData.vector.clone().divide(new Victor(obj.mass, obj.mass));
	            v = v.add(gravV);

	            // instead apply gravity in direction of source - assuming it is stationary - better but not perfect
            }

            // apply the vector for the time
            v = v.multiply(new Victor(time, time));

            // work out position based on vector
            let predictedPos = new Victor(obj.physicsObj.position[0], obj.physicsObj.position[1]);
            predictedPos = predictedPos.add(v);

            // remember our calculated position
            nav.navComSavedData = Math.round(predictedPos.x) + "," + Math.round(predictedPos.y);


            log.innerHTML = log.innerHTML + "\n" + Math.round(predictedPos.x) + "," + Math.round(predictedPos.y);

        } else {
            log.innerHTML = log.innerHTML + "\nInvalid target";
        }
	}
}