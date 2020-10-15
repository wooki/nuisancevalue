import Victor from 'victor';
import Assets from '../Utils/assets.js';
import UiUtils from '../Utils/UiUtils';
import {h, createProjector} from 'maquette';
import SolarObjects from '../../../common/SolarObjects';
import Factions from '../../../common/Factions';
import Asteroid from '../../../common/Asteroid';

// Info panels for the data drawn on MapHud
export default class HudData {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 200,
      height: 600,
      zIndex: 1,
      baseUrl: '/',
      predictTime: 60,
      colors: {
        bearing: Assets.Colors.Paths.BearingHex,
        gravity: Assets.Colors.Paths.GravityHex,
        heading: Assets.Colors.Paths.HeadingHex,
        waypoint: Assets.Colors.Paths.WaypointHex,
        target: Assets.Colors.Paths.TargetHex,
      },
      itemOrder: {
        bearing: 1,
        heading: 2,
        gravity: 3,
        target: 4,
        waypoint: 5
      }
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.el = el;
    // this.pixiApp = pixiApp;
    // this.pixiContainer = pixiContainer;
    // this.resources = resources;
    this.renderer = renderer;
    this.factions = new Factions();

    // draw
    this.dataItems = []; // start with empty list of items
    this.waypointDataItems = {}; // start with empty list of items
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  // designed to be overriden, should return false or an array of elements
  createItemActions(item, index) {
    return false;
  }

  createItem(item, index) {
      if (item == null) return null;

      // standard hud display of properties and type
      let lines = Object.keys(item).map(function(key) {
        if (key == 'source') {
          // do nothing - this is the original data object, for subclasses
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
        } else if (key == 'type') {
          return h('div.line.LED.type.'+item[key], {
            styles: {
              'background-color': this.parameters.colors[item[key]]
            }
          },[]);
        } else {
          return h('div.line.'+key, [
            h('label', [key.replace('_', ' ')]),
            h('data', [item[key]])
          ]);
        }
      }.bind(this));

      // allow addition of actions line at the end
      let actions = this.createItemActions(item, index);
      if (actions) {
        lines.push(h('div.nv.ui.row.actions', {key: "huddata-actions-"+index}, actions));
      }

      return h('div.data.'+item.type, {
          key: 'item'+index
        },
        lines
      );
  }

