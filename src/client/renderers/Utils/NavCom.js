
const testString = /^[A-Za-z0-9]+$/;
const testNumber = /^-?[0-9]+$/;
const testZoom = /^[0-9]+$/;
const testFocus = /^[\-A-Za-z0-9,]+$/;

const commands = [
	{
        name: 'orbit',
        parameters: [
            { name: "alias", test: testString, help: "Object to orbit around." },
            { name: "distance", test: testNumber, help: "Distance from surface to orbit." }
        ],
        description: "Calculate the speed required for a stable orbit."
    },
    {
        name: 'info',
        parameters: [
            { name: "alias", test: testString, help: "Object to find out about (can use self)." }
        ],
        description: "Displays important information about a specific object."
    },
    {
        name: 'waypoint',
        parameters: [
            { name: "name", test: testString, help: "Name for the waypoint" },
            { name: "target", test: testFocus, optional: true, help: "One of: an object; a coordinate in the form x,y (can use k for thousands); a direction and distance in the form distance@degrees e.g. 100k@30." }
        ],
        description: "Set a waypoint on the map, if the target is ommitted it removes the waypoint."
    },
    {
        name: 'focus',
        parameters: [
            { name: "centre", test: testFocus, help: "Either an object (can use self), or a coordinate in the form x,y e.g. 0,0. You can use 'k' to indicate x1000 e.g. 100k,15k." }
        ],
        description: "Set the centre of the map."
    },
    {
        name: 'zoom',
        parameters: [
            { name: "level", test: testZoom, help: "One of the built-in zoom levels from 0-9 with 9 being most zoomed in." }
        ],
        description: "Set the zoom factor of the map."
    },
    {
        name: 'clear',
        parameters: [],
        description: "Clear the console log."
    },
    {
		name: 'help',
		parameters: [
			{ name: "command", test: testString, optional: true, help: "Help about this comand." }
		],
		description: "Get a list of commands, or help on a specific command."
	}
];

export default class NavCom {

    // parse a line of text and return formatted command or error
    parse(line) {

    	let words = line.split(/(\s+)/).filter((word) => {
    		return (word && word.trim().length > 0);
    	});

        // look for a command
    	let command = commands.find(function(c) {
            return (c.name == words[0]);
    	});

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
    help(helpCommand) {

        let h = "";

        if (helpCommand) {
            // help on specific command
            let command = commands.find(function(c) {
                return (c.name == helpCommand);
            });

            if (command) {
                h = h + command.description;

                if (command.parameters && command.parameters.length > 0) {

                    let parameterlist = command.parameters.map(function(p) {
                        return "&lt;"+p.name+"&gt;";
                    });
                    h = h + "\ne.g. " + command.name + ' ' + parameterlist.join(" ");

                    // add each parameter in detail
                    let parameterdetail = command.parameters.map(function(p) {
                        return p.name + ": " + p.help + (p.optional ? ' (optional)' : '');
                    });
                    h = h + "\n" + parameterdetail.join("\n");
                } else {
                    h = h + "\n(no parameters)";
                }

            } else {
                h = h + "Command '"+command.name + "' not found";
            }

        } else {
            // some info plus iterate possible commands
            h = h + "JupiCorp NavCom, version 3.2.57(1)-release (x86_128_compat)\n";
            h = h + "These commands are defined internally.  Type 'help' to see this list.\n";
            h = h + "Type 'help name' to find out more about the command 'name'.\n------\n";

            // get a list
            let delim = '';
            commands.forEach(function(c) {
                h = h + delim + c.name;
                delim = ', ';
            });
        }

        return h;
    }

}