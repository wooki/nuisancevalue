import Ship from '../common/Ship';
import Torpedo from '../common/Torpedo';
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
          A.damage = A.damage | d
        }
        // every major & minor damage adds to a % chance of destruction
        const destructionChance = ((severe * 0.1) + (light * 0.02));
        const randomDestruction = Math.random();
        if (randomDestruction < destructionChance) {
          A.damage = A.damage | this.damage.DESTROYED;
        }
      }
    }

    assignDamage(e) {

      // this.removeObjectFromWorld(obj);
      // this.emitonoff.emit('explosion', obj);
      //
      // identify the two objects which collided
      let [A, B] = this.getObjects(e);
      if (!A || !B) return;

      // anything hitting a planet (except another planet is destroyed instantly)
      if (A instanceof Planet && !(B instanceof Planet)) {

        // if this keeps track of damage then destroy it
        if (B.damage || B.damage === 0) {
          console.log("damage");
          B.damage = B.damage | this.damage.DESTROYED;
        } else {
          console.log("destroy");
          // anything else hitting a planet is auto-destroyed
          this.gameEngine.removeObjectFromWorld(B);
          this.gameEngine.emitonoff.emit('explosion', B);
        }


      // anything hitting a planet (except another planet is destroyed instantly)
      } else if (B instanceof Planet) {

        // if this keeps track of damage then destroy it
        if (A.damage || A.damage === 0) {
          console.log("damage");
          A.damage = A.damage | this.damage.DESTROYED;
        } else {
          console.log("destroy");
          // anything else hitting a planet is auto-destroyed
          this.gameEngine.removeObjectFromWorld(A);
          this.gameEngine.emitonoff.emit('explosion', A);
        }

      } else if (A instanceof Torpedo || B instanceof Torpedo) {

        // Destroy any torps and apply different damage
        if (A instanceof Torpedo) {
          // destroy this torp
          this.gameEngine.removeObjectFromWorld(A);
          this.gameEngine.emitonoff.emit('explosion', A);
        } else if (!(B instanceof Torpedo)) {
          // apply torp damage
          this.assignDamageToObject(B, A.payload);
        }

        if (B instanceof Torpedo) {
          // destroy this torp
          this.gameEngine.removeObjectFromWorld(B);
          this.gameEngine.emitonoff.emit('explosion', B);
        } else if (!(A instanceof Torpedo)) {
          // apply torp damage
          this.assignDamageToObject(A, B.payload);
        }


      } else { // anything else

        // damage done is dependent on the change in velocity
        const acceleration_a = Victor.fromArray(e.bodyA.vlambda).magnitude();
        const acceleration_b = Victor.fromArray(e.bodyB.vlambda).magnitude();
        this.assignDamageToObject(A, acceleration_a);
        this.assignDamageToObject(B, acceleration_b);
      }
    } // assignDamage

}
