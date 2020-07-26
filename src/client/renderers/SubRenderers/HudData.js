import Victor from 'victor';
import Assets from '../Utils/images.js';
import {h, createProjector} from 'maquette';

// Info panels for the data drawn on LocalMapHud
export default class HudData {

  constructor(params) {
    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 200,
      height: 600,
      zIndex: 1,
      baseUrl: '/',
      colors: {
        bearing: '#FF0000', //0xFF0000,
        gravity: '#3333FF', //0x3333FF,
        heading: '#00FF00', //0x00FF00,
        waypoint: '#CCCC00', //0xCCCC00,
        target: '#00FFFF', //0x00FFFF
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

    // draw
    this.dataItems = []; // start with empty list of items
    this.projector = createProjector();
    this.projector.append(this.el, this.render.bind(this));
  }

  createItem(item, index) {
      if (item == null) return null;

      return h('div.data.'+item.type, {
          key: 'item'+index
        },
        Object.keys(item).map(function(key) {
          if (key == 'type') {
            return h('div.line.LED.'+item[key], {
              styles: {
                'background-color': this.parameters.colors[item[key]]
              }
            },[]);
          } else {
            return h('div.line', [
              h('label', [key]),
              h('data', [item[key]])
            ]);
          }
        }.bind(this))
      );
  }

  render() {

    return h('div.nv.ui', {
      styles: {
        position: 'absolute',
        left: this.parameters.x + 'px',
        top: this.parameters.y + 'px',
        width: this.parameters.width + 'px',
        height: this.parameters.height + 'px'
      }
    },
    this.dataItems.map(function(item, index) {
      return this.createItem(item, index)
    }.bind(this))
    );
  }

  // watch for object updates so we can display the target
  updateObject(obj, renderer) {
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

      this.dataItems[this.parameters.itemOrder.target] = {
        type: 'target',
        label: obj.name || obj.hull || obj.texture,
        bearing: Math.round(degrees) + "°",
        distance: roundedDistance + Assets.Units.distance,
        closing: closing.toPrecision(3) + Assets.Units.speed,
        time: timeToTarget + "s"
      };
    }

  }

  // if current target is removed
  removeObject(key, renderer) {
    if (this.currentTargdataItemsetId || this.currentTargetId === 0) {
       if (this.currentTargetId == key) {
         // remove marker
         this.dataItems[this.parameters.itemOrder.target] = null;
         this.projector.scheduleRender();
       }
    }
  }

  // watch the player ship and update
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    this.playerShip = playerShip;

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
      this.dataItems[this.parameters.itemOrder.target] = this.getTargetData(playerShip);

      // waypoint (last because they repeat - so ignore the sorting)
      let waypointDataItems = this.getWaypointData(playerShip);
      this.dataItems = this.dataItems.concat(waypointDataItems);


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
      bearing: Math.round(degrees) + "°"
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
           time: timeToTarget + "s"
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
        speed: speedText + Assets.Units.speed
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

  getWaypointData(playerShip) {

    let wpData = [];

    // if we have waypoints either add to map or add to dial
    if (playerShip.waypoints) {

      playerShip.waypoints.forEach(function(wp) {

          // unpack
          let waypointParams = wp.split(',');
          let waypoint = {
              name: waypointParams[0],
              x: parseInt(waypointParams[1]),
              y: parseInt(waypointParams[2])
          }

          // check if the waypoint will be on screen, or to be drawn on dial
          waypoint.ourPos = Victor.fromArray(playerShip.physicsObj.position);
          waypoint.waypointPos = Victor.fromArray([waypoint.x, waypoint.y]);
          waypoint.waypointDirection = waypoint.waypointPos.clone().subtract(waypoint.ourPos);
          let bearing = (Math.PI - waypoint.waypointDirection.verticalAngle()) % (2 * Math.PI);
          let degrees = this.radiansToDegrees(bearing);
          waypoint.distanceToWaypoint = waypoint.waypointDirection.magnitude();
          waypoint.bearing = 0 - waypoint.waypointDirection.verticalAngle() % (2 * Math.PI);
          let ourSpeed = Victor.fromArray(playerShip.physicsObj.velocity);
          waypoint.closing = 0;
          if (waypoint.distanceToWaypoint != 0) {
              waypoint.closing = (ourSpeed.dot(waypoint.waypointDirection) / waypoint.distanceToWaypoint);
          }
          let roundedDistance = Math.round(waypoint.distanceToWaypoint);
          let timeToTarget = Math.round(waypoint.distanceToWaypoint/waypoint.closing);

          wpData.push({
            type: 'waypoint',
            label: waypoint.name,
            bearing: Math.round(degrees) + "°",
            distance: roundedDistance + Assets.Units.distance,
            closing: waypoint.closing.toPrecision(3) + Assets.Units.speed,
            time: timeToTarget + "s"
          });
      }.bind(this));
    }

    return wpData;
  }

}
