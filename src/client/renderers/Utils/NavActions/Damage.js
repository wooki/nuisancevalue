import Hulls from '../../../../common/Hulls';
import Ship from '../../../../common/Ship';

export default class Damage {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {

    // damage the ship (for testing)
    let obj = null;
    if (!(aliases[this.command.parameters.alias] === null)) {
        obj = game.world.queryObject({id: parseInt(aliases[this.command.parameters.alias])})
    }
    if (obj) {

      if (obj instanceof Ship) {

				// calc percentage
				let maxDamage = obj.getMaxDamage();
				let d = obj.damage;
				let pecent = Math.floor((d/maxDamage) * 100);

				// display a damage report
        log.innerHTML = log.innerHTML + "\nHull Integrity: "+percent+"%";



      } else {
        log.innerHTML = log.innerHTML + "\nobject '" + this.command.parameters.alias + "' was not a valid alias (try 'damage report').";
      }


    } else {
        log.innerHTML = log.innerHTML + "\nobject '" + this.command.parameters.alias + "' not found (try 'damage report').";
    }

	}
}
