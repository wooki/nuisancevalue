import {default as GameDamage} from '../../../../common/Damage';
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

				let gd = new GameDamage();
				let hullSystems = Hulls[obj.hull].damage;

				// read damage from ship
				let d = obj.damage;

				// display a damage report
        log.innerHTML = log.innerHTML + "\nDamage Report:";

				// check each system we could have
				for(let i = 0; i < gd.SEVERE_DAMAGE.length; i++) {
						if (hullSystems & gd.SEVERE_DAMAGE[i]) { // could have it
								let status = 'OK';
								if (d & gd.SEVERE_DAMAGE[i]) { // could have it
									status = 'FAIL';
									log.innerHTML = log.innerHTML + "\n"+gd.DAMAGE_NAMES[gd.SEVERE_DAMAGE[i]]+": "+status;
								}
						}
				}
				for(let i = 0; i < gd.LIGHT_DAMAGE.length; i++) {
					if (hullSystems & gd.LIGHT_DAMAGE[i]) { // could have it
							let status = 'OK';
							if (d & gd.LIGHT_DAMAGE[i]) { // could have it
								status = 'FAIL';
								log.innerHTML = log.innerHTML + "\n"+gd.DAMAGE_NAMES[gd.LIGHT_DAMAGE[i]]+": "+status;
							}
					}
				}



      } else {
        log.innerHTML = log.innerHTML + "\nobject '" + this.command.parameters.alias + "' was not a valid alias (try 'damage report').";
      }


    } else {
        log.innerHTML = log.innerHTML + "\nobject '" + this.command.parameters.alias + "' not found (try 'damage report').";
    }

	}
}
