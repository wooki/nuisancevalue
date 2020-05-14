import Ship from './../../common/Ship';
import Hulls from './../../common/Hulls';
import morphdom from 'morphdom';

let el = null;
let shipsEl = null;
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

      let title = document.createElement('h1');
      title.innerHTML = 'Nuisance Value Lobby';
      el.append(title);

      let missions = ['Load Test Mission', 'Load Solar System'];
      let missionsEl = document.createElement('div');
      missionsEl.classList.add('missions');
      el.append(missionsEl);
      missions.forEach((mission, index) => {
        let missionEl = document.createElement('div');
        missionEl.addEventListener('click', (event) => { this.loadMission(index) } );
        missionEl.innerHTML = mission;
        missionEl.classList.add('load-mission');
        missionsEl.append(missionEl);
      });

      shipsEl = document.createElement('div');
      shipsEl.classList.add('ships');
      el.append(shipsEl);

    	root.append(el);
    }

    remove() {
      if (el) {
        el.remove();
        el = null;
      }
    }

    loadMission(id) {
      let result = confirm("Are you sure?");
      if (result) {
        client.loadMission(id);
      }
    }

    joinShip(shipId, station) {
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

      let hullData = Hulls[obj.hull];

      let shipImage = document.createElement('img');
      shipImage.classList.add('hull');
      shipImage.setAttribute('src', hullData.image);
      shipEl.append(shipImage);

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
        shipsEl.append(this.shipEls[obj.id]);
      } else {
        morphdom(this.shipEls[obj.id], this.drawShipUi(obj));
      }
    }

    // just draw rooms (ships) to join
    draw(t, dt) {

      let station = false;

    	let ships = game.world.forEachObject((objId, obj) => {

    		if (obj instanceof Ship) {
          if (obj.playable === 1) {
            this.addShip(obj);

            if (obj.helmPlayerId == game.playerId) {
                station = 'helm';
            } else if (obj.navPlayerId == game.playerId) {
                station = 'nav';
            } else if (obj.signalsPlayerId == game.playerId) {
                station = 'signals';
            }
          }

          if (obj.docked && obj.docked.length > 0) {
            obj.docked.forEach((dockedObj) => {
              if (dockedObj instanceof Ship && dockedObj.playable === 1) {
                this.addShip(dockedObj);

                if (dockedObj.helmPlayerId == game.playerId) {
                    station = 'helm';
                } else if (dockedObj.navPlayerId == game.playerId) {
                    station = 'nav';
                } else if (dockedObj.signalsPlayerId == game.playerId) {
                    station = 'signals';
                }
              }
            });
          }
	    	}
    	});

      return station; // stay here until ship chosen
    }

}
