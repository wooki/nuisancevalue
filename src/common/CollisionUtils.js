import Ship from '../common/Ship';
import Torpedo from '../common/Torpedo';
import Planet from '../common/Planet';
import Hulls from '../common/Hulls';
import Victor from 'victor';
// import Systems from '../common/Systems';

export default class CollisionUtils {

    constructor(gameEngine) {
      this.gameEngine = gameEngine;
      // this.damage = new Damage();
    }

    // identify the two objects which collided
    getObjects(e) {
      let A, B;
      let typeA, typeB;

      this.gameEngine.world.forEachObject((id, obj) => {
        if (!A && obj.physicsObj === e.bodyA) { A = obj; typeA = 'physicsObj'; }
        if (!B && obj.physicsObj === e.bodyB) { B = obj; typeB = 'physicsObj'; }
        if (!A && obj.physicsObjVisualScan === e.bodyA) { A = obj; typeA = 'VisualScan'; }
        if (!B && obj.physicsObjVisualScan === e.bodyB) { B = obj; typeB = 'VisualScan'; }
        if (!A && obj.physicsObjSensor === e.bodyA) { A = obj; typeA = 'Sensor'; }
        if (!B && obj.physicsObjSensor === e.bodyB) { B = obj; typeB = 'Sensor'; }
      });

      return [A, B, typeA, typeB];
    } // getObjects

    // this fires an event, so only the server adds randomised damage
    assignDamageToObject(A, acceleration, e) {

      // process on server only
      this.gameEngine.emit('damage', { ship: A, payload: acceleration, collision: e });
    }

    assignDamage(e) {

      // identify the two objects which collided
      let [A, B] = this.getObjects(e);
      if (!A || !B) return;

      // anything hitting a planet (except another planet is destroyed instantly)
      if (A instanceof Planet && !(B instanceof Planet)) {

        // if this keeps track of damage then destroy it
        if (B.damage || B.damage === 0) {
          this.assignDamageToObject(B, B.getMaxDamage(), e);
        } else {
          // anything else hitting a planet is auto-destroyed
          this.gameEngine.removeObjectFromWorld(B);
          this.gameEngine.emitonoff.emit('explosion', B);
        }


      // anything hitting a planet (except another planet is destroyed instantly)
      } else if (B instanceof Planet) {

        // if this keeps track of damage then destroy it
        if (A.damage || A.damage === 0) {
          this.assignDamageToObject(A, A.getMaxDamage(), e);
        } else {
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
        } else {
          // apply torp damage
          this.assignDamageToObject(A, B.payload, e);
        }

        if (B instanceof Torpedo) {
          // destroy this torp
          this.gameEngine.removeObjectFromWorld(B);
          this.gameEngine.emitonoff.emit('explosion', B);
        } else {
          // apply torp damage
          this.assignDamageToObject(B, A.payload, e);
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
