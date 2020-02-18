export default class Zoom {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {
		settings.zoom = parseInt(this.command.parameters.level);
        nav.setSizes();
        nav.createGrid()
        nav.updateGrid(settings.focus[0], settings.focus[1]);
	}
}