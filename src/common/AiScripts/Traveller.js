import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';
import BaseShip from './BaseShip';

const TRAVELLER_PLAN_ORBIT = 1;
const TRAVELLER_PLAN_LEAVE = 2;
const TRAVELLER_PLAN_TRAVEL = 3;

// leaves orbit, travels then enter orbit at destination
export default class Traveller extends BaseShip {

	constructor() {
		super();
	}

	// check what phase we want to be in
	plan(ship, mission, game) {
		super.plan(ship, mission, game);

		// default to stabilise orbit
		if (!ship.aiPlan) {
			ship.aiPlan = TRAVELLER_PLAN_ORBIT;
			ship.aiOrbitTime = 0 + (Math.random()*1);
		}

		// in stable orbit
		if (ship.aiPlan == TRAVELLER_PLAN_ORBIT) {
			ship.aiOrbitTime = ship.aiOrbitTime - 1;

			if (ship.aiOrbitTime <= 0 && ship.targetId > -1) {
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

					if (gravVector.magnitude() > (4000 + (ship.gravityData.size * 4))) {
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
					let enterOrbitDistance = (12 * target.size) - (300 * (hullData.thrust / hullData.mass));
					ship.aiOrbitRange = target.size * 2.0;
					if (enterOrbitDistance < ship.aiOrbitRange) {
						enterOrbitDistance = ship.aiOrbitRange;
					}

					// this check for the ids matching allows wide area orbiting of say the sun, where
					// the enterOrbitDistance is bigger than some planet orbits
					let currentGravityId = ship?.gravityData?.id;
					if ((!currentGravityId || currentGravityId == target.id) &&
							distance.magnitude() < (enterOrbitDistance + target.size)) {

						ship.aiPlan = TRAVELLER_PLAN_ORBIT; // enter orbit
						ship.aiOrbitTime = 60 + (Math.random()*120); // count time to hang around

						// upon arrival see what mission thinks we should do (if there is one)
						if (mission && mission.event) {
							mission.event("AI.Traveller.Arrived", {ship: ship} );
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

		const favOrbitDistance = 4000 || ship.aiOrbitRange;
		const favTravelSpeed = 3000 * (hullData.thrust / hullData.mass);

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
