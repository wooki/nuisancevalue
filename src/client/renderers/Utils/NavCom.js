
const testString = /^[A-Za-z0-9]+$/;
const testNumber = /^[0-9]+$/;

const commands = [
	{
		name: 'orbit',
		parameters: [
			{ name: "alias", test: testString },
			{ name: "radius", test: testNumber }
		],
		description: "test"
	},
	{
		name: 'help',
		parameters: [
			{ name: "command", test: testString, optional: true }
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

        console.log("parse: ");
        console.dir(words);

    	// look for a command
    	let command = commands.find(function(c) {
            return (c.name == words[0]);
    	});

        console.dir(command);


    	if (command) {

            words.shift();

    		// look for parameters and check syntax
            let parameters = words;
            let values = {};
            let paramKeys = command.parameters.keys();
            for (const index of paramKeys) {

                if (words[index]) {
                    // check syntax
                    if (command.parameters[index].test.test(words[index])) {
                        values[command.parameters[index].name] = words[index];
                    } else {
                        console.log("invalid:"+index);
                        console.log("words:"+words[index]);
                        console.log("parameters:"+command.parameters[index].test);
                        return {
                            command: command,
                            error: 'invalid parameter "'+words[index]+'", expected '+command.parameters[index].name
                        };
                    }

                } else if (command.parameters[index].optional === true) {
                    // isn't sent but is optional - so that is ok
                    values[command.parameters[index].name] = null;

                } else {
                    // missing parameter
                    return {
                        command: command,
                        error: 'missing parameter '+command.parameters[index].name
                    };
                }
            }

    		return {
    			command: command.name,
                parameters: values
    		};

    	} else {

    		return {
    			error: "Command not found"
    		}
    	}

    }

    // get help text for general use or for specific command - triggered by the parse but handled here
    help(command, parameters) {

    }

}