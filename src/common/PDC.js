import { PhysicalObject2D, BaseTypes } from 'lance-gg';
import Ship from './Ship';
import Torpedo from './Torpedo';
import Asteroid from './Asteroid';

let game = null;
let p2 = null;

export default class PDC extends PhysicalObject2D {

    static get netScheme() {
        return Object.assign({
            size: { type: BaseTypes.TYPES.INT32 }
        }, super.netScheme);
    }

    onAddToWorld(gameEngine) {
        game = gameEngine;
        p2 = gameEngine.physicsEngine.p2;

        // Add physics
        let shape = this.shape = new p2.Circle({
            radius: Math.floor(this.size / 2),
            collisionGroup: game.PDC,
            sensor: true,
            collisionMask: game.SHIP | game.ASTEROID | game.TORPEDO
        });
        this.physicsObj = new p2.Body({
            mass: this.mass,
            position: [this.position.x, this.position.y],
            velocity: [this.velocity.x, this.velocity.y],
            angle: this.angle, angularVelocity: this.angularVelocity,
            damping: 0, angularDamping: 0,
            collisionResponse: false });
        this.physicsObj.addShape(shape);
        gameEngine.physicsEngine.world.addBody(this.physicsObj);
    }

    onRemoveFromWorld(gameEngine) {
        game.physicsEngine.world.removeBody(this.physicsObj);
    }

    toString() {
        return `PDC::${super.toString()} size=${this.size}`;
    }

    // add object to our contact list
    addContact(obj) {
      if (!this.contacts) {
        this.contacts = {};
      }
      this.contacts[obj.id] = obj;
    }

    // remove object to our contact list
    removeContact(obj) {
      if (this.contacts && this.contacts[obj.id]) {
        delete this.contacts[obj.id];
      }
    }

    processContact() {

      if (this.contacts) {
        Object.keys(this.contacts).forEach(function(key) {

          let A = this.contacts[key];
          if (A) {
            // handle depending on type
            if (A instanceof Torpedo) {

              // destruction chance (high because only on-enter)
              if (Math.random() < 0.03) {
                console.log("*HIT TORP");
                try {
                  delete this.contacts[key];
                  game.removeObjectFromWorld(A);
                } catch (error) {
                }
              } else {
                console.log("- MISS TORP");
              }

            } else if (A instanceof Ship) {
              game.emit('damage', { ship: A, payload: Math.random()*50});

            } else if (A instanceof Asteroid) {
              console.log("damage asteroid (from pdc)");
            }
          }
        }.bind(this));
      }
    }

    syncTo(other) {
        super.syncTo(other);
        this.size = other.size;
    }
}
