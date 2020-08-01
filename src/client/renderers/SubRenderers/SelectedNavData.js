import Victor from 'victor';
import Assets from '../Utils/images.js';
import {h, createProjector} from 'maquette';
import Torpedo from '../../../common/Torpedo';
import Ship from '../../../common/Ship';
import Asteroid from '../../../common/Asteroid';
import Planet from '../../../common/Planet';
import Hulls from '../../../common/Hulls';

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

  createItemActions(item) {

    let ourShip = this.playerShip;
    if (this.dockedPlayerShip) {
      ourShip = this.dockedPlayerShip;
    }

    let actions = [];

    if (item.source.id == ourShip.playaer) {

      actions = [
        h("button", {
          key: "sleectednav-action-focus",
          onclick: (event) => {
            this.renderer.updateSharedState({
          		focus: "player"
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: 24,
          width: 24
        }, [])])
      ];

    } else {

      actions = [
        h("button", {
          key: "sleectednav-action-focus",
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
          key: "sleectednav-action-wp",
          onclick: (event) => {
            console.log("CREATE WAYPOINT");
          }
        }, [h("img", {
          src: "./"+Assets.Images.waypoint,
          height: 26,
          width: 26
        }, [])]),
        h("button", {
          key: "sleectednav-action-orbit",
          onclick: (event) => {
            console.log("CREATE ORBIT WAYPOINT");
          }
        }, [h("img", {
          src: "./"+Assets.Images.orbitwaypoint,
          height: 26,
          width: 26
        }, [])])
      ];

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
          return h('div.line', [
            h('label', [key]),
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

    let ourPos = Victor.fromArray(this.playerShip.physicsObj.position);
    let objPos = Victor.fromArray(obj.physicsObj.position);
    let objDirection = objPos.clone().subtract(ourPos);
    let bearing = (Math.PI - objDirection.verticalAngle()) % (2 * Math.PI);
    let degrees = this.radiansToDegrees(bearing);
    let distanceToObj = objDirection.magnitude();
    let ourSpeed = Victor.fromArray(this.playerShip.physicsObj.velocity);
    let closing = 0;
    if (distanceToObj != 0) {
        closing = (ourSpeed.dot(objDirection) / distanceToObj);
    }
    let roundedDistance = Math.round(distanceToObj);
    let timeToTarget = Math.round(distanceToObj/closing);

    let type = 'Ship';
    let image = null;

    let label = obj.name || obj.hull || obj.texture;
    if (obj instanceof Ship) {
      image = "./" + obj.getHullData().image;

    } else if (obj instanceof Planet) {
      type = 'Planet';
      image = "./" + Assets.Images[obj.texture];

    } else if (obj instanceof Asteroid) {
      type = 'Asteroid';
      image = "./" + Assets.Images.asteroid;

    } else if (obj instanceof Torpedo) {
      type = 'Torpedo';

    }

    let summary = {
      image: image,
      type: type,
      label: label,
      bearing: Math.round(degrees) + "°",
      distance: roundedDistance + Assets.Units.distance,
      closing: closing.toPrecision(3) + Assets.Units.speed,
      source: obj
    };

    if (timeToTarget != NaN && timeToTarget < Infinity && timeToTarget > -Infinity) {
      summary.time = timeToTarget + "s";
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

  // watch the player ship and update
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    if (this.selected === playerShip.id) {

      this.selectedObject = this.objectSummary(playerShip);
      this.projector.scheduleRender();

    } else if (isDocked && this.selected === isDocked.id) {

      this.selectedObject = this.objectSummary(isDocked);
      this.projector.scheduleRender();

    } else if (this.selected && typeof this.selected == "string" && this.selected.startsWith("waypoint")) {

      if (actualPlayerShip.waypoints) {

        actualPlayerShip.waypoints.forEach(function(wp) {

            // unpack
            let waypointParams = wp.split(',');
            let waypoint = {
                name: waypointParams[0],
                x: parseInt(waypointParams[1]),
                y: parseInt(waypointParams[2])
            }

            if ("waypoint-"+waypoint.name == this.selected) {

              // check if the waypoint will be on screen, or to be drawn on dial
              waypoint.ourPos = Victor.fromArray(this.playerShip.physicsObj.position);
              waypoint.waypointPos = Victor.fromArray([waypoint.x, waypoint.y]);
              waypoint.waypointDirection = waypoint.waypointPos.clone().subtract(waypoint.ourPos);
              let bearing = (Math.PI - waypoint.waypointDirection.verticalAngle()) % (2 * Math.PI);
              let degrees = this.radiansToDegrees(bearing);
              waypoint.distanceToWaypoint = waypoint.waypointDirection.magnitude();
              waypoint.bearing = 0 - waypoint.waypointDirection.verticalAngle() % (2 * Math.PI);
              let ourSpeed = Victor.fromArray(this.playerShip.physicsObj.velocity);
              waypoint.closing = 0;
              if (waypoint.distanceToWaypoint != 0) {
                  waypoint.closing = (ourSpeed.dot(waypoint.waypointDirection) / waypoint.distanceToWaypoint);
              }
              let roundedDistance = Math.round(waypoint.distanceToWaypoint);
              let timeToTarget = Math.round(waypoint.distanceToWaypoint/waypoint.closing);

              this.selectedObject = {
                type: 'waypoint',
                label: waypoint.name,
                bearing: Math.round(degrees) + "°",
                distance: roundedDistance + Assets.Units.distance,
                closing: waypoint.closing.toPrecision(3) + Assets.Units.speed,
                time: timeToTarget + "s",
                source: wp
              };
            }
        }.bind(this));
      this.projector.scheduleRender();
    }
  }


  }


}
