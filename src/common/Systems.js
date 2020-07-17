// possible states of each connector
const CONNECTOR_DAMAGED = 0;
const CONNECTOR_NS = 1; // NORTH-SOUTH
const CONNECTOR_SE = 2; // SOUTH-EAST
const CONNECTOR_SW = 3; // SOUTH-WEST
const CONNECTOR_EW = 4; // EAST-WEST
const CONNECTOR_NW = 5; // NORTH-WEST
const CONNECTOR_NE = 6; // NORT-EAST
const CONNECTOR_NSEW = 7; // NORTH-SOUTH and EAST-WEST

// grid of connectors
const COLS = 30;
const ROWS = 8;

// list of systems - can use mitmask to signal if they have power or not
const SYS_SENSORS = Math.pow(2, 1);
const SYS_ENGINE = Math.pow(2, 2);
const SYS_MANEUVER = Math.pow(2, 3);
const SYS_TORPS = Math.pow(2, 4);
const SYS_PDC = Math.pow(2, 5);
const SYS_LIFE = Math.pow(2, 6);
const SYS_CONSOLES = Math.pow(2, 7);
const SYS_NAV = Math.pow(2, 8);
const SYS_RELOAD = Math.pow(2, 9);

// systems take up space along row - which is where their connections start
const SYSTEMS = [
  SYS_SENSORS, SYS_SENSORS, SYS_SENSORS, SYS_SENSORS,
  SYS_ENGINE, SYS_ENGINE, SYS_ENGINE, SYS_ENGINE, SYS_ENGINE, SYS_ENGINE,
  SYS_MANEUVER, SYS_MANEUVER, SYS_MANEUVER, SYS_MANEUVER,
  SYS_TORPS, SYS_TORPS, SYS_TORPS,
  SYS_PDC, SYS_PDC, SYS_PDC,
  SYS_LIFE, SYS_LIFE, SYS_LIFE, SYS_LIFE,
  SYS_CONSOLES, SYS_CONSOLES,
  SYS_NAV, SYS_NAV,
  SYS_RELOAD, SYS_RELOAD
]; // 30 total - to match ROWS

// based on entry side and connector - get updated grid position
let CONNECTOR_WALK = {};
CONNECTOR_WALK['S'] = {};
CONNECTOR_WALK['S'][CONNECTOR_NS] = [-1, 0, 'S'];
CONNECTOR_WALK['S'][CONNECTOR_SE] = [0, 1, 'W'];
CONNECTOR_WALK['S'][CONNECTOR_SW] = [0, -1, 'E'];
CONNECTOR_WALK['S'][CONNECTOR_NSEW] = [-1, 0, 'S'];
CONNECTOR_WALK['N'] = {};
CONNECTOR_WALK['N'][CONNECTOR_NS] = [1, 0, 'N'];
CONNECTOR_WALK['N'][CONNECTOR_NE] = [0, 1, 'W'];
CONNECTOR_WALK['N'][CONNECTOR_NW] = [0, -1, 'E'];
CONNECTOR_WALK['N'][CONNECTOR_NSEW] = [1, 0, 'N'];
CONNECTOR_WALK['E'] = {};
CONNECTOR_WALK['E'][CONNECTOR_EW] = [0, -1, 'E'];
CONNECTOR_WALK['E'][CONNECTOR_NE] = [-1, 0, 'S'];
CONNECTOR_WALK['E'][CONNECTOR_SE] = [1, 0, 'N'];
CONNECTOR_WALK['E'][CONNECTOR_NSEW] = [0, -1, 'E'];
CONNECTOR_WALK['W'] = {};
CONNECTOR_WALK['W'][CONNECTOR_EW] = [0, 1, 'W'];
CONNECTOR_WALK['W'][CONNECTOR_NW] = [-1, 0, 'S'];
CONNECTOR_WALK['W'][CONNECTOR_SW] = [1, 0, 'N'];
CONNECTOR_WALK['W'][CONNECTOR_NSEW] = [0, 1, 'W'];

// ship systems and how the are connected to the reactor
// connectiosn represented by a list of int16s that are packed/unpacked with
// 3 bit numbers to reduce load.  each bit represents 1 cell on the grid and
// can be damaged or contain specific connections.  So from this grid we
// need to be able to tell when a system is connected to the reactor.
export default class Systems {

  constructor() {

    // grid of connectors in default state
    this.grid = [];
    for (let i = 0; i < ROWS; i++) {
      let row = [];
      for (let j = 0; j < COLS; j++) {
        row.push(CONNECTOR_NS); // default state of 1
      }
      this.grid.push(row);
    }
  }

  // data is an array going from top left across each row in turn. Each item
  // is an int16 that contains 5, 3 bit numbers to convert to the CONNECTOR
  unpack(data) {

    // iterate rows and cols pulling out data
    for (let i = 0; i < data.length; i++) {

      // extract the 5 numbers stored in this int16
      // note: could do this with bitmasks and subtractions but this is easier
      // for me to visualise
      let value = data[i];
      let valueBinary = value.toString(2).padStart(15, '0');
      let values = [parseInt(valueBinary.substr(valueBinary.length - 15, 3), 2),
                    parseInt(valueBinary.substr(valueBinary.length - 12, 3), 2),
                    parseInt(valueBinary.substr(valueBinary.length - 9, 3), 2),
                    parseInt(valueBinary.substr(valueBinary.length - 6, 3), 2),
                    parseInt(valueBinary.substr(valueBinary.length - 3, 3), 2)];

      // overwrite current values in grid
      for (let j = 0; j < 5; j++) {
        let row = Math.floor(((i*5)+j) / COLS);
        let col = ((i*5)+j) % COLS;
        this.grid[row][col] = values[j];
      }

    }
  }

