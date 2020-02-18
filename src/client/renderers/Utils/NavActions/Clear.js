export default class Clear {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {
		log.innerHTML = '';
	}
}