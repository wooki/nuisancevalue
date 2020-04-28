import Zoom from './NavActions/Zoom';
import Clear from './NavActions/Clear';
import Help from './NavActions/Help';
import Focus from './NavActions/Focus';
import Waypoint from './NavActions/Waypoint';
import Orbit from './NavActions/Orbit';
import Predict from './NavActions/Predict';
import Info from './NavActions/Info';
import Damage from './NavActions/Damage';

const testString = /^[A-Za-z0-9]+$/;
const testNumber = /^-?[0-9]+$/;
const testZoom = /^[0-9]+$/;
const testCoord = /^[\-A-Za-z0-9,]+$/;

const commands = [
	{
			name: 'damage',
			parameters: [
				{ name: "alias", test: testString, help: "Use report for a summary of damage to the ship." },				
			],
			description: "Report on damage to ships systems.",
			action: Damage
	},
	{
			name: 'predict',
			parameters: [
					{ name: "alias", test: testString, help: "Object to predict position." },
					{ name: "time", test: testNumber, help: "Number of seconds in the future." }
			],
			description: "Calculates the future position of a body assuming forces do not change.",
			action: Predict
	},
	{
        name: 'orbit',
        parameters: [
            { name: "alias", test: testString, help: "Object to orbit around." },
            { name: "distance", test: testNumber, help: "Distance from surface to orbit." }
        ],
        description: "Calculate the speed required for a stable orbit.",
        action: Orbit
    },
    {
        name: 'info',
        parameters: [
            { name: "alias", test: testString, help: "Object to find out about (can use self)." }
        ],
        description: "Displays important information about a specific object.",
        action: Info
    },
    {
        name: 'waypoint',
        parameters: [
            { name: "name", test: testString, help: "Name for the waypoint" },
            { name: "target", test: testCoord, optional: true, help: "One of: an object; a coordinate in the form x,y (can use k for thousands); a direction and distance in the form distance@degrees e.g. 100k@30 (not implemented yet)." }
        ],
        description: "Set a waypoint on the map, if the target is ommitted it removes the waypoint.",
        action: Waypoint
    },
    {
        name: 'focus',
        parameters: [
            { name: "centre", test: testCoord, help: "Either an object (can use self), or a coordinate in the form x,y e.g. 0,0. You can use 'k' to indicate x1000 e.g. 100k,15k." }
        ],
        description: "Set the centre of the map.",
        action: Focus
    },
    {
        name: 'zoom',
        parameters: [
            { name: "level", test: testZoom, help: "One of the built-in zoom levels from 0-9 with 9 being most zoomed in." }
        ],
        description: "Set the zoom factor of the map.",
        action: Zoom
    },
    {
        name: 'clear',
        parameters: [],
        description: "Clear the console log.",
        action: Clear
    },
    {
		name: 'help',
		parameters: [
			{ name: "command", test: testString, optional: true, help: "Help about this comand." }
		],
		description: "Get a list of commands, or help on a specific command.",
        action: Help
	}
];

export default class NavCom {

    // parse a line of text and return formatted command or error
    parse(line, navComSavedData) {

    	let words = line.split(/(\s+)/).filter((word) => {
            return (word && word.trim().length > 0);
    	});

        // inject variables
        words = words.map((word) => {
					if (word == '.') { // special keyword to use stored data
							return navComSavedData;
					} else if (word.toLowerCase() == 'report') { // special keyword
							return 'me';
					} else {
                return word;
            }
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

                        // specialcase for coord type
                        if (command.parameters[index].test === testCoord) {

                            if (words[index].includes(',')) {
                                let coords = words[index].split(',');
                                coords = coords.map(function(c) {
                                    if (c.endsWith('k')) {
                                        return parseInt(c) * 1000;
                                    } else {
                                        return parseInt(c);
                                    }
                                });
                                values[command.parameters[index].name + '-coords'] = coords;
                                values[command.parameters[index].name] = coords[0] + ',' + coords[1];
                            } else {
                                values[command.parameters[index].name] = words[index];
                            }


                        } else {
                            values[command.parameters[index].name] = words[index];
                        }


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

    		let data = {
    			command: command.name,
                parameters: values
    		};

            return new command.action(data, this);

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
                h = h + "Command '"+(command ? command.name : '') + "' not found";
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
            h = h + "\n------\n";
            h = h + "Replace any parameter with a '.' to use the last returned data.";

        }

        return h;
    }

}
