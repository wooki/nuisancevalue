import Ship from '../common/Ship';
import Planet from '../common/Planet';
import Hulls from '../common/Hulls';
import Victor from 'victor';
import Damage from '../common/Damage';

export default class CollisionUtils {

    constructor(serverEngine, gameEngine) {
      this.serverEngine = serverEngine;
      this.gameEngine = gameEngine;
      this.damage = new Damage();
    }

    // identify the two objects which collided
    getObjects(e) {
      let A, B;
      this.gameEngine.world.forEachObject((id, obj) => {
        if (obj.physicsObj === e.bodyA) { A = obj; }
        if (obj.physicsObj === e.bodyB) { B = obj; }
      });

      return [A, B];
    } // getObjects

    assignDamageToObject(A, acceleration, e) {
      // 1 major damage for every 300, 1 minor damage for every 40 (left over)
      const severeDamageThreshold = 200;
      const lightDamageThreshold = 40;

      // only ships take damage at the moment
      if (A instanceof Ship) {

        // could do damage based on actual contact location - but not yet!!
        // console.log("Contact Eq contactPointA:");
        // console.dir(e.contactEquations[0].contactPointA);
        // console.log("Contact Eq penetrationVec:");
        // console.dir(e.contactEquations[0].penetrationVec);
        // console.log("Contact Eq contactPointB:");
        // console.dir(e.contactEquations[0].contactPointB);
        // console.log("Contact Eq normalA:");
        // console.dir(e.contactEquations[0].normalA);

        const hullData = Hulls[A.hull];
        const severe = Math.floor(acceleration / severeDamageThreshold);
        const light = Math.floor((acceleration % severeDamageThreshold) / lightDamageThreshold);
        if (light > 0 || severe > 0) {
          const d = this.damage.getRandomDamage(light, severe, hullData.damage);
          // console.log("d="+d+", accn="+acceleration);
          A.damage = A.damage | d
        }
        // every major & minor damage adds to a % chance of destruction
        const destructionChance = ((severe * 0.05) + (light * 0.01));
        if (Math.random() < destructionChance) {
          A.damage = A.damage | this.damage.DESTROYED;
        }
      }
    }

    assignDamage(e) {

      // identify the two objects which collided
      let [A, B] = this.getObjects(e);
      if (!A || !B) return;

      // anything hitting a planet (except another planet is destroyed instantly)
      if (A instanceof Planet && !(B instanceof Planet)) {

        B.damage = B.damage | this.damage.DESTROYED;

      // anything hitting a planet (except another planet is destroyed instantly)
      } else if (B instanceof Planet) {

        A.damage = A.damage | this.damage.DESTROYED;

      } else { // anything else

        // damage done is dependent on the change in velocity
        const acceleration_a = Victor.fromArray(e.bodyA.vlambda).magnitude();
        const acceleration_b = Victor.fromArray(e.bodyB.vlambda).magnitude();
        this.assignDamageToObject(A, acceleration_a);
        this.assignDamageToObject(B, acceleration_b);
      }
    } // assignDamage

}
