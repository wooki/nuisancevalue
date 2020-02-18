export default class Help {

	constructor(c, navCom) {
		this.command = c;
		this.navCom = navCom;
	}

	execute(log, aliases, settings, nav, game) {
		let cmd = null;
        if (this.command.parameters && this.command.parameters.command) {
            cmd = this.command.parameters.command;
        }
        let help = this.navCom.help(cmd);
        log.innerHTML = log.innerHTML + help;
	}
}