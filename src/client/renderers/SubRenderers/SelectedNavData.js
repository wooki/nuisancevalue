import Victor from 'victor';
import Assets from '../Utils/images.js';
import {h, createProjector} from 'maquette';
import Torpedo from '../../../common/Torpedo';
import Ship from '../../../common/Ship';
import Asteroid from '../../../common/Asteroid';
import Planet from '../../../common/Planet';
import Hulls from '../../../common/Hulls';
import Factions from '../../../common/Factions';
import SolarObjects from '../../../common/SolarObjects';

// Info panels for the data drawn on LocalMapHud
export default class SelectedNavData {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 200,
      height: 600,
      zIndex: 1,
      baseUrl: '/'
    }, params);

    this.factions = new Factions();

    this.targettingId = null;
    this.targettingTotalTime = 1000 * 10; // load takes 10 seconds
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;

    // draw
    this.selected = null;
    this.selectedObject = null;
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // watch shared state for current selection setting
  updateSharedState(state, renderer) {

    if (state.selection) {
      if (this.selected != state.selection.id) {
        this.selectedObject = null;
      }
      this.selected = state.selection.id;
  	} else {
      this.selected = null;
      this.selectedObject = null;
    }

    this.projector.scheduleRender();
  }

  getCurrentWaypoint(objId) {

    if (this.playerShip && this.playerShip.waypoints) {
      for (let i = 0; i < this.playerShip.waypoints.length; i++) {
        if (this.playerShip.waypoints[i].objId == objId) {
          return this.playerShip.waypoints[i];
        }
      }
    }

    return false;
  }

  addWaypoint(objId, orbit) {
    this.renderer.client.addWaypoint(objId, orbit);
  }

  removeWaypoint(objId) {
    this.renderer.client.removeWaypoint(objId);
  }

  // toggle between a waypoint on the object and no waypoint
  toggleInterceptWaypoint(obj) {

    let currentWaypoint = this.getCurrentWaypoint(obj.id);

    if (currentWaypoint) {
      this.removeWaypoint(obj.id);
    } else {
      this.addWaypoint(obj.id, 0);
    }
  }

  // toggle over a waypoint at 3k, 6k, 9k and no waypoint
  toggleOrbitWaypoint(obj) {

    let currentWaypoint = this.getCurrentWaypoint(obj.id);

    if (currentWaypoint && currentWaypoint.orbit == 0) {
      this.addWaypoint(obj.id, 3000);
    } else if (currentWaypoint && currentWaypoint.orbit == 3000) {
      this.addWaypoint(obj.id, 6000);
    } else if (currentWaypoint && currentWaypoint.orbit == 6000) {
      this.addWaypoint(obj.id, 9000);
    } else if (currentWaypoint && currentWaypoint.orbit == 9000) {
      this.removeWaypoint(obj.id);
    } else {
      this.addWaypoint(obj.id, 3000);
    }
  }

  // start setting a target - can be interupted by signals setting a target
  // otherwise once complete, sets the target and resets timer
  startSettingTarget(obj) {
    this.targettingObj = obj;
    this.targettingId = obj.id;
    this.timeToTarget = this.targettingTotalTime;
  }

  createItemActions(item) {

    let ourShip = this.playerShip;
    if (this.dockedPlayerShip) {
      ourShip = this.dockedPlayerShip;
    }

    let actions = [];

    if (item.source.id == ourShip.id) {

      actions = [
        h("button", {
          key: "selectednav-action-focus",
          onclick: (event) => {
            this.renderer.updateSharedState({
          		focus: "player"
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: 26,
          width: 26
        }, [])])
      ];

    } else {

      // see if we are actively targetting or not
      let targetButton = null;
      if ((ourShip.targetId == null || ourShip.targetId < 0) && !this.targettingObj) {
        targetButton = h("button", {
          key: "selectednav-action-target",
          onclick: (event) => {
            this.startSettingTarget(item.source)
          }
        }, [h("img", {
          src: "./"+Assets.Images.target,
          height: 26,
          width: 26
        }, [])]);
      } else if (this.targettingObj) {
        let progress = Math.round(this.timeToTarget / 1000);
        targetButton = h("button", {
          key: "selectednav-action-target",
          onclick: (event) => {

          }
        }, [progress.toString()]);
      }

      actions = [
        h("button", {
          key: "selectednav-action-focus",
          onclick: (event) => {
            this.renderer.updateSharedState({
          		focus: item.source.id
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: 26,
          width: 26
        }, [])]),
        h("button", {
          key: "selectednav-action-wp",
          onclick: (event) => {
            this.toggleInterceptWaypoint(item.source)
          }
        }, [h("img", {
          src: "./"+Assets.Images.waypoint,
          height: 26,
          width: 26
        }, [])]),
        targetButton
      ];

      if (item.source instanceof Planet) {
        actions.push(
          h("button", {
            key: "selectednav-action-orbit",
            onclick: (event) => {
              this.toggleOrbitWaypoint(item.source)
            }
          }, [h("img", {
            src: "./"+Assets.Images.orbitwaypoint,
            height: 26,
            width: 26
          }, [])])
        );
      }

      // allow target button (works like signals scan but sets target FOR
      // signals allowing for target to be set at long range)


    }

    return actions;
  }

  createItem(item) {

    if (item == null) return null;

      // standard hud display of properties and type
      let lines = Object.keys(item).map(function(key) {
        if (key == 'source') {
          // ignore this is just for adding data/actions later
        } else if (key == 'image') {
          if (item[key]) {
            return h('div.image', {
            },[
              h('img', {
                src: item[key],
                // height: 32, // in the future set size based on actual size and distance!
                // width: 32
              },[])
            ]);
          } else {
            return null;
          }
        } else if (item[key]) {
          return h('div.line.'+key, [
            h('label', [key.replace("_", " ")]),
            h('data', [item[key]])
          ]);
        }
      }.bind(this));

      // allow addition of actions line at the end
      let actions = this.createItemActions(item);
      if (actions) {
        lines.push(h('div.nv.ui.row.actions', {key: "selectednavdata-actions"}, actions));
      }

      return h('div.data.'+item.type, {
          key: 'item'
        },
        lines
      );
  }

  render() {

    return h('div.nv.ui.selected', {
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
    },
    [this.createItem(this.selectedObject)]
    );
  }

  objectSummary(obj) {

    let shipForPosition = this.dockedWithShip;
    if (!shipForPosition) {
      shipForPosition = this.playerShip;
    }

    let ourPos = Victor.fromArray(shipForPosition.physicsObj.position);
    let objPos = Victor.fromArray(obj.physicsObj.position);
    let objDirection = objPos.clone().subtract(ourPos);
    let bearing = (Math.PI - objDirection.verticalAngle()) % (2 * Math.PI);
    let degrees = this.radiansToDegrees(bearing);
    let distanceToObj = objDirection.magnitude();
    let ourSpeed = Victor.fromArray(shipForPosition.physicsObj.velocity);
    let closing = 0;
    if (distanceToObj != 0) {
        closing = (ourSpeed.dot(objDirection) / distanceToObj);
    }
    let roundedDistance = Math.round(distanceToObj);
    let timeToTarget = Math.round(distanceToObj/closing);

    // vector of object
    let v = new Victor(obj.physicsObj.velocity[0], 0-obj.physicsObj.velocity[1]);

    let mass = obj.physicsObj.mass.toPrecision(3) + SolarObjects.units.mass;
    let speed = Math.round(v.magnitude()) + SolarObjects.units.speed;
    let radius = Math.round(obj.size / 2) + SolarObjects.units.distance;
    let surfaceG = null;
    let label = obj.name || obj.hull || obj.texture;

    let summary = {};

    let showDetail = true;
    if (obj.isScannedBy) {
      let actualPlayerShip = this.dockedWithShip || this.playerShip;

      // if not scanned, hide or obscure some info
      showDetail = obj.isScannedBy(actualPlayerShip.faction);

      summary.scanned = showDetail ? "Yes" : "No";

      if (!showDetail) {
        mass = "~" + (Math.round(obj.physicsObj.mass / 100) * 100).toPrecision(3) + SolarObjects.units.mass;
        radius = "~" + Math.round(Math.round((obj.size / 2) / 100) * 100) + SolarObjects.units.distance;
      } else if (obj.faction) {
          if (obj.isFriend(actualPlayerShip.faction)) {
            summary.IFF = "Friend";
          } else if (obj.isHostile(actualPlayerShip.faction)) {
            summary.IFF = "Hostile";
          } else {
            summary.IFF = "Neutral";
          }
      }

    }

    summary = Object.assign(summary, {
      mass: mass,
      radius: radius,
      bearing: Math.round(degrees) + "°",
      distance: roundedDistance + Assets.Units.distance,
      closing: closing.toPrecision(3) + Assets.Units.speed,
      speed: speed,
      source: obj
    });

    if (showDetail) {
      summary.label = label;
    }

    if (obj instanceof Ship) {
      if (showDetail) {
        summary.type = 'Ship';
        summary.image = "./" + obj.getHullData().image;
      }

    } else if (obj instanceof Planet) {
      summary.type = 'Planet';
      summary.image = "./" + Assets.Images[obj.texture];

      surfaceG = Math.round(((SolarObjects.constants.G * obj.physicsObj.mass) / Math.pow((obj.size / 2), 2)) * 100) / 100;
      if (surfaceG) {
        summary.surface_gravity = surfaceG + SolarObjects.units.force;
      }

      // let orbitRadius1 = obj.size + 3000; # include or exclude size
      let orbitRadius1 = 3000;
      let orbitSpeed1 = Math.sqrt((SolarObjects.constants.G * obj.mass) / orbitRadius1);
      summary.orbit_at_3k = Math.round(orbitSpeed1) + SolarObjects.units.speed;

      // let orbitRadius2 = obj.size + 6000;
      let orbitRadius2 = 6000;
      let orbitSpeed2 = Math.sqrt((SolarObjects.constants.G * obj.mass) / orbitRadius2);
      summary.orbit_at_6k = Math.round(orbitSpeed2) + SolarObjects.units.speed;

      // let orbitRadius3 = obj.size + 9000;
      let orbitRadius3 = 9000;
      let orbitSpeed3 = Math.sqrt((SolarObjects.constants.G * obj.mass) / orbitRadius3);
      summary.orbit_at_9k = Math.round(orbitSpeed3) + SolarObjects.units.speed;

    } else if (obj instanceof Asteroid) {
      if (showDetail) {
        summary.type = 'Asteroid';
        summary.image = "./" + Assets.Images.asteroid;
      }

    } else if (obj instanceof Torpedo) {
      if (showDetail) {
        summary.type = 'Torpedo';
      }
    }

    if (timeToTarget != NaN && timeToTarget < Infinity && timeToTarget > -Infinity) {
      summary.time = timeToTarget + " s";
    }

    if (showDetail && obj.faction) {
      summary.faction = this.factions.getFaction(obj.faction).name;
    }



    return summary;
  }

  // watch for object id
  updateObject(obj, renderer) {

    if (this.selected === obj.id) {

      this.selectedObject = this.objectSummary(obj);
      this.projector.scheduleRender();
    }

  }

  radiansToDegrees(radians) {
    let degrees = radians * (180/Math.PI);
    if (degrees < 0) {
      degrees = degrees + 360;
    }
    return degrees;
  }

  // if current target is removed
  removeObject(key, renderer) {
    if (this.selected === key) {
     this.selected = null;
     this.selectedObject = null;
     this.projector.scheduleRender();
    }
  }

  // watch the plathis.timeToTargetyer ship and update
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
      this.dockedWithShip = playerShip;
    } else {
      this.playerShip = playerShip;
      this.dockedWithShip = null;
    }

    if (this.selected === playerShip.id) {

      this.selectedObject = this.objectSummary(playerShip);
      this.projector.scheduleRender();

    } else if (isDocked && this.selected === isDocked.id) {

      this.selectedObject = this.objectSummary(isDocked);
      this.projector.scheduleRender();

    }

    // update the timer
    if (this.targettingObj && this.selectedObject && this.targettingId == this.selected) {
      this.timeToTarget = this.timeToTarget - dt;
      this.projector.scheduleRender();

      if (this.timeToTarget <= 0) {

        // do the set target
        if (this.renderer.client) {
          this.renderer.client.setTarget(this.targettingId);
        }

        this.targettingObj = null;
        this.targettingId = null;
        this.timeToTarget = 0;
      }
    } else {
      this.targettingObj = null;
      this.targettingId = null;
      this.timeToTarget = 0;
    }


  }


}
