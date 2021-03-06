# Nuisance Value

multiplayer bridge-sim game using lance.gg, p2 and pixi.js

## Overview

## Stations

### Helm

![Image of Helm Screen](https://github.com/wooki/nuisancevalue/blob/master/docs/assets/helm.png)

### Signals

![Image of Signals Screen](https://github.com/wooki/nuisancevalue/blob/master/docs/assets/signals.png)

### Navigation

![Image of Navigation Screen](https://github.com/wooki/nuisancevalue/blob/master/docs/assets/navigation.png)

### Engineering

![Image of Engineering Screen](https://github.com/wooki/nuisancevalue/blob/master/docs/assets/engineer.png)

### Captain

![Image of Captain Screen](https://github.com/wooki/nuisancevalue/blob/master/docs/assets/captain.png)

## Installation

This is an example of how you can set up the client and server locally. This will allow you to develop as well as run the server and client.

### Prerequisites

Node v12 and either npm or yarn.

### Install

```bash
npm install
```

Or

```bash
yarn install
```

## Usage

The package.json file defines several scripts to develop, build and run the project.

To build

```
yarn run build
```

To run the server

```
yarn run start
```

The server listens on port 3000 by default and when a client connects there are several options that can be passed in the querystring.

- admin=1 allows that client to select a mission
- sound=local|global|on local sound effects are for the individual station the client is viewing, global sounds are for a main viewer. On allows for both.
- debug=1 allows the client to see objects outside of scan range

E.g.

```
http://localhost:3000?admin=1&sound=on
```

## Contributing

Discussion, ideas and even pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[CC-BY-NC-SA-4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
