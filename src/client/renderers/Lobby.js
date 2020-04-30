import Ship from './../../common/Ship';
import morphdom from 'morphdom';

let el = null;
let game = null;
let client = null;

export default class LobbyRenderer {

    constructor(gameEngine, clientEngine) {
    	game = gameEngine;
    	client = clientEngine;

      this.shipEls = {};

    	let root = document.getElementById('game');
    	root.innerHTML = '';
    	el = document.createElement('div');
    	el.classList.add('lobby');

    	root.append(el);
    }

    joinShip(shipId, station) {
    	// send to server - the users choice!
    	client.joinShip(shipId, station);
    }

    drawShipUi(obj) {

      let shipEl = document.createElement('div');
      shipEl.classList.add('ship');
      let shipName = document.createElement('div');
      let shipDesc = document.createElement('div');
      shipName.innerHTML = obj.name;
      shipDesc.innerHTML = obj.hull + " class";
      shipName.classList.add('name');
      shipDesc.classList.add('description');
      shipEl.append(shipName);
      shipEl.append(shipDesc);

      if (obj.helmPlayerId == 0) {
        let helmEl = document.createElement('div');
        helmEl.addEventListener('click', (event) => { this.joinShip(obj.id, 'helm') } );
        helmEl.innerHTML = "Join as helm";
        helmEl.classList.add('join');
        shipEl.append(helmEl);
      }

      if (obj.navPlayerId == 0) {
        let navEl = document.createElement('div');
        navEl.addEventListener('click', (event) => { this.joinShip(obj.id, 'nav') } );
        navEl.innerHTML = "Join as navigator";
        navEl.classList.add('join');
        shipEl.append(navEl);
      }

      if (obj.signalsPlayerId == 0) {
        let signalsEl = document.createElement('div');
        signalsEl.addEventListener('click', (event) => { this.joinShip(obj.id, 'signals') } );
        signalsEl.innerHTML = "Join as signals";
        signalsEl.classList.add('join');
        shipEl.append(signalsEl);
      }

      return shipEl;
    }

    addShip(obj) {
      if (!this.shipEls[obj.id]) {
        this.shipEls[obj.id] = this.drawShipUi(obj);
        el.append(this.shipEls[obj.id]);
      } else {
        morphdom(this.shipEls[obj.id], this.drawShipUi(obj));
      }
    }

    // just draw rooms (ships) to join
    draw(t, dt) {

    	let ships = game.world.forEachObject((objId, obj) => {

    		if (obj instanceof Ship) {
          if (obj.playable === 1) {
            this.addShip(obj);
          }

          if (obj.docked && obj.docked.length > 0) {
            obj.docked.forEach((dockedObj) => {
              if (dockedObj instanceof Ship && dockedObj.playable === 1) {
                this.addShip(dockedObj);
              }
            });
          }
	    	}
    	});

      return false; // stay here until ship chosen
    }

}
