import Victor from 'victor';
import Utils from '../Utils/Utils';
import SolarObjects from '../SolarObjects';
import BaseShip from './BaseShip';

const HUNTER_PLAN_ORBIT = 1;
const HUNTER_PLAN_LEAVE = 2;
const HUNTER_PLAN_TRAVEL = 3;

// when not in orbit around same gravity body as target moves to that orbit
// if target has no gravity then just move towards target
export default class Hunter extends BaseShip {

	constructor() {
		super();
	}

	// check with mission what to do
	reportNoTarget(ship, mission, game) {
		if (mission && mission.event) {
			mission.event("AI.Hunter.NoTarget", {ship: ship} );
		}
	}

	// check what phase we want to be in
	plan(ship, mission, game) {
		super.plan(ship, mission, game);

		// default to stabilise orbit
		if (!ship.aiPlan) {
			ship.aiPlan = HUNTER_PLAN_ORBIT;
		}

		// in stable orbit - if we have a target that has a gravity source other than ours
		// then leave orbit
		if (ship.aiPlan == HUNTER_PLAN_ORBIT) {

			if (ship.targetId > -1) {

				let target = game.world.objects[ship.targetId];
				if (!target) {
					// no target means stay in orbit
					this.reportNoTarget(ship, mission, game);

				} else if (!ship.gravityData) {
					// if we haven't got a gravity source just TRAVEL
					ship.aiPlan = HUNTER_PLAN_TRAVEL;
				} else {
					// otherwise LEAVE
					let nextPlan = HUNTER_PLAN_LEAVE;

					// check if we aren't going to crash into our current gravity source though!
					if (ship.gravityData) {
						let ourPos = Victor.fromArray(ship.physicsObj.position);
						let gravVector = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);
						let targetPos = Victor.fromArray(target.physicsObj.position);
						let targetVector = targetPos.clone().subtract(ourPos);
						if (Math.abs(gravVector.angleDeg() - targetVector.angleDeg()) < 30) {
							nextPlan = HUNTER_PLAN_ORBIT;
						}
					}

					ship.aiPlan = nextPlan;
				}
			} else {
				this.reportNoTarget(ship, mission, game);
			}
		}

		// leaving orbit
		if (ship.aiPlan == HUNTER_PLAN_LEAVE) {

			let ourPos = Victor.fromArray(ship.physicsObj.position);
			if (ship.gravityData) {

				let gravVector = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);
				if (gravVector.magnitude() > 10000) {

					ship.aiPlan = HUNTER_PLAN_TRAVEL; // travel to destination
				}
			}

		} // plan leave

		// in travel
		if (ship.aiPlan == HUNTER_PLAN_TRAVEL) {

			// start to orbit once some distance away from target
			if (ship.targetId > -1) {

				let target = game.world.objects[ship.targetId];
				if (target && target.gravityData) {
					target = game.world.objects[target.gravityData.id];
				}

				let ourPos = Victor.fromArray(ship.physicsObj.position);
				// let target = game.world.queryObject({ id: parseInt(ship.targetId) });
				if (target && target.physicsObj) {
					let targetPos = Victor.fromArray(target.physicsObj.position);
					let distance = ourPos.clone().subtract(targetPos);

					// check for collision with current gravity source and switch to enter orbit
					if (ship.gravityData) {
						let gravVector = Victor.fromArray([ship.gravityData.direction.x, ship.gravityData.direction.y]);
						let targetVector = targetPos.clone().subtract(ourPos);
						if (Math.abs(gravVector.angleDeg() - targetVector.angleDeg()) < 30) {
							nextPlan = HUNTER_PLAN_ORBIT;
						}
					}

					// allow faster ships to transition to orbit later
					let hullData = ship.getHullData();
					let enterOrbitDistance = (10 * target.size) - (300 * (hullData.thrust / hullData.mass));
					ship.aiOrbitRange = target.size * 2.0;
					if (enterOrbitDistance < ship.aiOrbitRange) {
						enterOrbitDistance = ship.aiOrbitRange;
					}

					if (distance.magnitude() < (enterOrbitDistance + target.size)) {
						ship.aiPlan = HUNTER_PLAN_ORBIT; // enter orbit
					}
				} else {
					this.reportNoTarget(ship, mission, game);
					ship.aiPlan = HUNTER_PLAN_ORBIT;
				}
			} else {
				this.reportNoTarget(ship, mission, game);
				ship.aiPlan = HUNTER_PLAN_ORBIT;
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
		if (ship.aiPlan == HUNTER_PLAN_LEAVE) {

			if (ship.gravityData && ship.gravityData.direction) {

				let target = game.world.objects[ship.targetId];
				if (target && target.gravityData) {
					target = game.world.objects[target.gravityData.id];
				}
				this.leaveOrbit(ship, target, favTravelSpeed, game);

			} else {
				// no gravity to start to travel
				ship.aiPlan = HUNTER_PLAN_TRAVEL;
			}


		} else if (ship.aiPlan == HUNTER_PLAN_TRAVEL) {

			if (ship.targetId > -1) {
				let target = game.world.objects[ship.targetId];
				if (target && target.gravityData) {
					target = game.world.objects[target.gravityData.id];
				}
				this.travel(ship, target, favTravelSpeed, game);
			}

		} else { // plan 1 (or unknown)
			// default plan is to stabilise orbit
			this.stabiliseOrbit(ship, favOrbitDistance, game);
		}

	}

};
