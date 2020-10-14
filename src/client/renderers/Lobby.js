import {h, createProjector} from 'maquette';

import Ship from './../../common/Ship';
import Hulls from './../../common/Hulls';

export default class LobbyRenderer {

    constructor(gameEngine, clientEngine) {
    	this.game = gameEngine;
    	this.client = clientEngine;

      this.root = document.getElementById('game');

      this.missions = ['Solar System', 'Exploration', 'Target Test'];
      this.playableShips = [];

      this.projector = createProjector();
      this.projector.append(this.root, this.render.bind(this));
    }

    remove() {
      this.projector.stop();
    }

    loadMission(id) {
      let result = confirm("Are you sure?");
      if (result) {
        this.client.loadMission(id);
      }
    }

    joinShip(shipId, station) {
    	this.client.joinShip(shipId, station);
    }

    render() {

      // check if we want admin controls
      let params = new URLSearchParams(document.location.search.substring(1));
      let isAdmin = (params.get("admin") == "1");

      let missions = [];
      let missionTitle = null;
      let missionSelect = null;
      let missionSeparator = null;

      if (isAdmin) {

        missionTitle = h('h2', ["Load Mission"]);

        for (let i = 0; i < this.missions.length; i++) {
          missions.push(
            h('button.mission', {
              key: 'mission-'+i,
              onclick: (event) => {
                this.loadMission(i);
              }
            },
              [this.missions[i]])
          );
        }

        missionSelect = h('div.nv.ui.row', {
          key: 'missions'
          },
          missions
        );

        missionSeparator = h('hr');
      }

      let ships = [];
      for (let j = 0; j < this.playableShips.length; j++) {
        ships.push(this.createShip(this.playableShips[j]));
      }

      if (ships.length > 0) {
        ships.unshift(h('h2', ["Select Station"]));
      }

      return h('div.nv.ui.col.lobby', {
        key: 'lobby',
        styles: {
        }
      },
      [
        h('h1', ["Nuisance Value Lobby"]),
        missionTitle,
        missionSelect,
        missionSeparator,
        h('div.nv.ui.col', {
          key: 'ships'
          },
          ships
        )
      ]);
    }

    createShip(obj) {

      let hullData = obj.getHullData();
      let columns = [];
      let text = [];
      let buttons = [];
      columns.push(h('img', {
        src: hullData.image,
        height: '100px',
        width: 'auto'
      }, []));

      if (obj.helmPlayerId == 0) {
        buttons.push(h('button.join', {
          key: 'helm',
          onclick: (event) => {
            this.joinShip(obj.id, 'helm');
          }
        }, ["Helm"]));
      }
      if (obj.navPlayerId == 0) {
        buttons.push(h('button.join', {
          key: 'nav',
          onclick: (event) => {
            this.joinShip(obj.id, 'nav');
          }
        }, ["Nav"]));
      }
      if (obj.signalsPlayerId == 0) {
        buttons.push(h('button.join', {
          key: 'signals',
          onclick: (event) => {
            this.joinShip(obj.id, 'signals');
          }
        }, ["Signals"]));
      }
      if (obj.engineerPlayerId == 0) {
        buttons.push(h('button.join', {
          key: 'engineer',
          onclick: (event) => {
            this.joinShip(obj.id, 'engineer');
          }
        }, ["Engineer"]));
      }
      if (obj.captainPlayerId == 0) {
        buttons.push(h('button.join', {
          key: 'captain',
          onclick: (event) => {
            this.joinShip(obj.id, 'captain');
          }
        }, ["Captain"]));
      }

      text.push(h('label', [obj.name + ", "+hullData.name+' Class']));
      text.push(h('div.nv.ui.row', buttons));

      columns.push(h('div.nv.ui.col.align-start', text));

      return h('div.nv.ui.row.ship', {
        key: 'ship-'+obj.id
        },
        columns
      );

    }

    // just draw rooms (ships) to join
    draw(t, dt) {

      let station = false;
      let ships = [];

      // look at all the ships, building UI and also looking for this player being
      // set into a stations
      for (let objId of Object.keys(this.game.world.objects)) {
        let obj = this.game.world.objects[objId];

    		if (obj instanceof Ship) {
          if (obj.playable === 1) {
            ships.push(obj);

            if (obj.helmPlayerId == this.game.playerId) {
                station = 'helm';
            } else if (obj.navPlayerId == this.game.playerId) {
                station = 'nav';
            } else if (obj.signalsPlayerId == this.game.playerId) {
                station = 'signals';
            } else if (obj.engineerPlayerId == this.game.playerId) {
                station = 'engineer';
            } else if (obj.captainPlayerId == this.game.playerId) {
                station = 'captain';
            }
          }

          if (obj.docked && obj.docked.length > 0) {
            obj.docked.forEach((dockedObj) => {
              if (dockedObj instanceof Ship && dockedObj.playable === 1) {
                ships.push(dockedObj);

                if (dockedObj.helmPlayerId == this.game.playerId) {
                    station = 'helm';
                } else if (dockedObj.navPlayerId == this.game.playerId) {
                    station = 'nav';
                } else if (dockedObj.signalsPlayerId == this.game.playerId) {
                    station = 'signals';
                } else if (dockedObj.engineerPlayerId == this.game.playerId) {
                    station = 'engineer';
                } else if (dockedObj.captainPlayerId == this.game.playerId) {
                    station = 'captain';
                }
              }
            });
          }
	    	}
      }  // done getting playable ships and checking for station

      // replace the playable ships and trigger a render
      this.playableShips = ships;
      this.projector.scheduleRender();

      return station; // stay here until ship chosen
    }

}