  // packs state as array of int16 - each containing 5, 3 bit numbers
  // therefore 6 int16 represent one row of 30 connectors
  pack() {

    let data = [];
    for (let i = 0; i < (ROWS*COLS); i = i + 5) {

      // get 5 values
      let values = [];
      for (let j = 0; j < 5; j++) {
        let row = Math.floor((i+j) / COLS);
        let col = (i+j) % COLS;
        values[j] = this.grid[row][col];
      }

      // convert values to single int
      let value = values[0].toString(2).padStart(3, '0') +
                  values[1].toString(2).padStart(3, '0') +
                  values[2].toString(2).padStart(3, '0') +
                  values[3].toString(2).padStart(3, '0') +
                  values[4].toString(2).padStart(3, '0');
      value = parseInt(value, 2);
      data.push(value);
    }

    return data;
  }

  // follow the connection, given the entry (NSEW) returns zero if it ends
  // or 1 if it ultimately finds it's way to the top leaving north - at the
  // reactor.
  followConnection(position, entry) {

    // have we reached the reactor?
    if (position[0] < 0) {
      return 1;
    }

    if (position[0] > CONNECTOR_NSEW) {
      return 0; // feed back into a system
    }

    if (position[1] < 0 || position[1] > (COLS - 1)) {
      return 0; // off the edge
    }

    // get the connector at current position
    let connector = this.grid[position[0]][position[1]];

    // move to the next position
    if (CONNECTOR_WALK[entry] && CONNECTOR_WALK[entry][connector]) {

      let nextPosition = [
        position[0] + CONNECTOR_WALK[entry][connector][0],
        position[1] + CONNECTOR_WALK[entry][connector][1]
      ];
      return this.followConnection(nextPosition, CONNECTOR_WALK[entry][connector][2]);

    } else {
      // no path so return
      return 0;
    }
  }

  // count how many connections are made from the specified system to the
  // reactor (the reactor is the top of the grid)
  isPowered(system) {

    let connectedCount = 0;

    // check a connection route from each col in the bottom row corresponding
    // to the system
    for (let i = 0; i < COLS; i++) {

      // is this a start for the system?
      if (SYSTEMS[i] == system) {

        // start at bottom row
        let position = [ROWS - 1, i];
        let connector = this.grid[position[0]][position[1]];

        // must have connection SOUTH to be connected
        if ([CONNECTOR_NS, CONNECTOR_SE, CONNECTOR_SW, CONNECTOR_NSEW].includes(connector)) {

          // follow connection
          connectedCount = connectedCount + this.followConnection(position, 'S');
        }
      }
    }

    return connectedCount;
  }

  // update one of the connectors
  setConnector(row, col, newState) {
    if (newState >= CONNECTOR_DAMAGED && newState <= CONNECTOR_NSEW) {
      this.grid[row][col] = newState;
    } else {
      throw "Connector state not found: "+newState;
    }
  }

  getConnector(row, col) {
    return this.grid[row][col];
  }

  getStandardSystems() {
    return {
      SYS_SENSORS: SYS_SENSORS,
      SYS_ENGINE: SYS_ENGINE,
      SYS_MANEUVER: SYS_MANEUVER,
      SYS_TORPS: SYS_TORPS,
      SYS_PDC: SYS_PDC,
      SYS_LIFE: SYS_LIFE,
      SYS_CONSOLES: SYS_CONSOLES,
      SYS_NAV: SYS_NAV,
      SYS_RELOAD: SYS_RELOAD
    };
  }

  getSystemLayout() {
    return SYSTEMS;
  }

  getGridSize() {
    return [ROWS, COLS];
  }

  getSystemName(currentSystem) {
    switch (currentSystem) {
      case SYS_SENSORS:
        return "SENSORS";
      case SYS_ENGINE:
        return "ENGINE";
      case SYS_MANEUVER:
        return "MANEUVER";
      case SYS_TORPS:
        return "TORPEDOES";
      case SYS_PDC:
        return "PDC";
      case SYS_LIFE:
        return "LIFE\nSUPPORT";
      case SYS_CONSOLES:
        return "SCREENS";
      case SYS_NAV:
        return "NAV COM";
      case SYS_RELOAD:
        return "RELOADERS";
    }
  }

  // checks the system has required connections - some scale, some are binary
  getEfficiency(sys) {
    let currentPower = this.isPowered(sys);
    switch (sys) {
      case SYS_SENSORS:
        return (currentPower / 4);
      case SYS_ENGINE:
        let engPercent = (currentPower / 4);
        if (engPercent > 1) engPercent = 1;
        return engPercent;
      case SYS_MANEUVER:
        let manPercent = (currentPower / 2);
        if (manPercent > 1) manPercent = 1;
        return manPercent;
      case SYS_TORPS:
        return (currentPower > 0);
      case SYS_PDC:
        return (currentPower > 0);
      case SYS_LIFE:
        return (currentPower > 0);
      case SYS_CONSOLES:
        return (currentPower > 0);
      case SYS_NAV:
        return (currentPower > 0);
      case SYS_RELOAD:
        return (currentPower > 0);
    }
  }

}
