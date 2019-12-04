
let el = null;
let shipEls = {};
let game = null;

export default class NavRenderer {

    constructor(gameEngine, clientEngine) {
    	game = gameEngine;

    	let root = document.getElementById('game');
    	root.innerHTML = '';
    	el = document.createElement('div');

    	root.append(el);
    }



    // just draw rooms (ships) to join
    draw(t, dt) {

    	el.innerHTML = "Navigator";
    }

}