  render() {

    let items = this.dataItems.map(function(item, index) {
      return this.createItem(item, index)
    }.bind(this));

    Object.keys(this.waypointDataItems).forEach((key, index) => {
      items.push(this.createItem(this.waypointDataItems[key], 'waypoint-'+index));
    });

    return h('div.nv.ui.scrollable', {
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px',
        zIndex: this.parameters.zIndex.toString()
      }
    },
    items
    );
  }

  // watch for object updates so we can display the target
  everyObject(obj, renderer) {
    // if this matches our current target set marker
    if (this.currentTargetId === obj.id) {

      // check if the waypoint will be on screen, or to be drawn on dial
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

      let data = {
        type: 'target',
        designation: obj.name || obj.hull || obj.texture,
        bearing: Math.round(degrees) + "°",
        distance: roundedDistance + Assets.Units.distance,
        closing: closing.toPrecision(3) + Assets.Units.speed,
        time: timeToTarget + " s",
        source: obj,
        mass: obj.physicsObj.mass.toPrecision(3) + SolarObjects.units.mass,
        radius: Math.round(obj.size / 2) + SolarObjects.units.distance
      };

      // see if we scanned
      if (obj.isScannedBy) {
        let actualPlayerShip = this.dockedWithShip || this.playerShip;

        let isScanned = obj.isScannedBy(actualPlayerShip.faction);
        data.scanned = isScanned ? "Yes" : "No";

        if (!isScanned) {
          delete data['label'];
          data.mass = "~" + (Math.round(obj.physicsObj.mass / 100) * 100).toPrecision(3) + SolarObjects.units.mass;
          data.radius = "~" + Math.round(Math.round((obj.size / 2) / 100) * 100) + SolarObjects.units.distance;
        } else {

          if (obj.faction) {
              if (obj.isFriend(actualPlayerShip.faction)) {
                data.IFF = "Friend";
              } else if (obj.isHostile(actualPlayerShip.faction)) {
                data.IFF = "Hostile";
              } else {
                data.IFF = "Neutral";
              }

              if (obj.faction) {
                data.faction = this.factions.getFaction(obj.faction).name;
              }
          }

          if (obj.getHullData) {
            let hullData = obj.getHullData();
            data.hull = hullData.name;
            data.image = "./" + hullData.image;
          } else {

            if (obj instanceof Asteroid) {

              data.image = "./" + (Assets.Images[obj.texture] || Assets.Images.asteroid5);

            } else if (obj.texture && Assets.Images[obj.texture]) {
              data.image = "./" + Assets.Images[obj.texture];
            }
          }
        }

      }

      this.dataItems[this.parameters.itemOrder.target] = data;
    }

    // check if we have a waypoint for this object
    let actualPlayerShip = this.dockedPlayerShip || this.playerShip;
    if (actualPlayerShip.waypoints) {
      for (let i = 0; i < actualPlayerShip.waypoints.length; i++) {
        if (actualPlayerShip.waypoints[i].objId == obj.id) {

          let waypoint = UiUtils.createWaypointData(this.playerShip, obj, actualPlayerShip.waypoints[i].orbit, this.parameters.predictTime);

          this.waypointDataItems['waypoint-'+obj.id] = {
            type: 'waypoint',
            designation: waypoint.name,
            bearing: Math.round(waypoint.degrees) + "°",
            distance: waypoint.roundedDistance + Assets.Units.distance,
            closing: waypoint.closing.toPrecision(3) + Assets.Units.speed,
            source: waypoint
          };
          if (waypoint.timeToTarget > -Infinity && waypoint.timeToTarget < Infinity) {
            this.waypointDataItems['waypoint-'+obj.id].time = waypoint.timeToTarget + " s";
          }
          // console.log("waypoint");
          // console.dir(this.waypointDataItems['waypoint-'+obj.id]);

          this.projector.scheduleRender();
        }
      }
    }

  }

  // if current target is removed
  everyRemoveObject(key, renderer) {
    if (this.currentTargdataItemsetId || this.currentTargetId === 0) {
       if (this.currentTargetId == key) {
         // remove marker
         this.dataItems[this.parameters.itemOrder.target] = null;
         this.projector.scheduleRender();
       }
    }

    // remove waypoint
    let actualPlayerShip = this.dockedPlayerShip || this.playerShip;
    let waypointIndex = actualPlayerShip.waypoints.indexOf(wp => {
      wp.objId == key;
    });
    if (waypointIndex >= 0) {
      delete this.waypointDataItems[waypointIndex];
    }
  }

  // watch the player ship and update
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;
    let actualPlayerShip = playerShip;
    if (isDocked) {
      this.dockedPlayerShip = isDocked;
      actualPlayerShip = isDocked;
    } else {
      this.dockedPlayerShip = null;
    }

    // update the data items
    if (!isDestroyed) {

      this.dataItems = [];

      // our bearing (direction of facing)
      this.dataItems[this.parameters.itemOrder.bearing] = this.getBearingData(playerShip);

      // heading
      this.dataItems[this.parameters.itemOrder.heading] = this.getHeadingData(playerShip);

      // gravity effecting us
      this.dataItems[this.parameters.itemOrder.gravity] = this.getGravityData(playerShip);

      // target
      this.dataItems[this.parameters.itemOrder.target] = this.getTargetData(actualPlayerShip);

      // remove any waypoint Data items we have that we don't have waypoints for any more
      let waypointKeys = Object.keys(this.waypointDataItems);
      if (actualPlayerShip && this.waypointDataItems && waypointKeys.length > 0) {
        for (let i = 0; i < waypointKeys.length; i++) {
          let match = actualPlayerShip.waypoints.find(wp => {
            wp.objId == this.waypointDataItems[waypointKeys[i]].objId;
          });
          if (!match) {
            delete this.waypointDataItems[waypointKeys[i]];
          }
        }
      }

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

  getBearingData(playerShip) {

    let bearing = (playerShip.physicsObj.angle + Math.PI) % (2 * Math.PI);
    let degrees = this.radiansToDegrees(bearing);;

    return {
      type: 'bearing',
      bearing: Math.round(degrees) + "°",
      source: playerShip
    };
  }

  getGravityData(playerShip) {

    if (playerShip.gravityData && playerShip.gravityData.direction) {

        let gravityV = Victor.fromArray([playerShip.gravityData.direction.x, playerShip.gravityData.direction.y]);
        let gravity = (Math.PI - gravityV.verticalAngle()) % (2 * Math.PI);
        let degrees = this.radiansToDegrees(gravity);

        let headingVector = Victor.fromArray(playerShip.physicsObj.velocity);
        let gravityDistanceText = Math.round(gravityV.magnitude());
        // let gravityAmountText = Math.round((playerShip.gravityData.amount / (playerShip.physicsObj.mass)) * 100) / 100;
        let gravityHeading = Victor.fromArray([playerShip.gravityData.velocity.x, playerShip.gravityData.velocity.y]);
        let closing = 0;
        if (gravityV.magnitude() != 0) {
            closing = ((headingVector.clone().subtract(gravityHeading)).dot(gravityV) / gravityV.magnitude());
        }

        let timeToTarget = Math.round(gravityV.magnitude()/closing);

         return {
           type: 'gravity',
           bearing: Math.round(degrees) + "°",
           distance: gravityDistanceText + Assets.Units.distance,
           closing: closing.toPrecision(3) + Assets.Units.speed,
           time: timeToTarget + " s",
           source: playerShip.gravityData
         };

    } else {
      return null;
    }
  }

  getHeadingData(playerShip) {

    let headingVector = Victor.fromArray(playerShip.physicsObj.velocity);
    let heading = (Math.PI - headingVector.verticalAngle()) % (2 * Math.PI);
    let degrees = this.radiansToDegrees(heading);

    let speed = headingVector.magnitude();
    let speedText = Math.abs(Math.round(speed));

    if (speed != 0) {
      return {
        type: 'heading',
        bearing: Math.round(degrees) + "°",
        speed: speedText + Assets.Units.speed,
        source: playerShip
      };
    } else {
      return null;
    }
  }

  // unset target when it has changed - it gets set by the object update
  getTargetData(playerShip) {

    // if we have a target already that isn't this one then remove that item
    if (this.currentTargetId || this.currentTargetId === 0) {
       if (this.currentTargetId != playerShip.targetId) {
          this.currentTargetId = playerShip.targetId;
          return null;
       }
    }

    // update current target which will be drawn/moved when we see the object
    this.currentTargetId = playerShip.targetId;
  }


}
