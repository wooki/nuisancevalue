
const parameterTypes = {
	'string': "",
	'number': ""
}
const commands = [
	{
		name: 'orbit',
		parameters: [
			{ name: "alias", type: "string" },
			{ name: "range", type: "number" }
		],
		description: "test"
	},
	{
		name: 'help',
		parameters: [
			{ name: "command", type: "string", optional: true }
		],
		description: "get general help, or help on a specific command"
	}
];

export default class NavCom {

    // parse a line of text and return formatted command or error
    parse(line) {

    	let words = line.split(/(\s+)/).filter((word) => {
    		return (word && word.trim().length > 0);
    	});

    	// look for a command
    	let command = command.find((command) => {
    		return (command.name == words[0]);
    	});

    	if (command) {

    		// look for parameters and check syntax

    		return {
    			command: command
    		};

    	} else {

    		return {
    			error: "Command not found"
    		}
    	}

    }

    // get help text for general use or for specific command - triggered by the parse but handled here
    help(command) {

    }

}