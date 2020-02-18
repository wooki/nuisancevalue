import Planet from '../../../../common/Planet';
import SolarObjects from '../../../../common/SolarObjects';
import Victor from 'victor';

export default class Orbit {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {
		let obj = null;
        if (!(aliases[this.command.parameters.alias] === null)) {
            obj = game.world.queryObject({id: parseInt(aliases[this.command.parameters.alias])})
        }

        nav.navComSavedData = this.command.parameters.alias;

        if (obj && obj instanceof Planet) {

            let us = game.world.queryObject({id: parseInt(aliases['self'])})
            let radius = obj.size + parseInt(this.command.parameters.distance);
            // log.innerHTML = log.innerHTML + "\nOrbit Radius: "+radius;
            if (us.gravityData && us.gravityData.direction) {
                let gravity = Victor.fromArray([us.gravityData.direction.x, us.gravityData.direction.y]);
                let orbitV = Math.sqrt((SolarObjects.constants.G * us.gravityData.mass) / gravity.length() + 1);
                log.innerHTML = log.innerHTML + "\nOrbit radius "+Math.round(radius)+" at "+Math.round(orbitV) + SolarObjects.units.speed;
            }

        } else {
            log.innerHTML = log.innerHTML + "\nInvalid target";
        }

	}
}