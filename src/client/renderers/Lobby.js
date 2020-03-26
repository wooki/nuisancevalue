import Ship from './../../common/Ship';

let el = null;
let shipEls = {};
let game = null;
let client = null;

export default class LobbyRenderer {

    constructor(gameEngine, clientEngine) {
    	game = gameEngine;
    	client = clientEngine;

    	let root = document.getElementById('game');
    	root.innerHTML = '';
    	el = document.createElement('div');

    	root.append(el);
    }

    joinShip(shipId, station) {
    	// send to server - the users choice!
    	client.joinShip(shipId, station);
    }

    // just draw rooms (ships) to join
    draw(t, dt) {

    	let shipsList = '';
    	let ships = game.world.forEachObject((objId, obj) => {
    		if (obj instanceof Ship && obj.playable === 1) {
	    		if (!shipEls[objId]) {
	    			shipEls[objId] = document.createElement('div');
	    			let shipName = document.createElement('div');
	    			let shipDesc = document.createElement('div');
	    			shipName.innerHTML = obj.name;
	    			shipDesc.innerHTML = obj.hull + " class";
	    			shipEls[objId].classList.add('ship');
	    			shipName.classList.add('name');
	    			shipDesc.classList.add('description');
	    			shipEls[objId].append(shipName);
	    			shipEls[objId].append(shipDesc);
	    			el.append(shipEls[objId]);
	    		}

	    		if (obj.helmPlayerId == 0 && !shipEls[objId+'-helm']) {
	    			shipEls[objId+'-helm'] = document.createElement('div');
	    			shipEls[objId+'-helm'].addEventListener('click', (event) => { this.joinShip(objId, 'helm') } );
	    			shipEls[objId+'-helm'].innerHTML = "Join as helm";
	    			shipEls[objId+'-helm'].classList.add('join');
	    			shipEls[objId].append(shipEls[objId+'-helm']);
	    		} else if (obj.helmPlayerId != 0 && shipEls[objId+'-helm']) {
	    			shipEls[objId+'-helm'].remove();
	    			shipEls[objId+'-helm'] = null;
	    		}

    			if (obj.navPlayerId == 0 && !shipEls[objId+'-nav']) {
		    		shipEls[objId+'-nav'] = document.createElement('div');
	    			shipEls[objId+'-nav'].addEventListener('click', (event) => { this.joinShip(objId, 'nav') } );
	    			shipEls[objId+'-nav'].innerHTML = "Join as navigator";
	    			shipEls[objId+'-nav'].classList.add('join');
	    			shipEls[objId].append(shipEls[objId+'-nav']);
	    		} else if (obj.navPlayerId != 0 && shipEls[objId+'-nav']) {
	    			shipEls[objId+'-nav'].remove();
	    			shipEls[objId+'-nav'] = null;
	    		}

	    		if (obj.signalsPlayerId == 0 && !shipEls[objId+'-signals']) {
		    		shipEls[objId+'-signals'] = document.createElement('div');
	    			shipEls[objId+'-signals'].addEventListener('click', (event) => { this.joinShip(objId, 'signals') } );
	    			shipEls[objId+'-signals'].innerHTML = "Join as signals";
	    			shipEls[objId+'-signals'].classList.add('join');
	    			shipEls[objId].append(shipEls[objId+'-signals']);
	    		} else if (obj.signalsPlayerId != 0 && shipEls[objId+'-signals']) {
	    			shipEls[objId+'-signals'].remove();
	    			shipEls[objId+'-signals'] = null;
	    		}

	    	}
    	});
    }

}