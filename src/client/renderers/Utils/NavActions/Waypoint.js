export default class Waypoint {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {
		let waypointX = 0;
        let waypointY = 0;

        if (this.command.parameters.target) {
            if (this.command.parameters['target-coords']) {
                // let coords = this.command.parameters.target.split(',');
                waypointX = parseInt(this.command.parameters['target-coords'][0]) || 0;
                waypointY = parseInt(this.command.parameters['target-coords'][1]) || 0;
            } else {
                if (aliases[this.command.parameters.target]) {
                    let obj = game.world.queryObject({id: parseInt(aliases[this.command.parameters.target])})
                    if (obj) {
                        waypointX = obj.physicsObj.position[0];
                        waypointY = obj.physicsObj.position[1];
                    }
                }
            }

            nav.navComSavedData = waypointX + "," + waypointY;

            nav.addWaypoint(this.command.parameters.name, waypointX, waypointY);
        } else {
            nav.removeWaypoint(this.command.parameters.name);
        }

	}
}