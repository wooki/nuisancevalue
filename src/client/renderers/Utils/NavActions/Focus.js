export default class Focus {

	constructor(c, navCom) {
        this.command = c;
        this.navCom = navCom;
    }

	execute(log, aliases, settings, nav, game) {

		let focusX = 0;
        let focusY = 0;
        if (this.command.parameters['centre-coords']) {
            // let coords = this.command.parameters.target.split(',');
            focusX = parseInt(this.command.parameters['centre-coords'][0]) || 0;
            focusY = parseInt(this.command.parameters['centre-coords'][1]) || 0;

        } else {
            if (aliases[this.command.parameters.centre]) {
                let obj = game.world.queryObject({id: parseInt(aliases[this.command.parameters.centre])})
                if (obj) {
                    focusX = obj.physicsObj.position[0];
                    focusY = obj.physicsObj.position[1];
                }
            }
        }
        nav.navComSavedData = Math.round(focusX) + "," + Math.round(focusY);

        settings.focus = [focusX, focusY];
        nav.updateGrid(settings.focus[0], settings.focus[1]);
	}
}