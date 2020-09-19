import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';
import BaseShip from './BaseShip';

const TRAVELLER_PLAN_ORBIT = 1;
const TRAVELLER_PLAN_LEAVE = 2;
const TRAVELLER_PLAN_TRAVEL = 3;

// leaves orbit, travels then enter orbit at destination
export default class Orbiter extends BaseShip {

	constructor() {
		super();
	}

	execute(ship, game) {
		super.execute(ship, game);
		let favOrbitDistance = 4000;
		if (ship.gravityData) {
			const direction = Victor.fromObject(ship.gravityData.direction);
			favOrbitDistance = direction.length();
		}		
		this.stabiliseOrbit(ship, favOrbitDistance, game);
	}

};
