import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';
import BaseShip from './BaseShip';

const TRAVELLER_PLAN_ORBIT = 1;
const TRAVELLER_PLAN_LEAVE = 2;
const TRAVELLER_PLAN_TRAVEL = 3;

// leaves orbit, travels then enter orbit at destination
export default class Traveller extends BaseShip {

	// check what phase we want to be in
	plan(ship, mission, game) {
		super.plan(ship, mission, game);

		// default to stabilise orbit
		if (!ship.aiPlan) {
			ship.aiPlan = TRAVELLER_PLAN_ORBIT;
			ship.orbitTime = 0 + (Math.random()*120);
		}

		// in stable orbit
		if (ship.aiPlan == TRAVELLER_PLAN_ORBIT) {
			ship.orbitTime = ship.orbitTime - TRAVELLER_PLAN_ORBIT;

			if (ship.orbitTime <= 0 && ship.targetId > -1) {
				ship.aiPlan = TRAVELLER_PLAN_LEAVE; // leave orbit once orbit for some time
			}
		}

		// leaving orbit
		if (ship.aiPlan == TRAVELLER_PLAN_LEAVE) {

			// start to travel once 10k away from surface of gravity source
			if (ship.targetId > -1) {

				let ourPos = Victor.fromArray(ship.physicsObj.position);
				if (ship.gravityData) {
					let gravVector = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);

					if (gravVector.magnitude() > 10000) {
						ship.aiPlan = TRAVELLER_PLAN_TRAVEL; // travel to destination
					}
				}
			}
		}

		// in travel
		if (ship.aiPlan == TRAVELLER_PLAN_TRAVEL) {

			// start to orbit once some distance away from target
			if (ship.targetId > -1) {

				let ourPos = Victor.fromArray(ship.physicsObj.position);
				let target = game.world.queryObject({ id: parseInt(ship.targetId) });
				if (target && target.physicsObj) {
					let targetPos = Victor.fromArray(target.physicsObj.position);
					let distance = ourPos.clone().subtract(targetPos);

					// allow faster ships to transition to orbit later
					let hullData = ship.getHullData();
					const enterOrbitDistance = 20000 - (500 * (hullData.thrust / hullData.mass));

					if (distance.magnitude() < (enterOrbitDistance + target.size)) {

						ship.aiPlan = TRAVELLER_PLAN_ORBIT; // enter orbit
						ship.orbitTime = 60 + (Math.random()*120); // count time to hang around

						// upon arrival see what mission thinks we should do (if there is one)
						if (mission && mission.event) {
							mission.event("AI.Traveller", {ship: ship} );
						}
					}
				}
			}
		}

	}


	execute(ship, game) {
		super.execute(ship, game);

		// travelSpeed depends on hull
		let hullData = ship.getHullData();

		const favOrbitDistance = 4000;
		const favTravelSpeed = 250 * (hullData.thrust / hullData.mass);

		// process depending on our plan
		if (ship.aiPlan == TRAVELLER_PLAN_LEAVE) {

			if (ship.gravityData && ship.gravityData.direction) {

				let target = game.world.queryObject({ id: parseInt(ship.targetId) });
				this.leaveOrbit(ship, target, favTravelSpeed, game);

			} else {
				// no gravity to start to travel
				ship.aiPlan = TRAVELLER_PLAN_TRAVEL;
			}


		} else if (ship.aiPlan == TRAVELLER_PLAN_TRAVEL) {

			if (ship.targetId > -1) {
				let target = game.world.queryObject({ id: parseInt(ship.targetId) });
				this.travel(ship, target, favTravelSpeed, game);
			}

		} else { // plan 1 (or unknown)
			// default plan is to stabilise orbit
			this.stabiliseOrbit(ship, favOrbitDistance, game);
		}

	}

};
