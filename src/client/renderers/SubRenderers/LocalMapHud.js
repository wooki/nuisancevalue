const PIXI = require('pixi.js');

import Assets from '../Utils/images.js';
import Victor from 'victor';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
// import UiUtils from '../Utils/UiUtils';

// designed to be drawn above the LocalMap, shows the current
// bearing/heading/waypoints etc. around the end
export default class LocalMapHud {

  // keep track of where the renderer wants us to draw this
  constructor(params) {

    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      zIndex: 2,
      baseUrl: '/',
      mapSize: 10000, // how much to display across the width of the map
      zoom: 1,
      focus: "player", // "player", [0,0], 0 = "the players ship, a coord, an object id"
      shape: "circle", // or "rectangle"
      dial: true,
      internalZIndex: {
        background: 1,
        dialLabels: 1,
        waypoint: 10,
        target: 20,
        gravity: 30,
        beading: 40,
        heading: 50
      },
      filters: {
        bearing: new ColorReplaceFilter([0, 0, 0], [1, 0, 0], 0.1),
        gravity: new ColorReplaceFilter([0, 0, 0], [0.2, 0.2, 1], 0.1),
        heading: new ColorReplaceFilter([0, 0, 0], [0, 1, 0], 0.1),
        waypoint: new ColorReplaceFilter([0, 0, 0], [1, 1, 0], 0.1),
        target: new ColorReplaceFilter([0, 0, 0], [0, 1, 1], 0.1)
      },
      colors: {
        bearing: 0xFF0000,
        gravity: 0x3333FF,
        heading: 0x00FF00,
        waypoint: 0xFFFF00,
        target: 0x00FFFF
      },
      arrowSize: 15,
      margin: 4,
      arrowMargin: 10,
      dialSmallDivider: 5,
      dialLargeDivider: 20,
      dialSmallDividerSize: 6,
      dialLargeDividerSize: 10,
      dialFontSize: 12,
      markerSize: 32
    }, params);

    // based on mapSize we want to display and size we
    // are drawing we can calculate scale
    this.parameters.scale = this.parameters.height / (this.parameters.mapSize * this.parameters.zoom);
  }

  // keep reference and draw what we can
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.pixiApp = pixiApp;
    this.pixiContainer = pixiContainer;
    this.resources = resources;

    this.focusObjectCoord = [];
    this.sprites = []; // keep track of sprites on the map

    // put everything in a container
    this.hudContainer = new PIXI.Container();
    this.hudContainer.sortableChildren = true;
    this.hudContainer.zIndex = this.parameters.zIndex;
    pixiContainer.addChild(this.hudContainer);

    this.centerX = this.parameters.x + (this.parameters.width/2);
    this.centerY = this.parameters.y + (this.parameters.height/2);

    let dashboardMaskGraphics = new PIXI.Graphics();
    dashboardMaskGraphics.beginFill(Assets.Colors.Black, 1);
    if (this.parameters.shape == "circle") {
      dashboardMaskGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    } else {
      dashboardMaskGraphics.drawRect(this.centerX - (this.parameters.width/2), this.centerY - (this.parameters.height/2), this.parameters.width, this.parameters.height);
    }
    dashboardMaskGraphics.endFill();
    this.hudContainer.mask = dashboardMaskGraphics;

    // use graphics to draw a dial once (at the correct size) for the background
    if (this.parameters.dial) {
      const dialGraphics = new PIXI.Graphics();

      // draw divisions
      for (let dialIndex = 0; dialIndex < 360; dialIndex = dialIndex + this.parameters.dialSmallDivider) {

          // is it a large or small division
          let dialLabel = null;
          let dividerLength = this.parameters.dialSmallDividerSize;
          if (dialIndex % this.parameters.dialLargeDivider == 0) {
            dividerLength = this.parameters.dialLargeDividerSize;

            // dial text is not baked into the sprite because graphic does
            // not have atext method, so for now add sprites
            let labelOffset = (this.parameters.height/2) - (this.parameters.margin + dividerLength);
            dialLabel = new PIXI.Text(dialIndex, {fontFamily : Assets.Fonts.Mono, fontSize: this.parameters.dialFontSize, fill : Assets.Colors.Dial, align : 'center'});
            dialLabel.anchor.set(0.5, 0);
            dialLabel.pivot.set(0, labelOffset);
            dialLabel.x = this.centerX;
            dialLabel.y = this.centerY;
            dialLabel.rotation = dialIndex * (Math.PI/180);
            dialLabel.zIndex = this.parameters.internalZIndex.dialLabels;
            this.hudContainer.addChild(dialLabel);
          }

          // calculate two points (start and end of line) by rotating to their position
          let m = new PIXI.Matrix();
          m.rotate(dialIndex * (Math.PI/180));
          m.translate(this.centerX, this.centerY);
          let p1 = new PIXI.Point(0, (this.parameters.height/2) - this.parameters.margin);
          p1 = m.apply(p1);
          let p2 = new PIXI.Point(0, (this.parameters.height/2) - (this.parameters.margin + dividerLength));
          p2 = m.apply(p2);

          // draw a line
          dialGraphics.moveTo(p1.x, p1.y);
          dialGraphics.lineStyle(1, Assets.Colors.Dial, 1);
          dialGraphics.lineTo(p2.x, p2.y);
      }


      let dialTexture = pixiApp.renderer.generateTexture(dialGraphics);
      dialGraphics.destroy();
      this.dialSprite = new PIXI.Sprite(dialTexture);
      this.dialSprite.anchor.set(0.5);
      this.dialSprite.x = this.centerX;
      this.dialSprite.y = this.centerY;
      this.dialSprite.width = this.parameters.width - (2*this.parameters.margin);
      this.dialSprite.height = this.parameters.height - (2*this.parameters.margin);
      this.dialSprite.zIndex = this.parameters.internalZIndex.background;
      this.hudContainer.addChild(this.dialSprite);
    }
  }

  // get the coord depending on the focus type
  getFocusCoord() {
    if (this.parameters.focus == "player") {
      // get the playerShip coord
      if (this.playerShip) {
        this.focusObjectCoord = this.playerShip.physicsObj.position;
        return this.focusObjectCoord;
      }
    } else if (Array.isArray(this.parameters.focus)) {
      // coord
      this.focusObjectCoord = this.parameters.focus;
      return this.focusObjectCoord;
    } else {
      // get the coord of the object with that id
      return this.focusObjectCoord;
    }

    return [0, 0]; // shouldn't get here
  }

  // needed to listen for zoom
  updateSharedState(state, renderer) {

    // zoom has changed, this.parameters.zoom
    if (state.zoom && state.zoom != this.parameters.zoom) {

      // recalc scale
      this.parameters.zoom = state.zoom;
      this.parameters.scale = this.parameters.height * this.parameters.zoom / (this.parameters.mapSize);

    }

    // focus has changed
    if (state.focus && state.focus != this.parameters.focus) {

      // update setting and position immediately
      this.parameters.focus = focus;
      this.focusObjectCoord = this.getFocusCoord();
    }
  }

  // watch for object updates so we can display the target
  updateObject(obj, renderer) {

    if (obj.id == this.parameters.focus) {
        this.focusObjectCoord = obj.physicsObj.position;
    }

    // if this matches our current target set marker
    if (this.currentTargetId === obj.id) {

      // check if the target will be on screen, or to be drawn on dial
      let ourPos = Victor.fromArray(this.playerShip.physicsObj.position);

      let targetPos = Victor.fromArray(obj.physicsObj.position);
      let targetDirection = targetPos.clone().subtract(ourPos);
      let distanceToTarget = targetDirection.magnitude();
      let bearingToTarget = 0 - targetDirection.verticalAngle() % (2 * Math.PI);

      let focusPos = Victor.fromArray(this.getFocusCoord());
      let targetDirectionFromFocus = targetPos.clone().subtract(focusPos);
      let distanceToTargetFromFocus = targetDirectionFromFocus.magnitude();
      let bearingToTargetFromFocus = 0 - targetDirectionFromFocus.verticalAngle() % (2 * Math.PI);

      let roundedDistance = Math.round(distanceToTarget);
      let mapShown = (this.parameters.height/2) / this.parameters.scale;
      let targetText = roundedDistance + Assets.Units.distance;

      // if (distanceToTarget < mapShown) {
      if (this.parameters.dial == false || distanceToTargetFromFocus < mapShown) {
          // draw to map
          this.unsetDialMarker('dialTarget');
          this.setMarker('markTarget', targetPos.x, targetPos.y, 'target', null);
      } else {
          // draw on the dial
          this.unsetMarker('markTarget');
          // this.setDialMarker('dialTarget', bearingToTarget, 'target', targetText);
          this.setDialMarker('dialTarget', bearingToTargetFromFocus, 'target', targetText);
      }
    }

  }

  // if current target is removed
  removeObject(key, renderer) {
    if (this.currentTargetId || this.currentTargetId === 0) {
       if (this.currentTargetId == key) {
         // remove marker
         this.unsetMarker('markTarget');
         this.unsetDialMarker('dialTarget');
       }
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

    // add or update the player ship
    if (!isDestroyed) {

      // gravity effecting us
      this.setGravity(playerShip);

      // heading
      this.setHeading(playerShip);

      // our bearing (direction of facing)
      this.setBearing(playerShip);

      // target
      this.setTarget(actualPlayerShip);

      // waypoint
      this.setWaypoints(actualPlayerShip);
    }
  }

  getPositionForMarker(rotation, offset) {

    // work out its position
    let m = new PIXI.Matrix();
    m.translate(0, offset);
    m.rotate(rotation);
    m.translate(this.centerX, this.centerY);
    let p = new PIXI.Point(0, 0);
    return m.apply(p);
  }

  createArrow(filter, zIndex, texturePath) {
    if (texturePath === undefined) {
      texturePath = this.parameters.baseUrl+Assets.Images.arrow;
    }
    let texture = this.resources[texturePath].texture;
    let arrowSprite = new PIXI.Sprite(texture);
    arrowSprite.width = this.parameters.arrowSize;
    arrowSprite.height = this.parameters.arrowSize;
    arrowSprite.anchor.set(0.5);
    arrowSprite.filters = [ filter ];
    arrowSprite.zIndex = zIndex;
    return arrowSprite;
  }

  createArrowText(color, zIndex) {
    let arrowText = new PIXI.Text("", {fontFamily : Assets.Fonts.Mono, fontSize: this.parameters.dialFontSize, fill : color, align : 'center'});
    arrowText.anchor.set(0.5, 0);
    arrowText.zIndex = zIndex;
    return arrowText;
  }

  // create or update bearing marker
  setBearing(playerShip) {

    let bearing = playerShip.physicsObj.angle;
    this.setDialMarker('bearing', bearing, 'bearing');
  }

  setGravity(playerShip) {

    if (playerShip.gravityData && playerShip.gravityData.direction) {

        let gravityV = Victor.fromArray([playerShip.gravityData.direction.x, playerShip.gravityData.direction.y]);
        let gravity = 0 - gravityV.verticalAngle();
        let headingVector = Victor.fromArray(playerShip.physicsObj.velocity);
        let gravityDistanceText = Math.round(gravityV.magnitude());
        // let gravityAmountText = Math.round((playerShip.gravityData.amount / (playerShip.physicsObj.mass)) * 100) / 100;
        let gravityHeading = Victor.fromArray([playerShip.gravityData.velocity.x, playerShip.gravityData.velocity.y]);
        let closing = 0;
        if (gravityV.magnitude() != 0) {
            closing = ((headingVector.clone().subtract(gravityHeading)).dot(gravityV) / gravityV.magnitude());
        }

        let gravityText = gravityDistanceText + Assets.Units.distance + "\n" +
                       closing.toPrecision(3) + Assets.Units.speed;

        this.setDialMarker('gravity', gravity, 'gravity', gravityText);

    } else {
      this.unsetDialMarker('gravity');
    }
  }

  setHeading(playerShip) {

    let headingVector = Victor.fromArray(playerShip.physicsObj.velocity);
    let course = 0 - headingVector.verticalAngle();
    let speed = headingVector.magnitude();
    let speedText = Math.abs(Math.round(speed));

    if (speed != 0) {
      this.setDialMarker('heading', course, 'heading', speedText + Assets.Units.speed);
    } else {
      this.unsetDialMarker('heading');
    }
  }

  // set/unset target
  setTarget(playerShip) {

    // if we have a target already that isn't this one then remove marker
    if (this.currentTargetId || this.currentTargetId === 0) {
       if (this.currentTargetId != playerShip.targetId) {
         // remove marker
         this.unsetMarker('markTarget');
         this.unsetDialMarker('dialTarget');
       }
    }

    // update current target which will be drawn/moved when we see the object
    this.currentTargetId = playerShip.targetId;
  }

  setWaypoints(actualPlayerShip) {

    let currentWaypoints = {};

    // if we have waypoints either add to map or add to dial
    if (actualPlayerShip.waypoints) {

      actualPlayerShip.waypoints.forEach(function(wp) {

          // unpack
          let waypointParams = wp.split(',');
          let waypoint = {
              name: waypointParams[0],
              x: parseInt(waypointParams[1]),
              y: parseInt(waypointParams[2])
          }

          // remember for future
          currentWaypoints[waypoint.name] = waypoint;

          // check if the waypoint will be on screen, or to be drawn on dial
          waypoint.ourPos = Victor.fromArray(this.playerShip.physicsObj.position);
          waypoint.waypointPos = Victor.fromArray([waypoint.x, waypoint.y]);
          waypoint.waypointDirection = waypoint.waypointPos.clone().subtract(waypoint.ourPos);
          // waypoint.waypointDirection = new Victor(waypoint.waypointDirection.x, waypoint.waypointDirection.y);
          waypoint.distanceToWaypoint = waypoint.waypointDirection.magnitude();
          waypoint.bearing = 0 - waypoint.waypointDirection.verticalAngle() % (2 * Math.PI);

          let ourSpeed = Victor.fromArray(this.playerShip.physicsObj.velocity);
          waypoint.closing = 0;
          if (waypoint.distanceToWaypoint != 0) {
              waypoint.closing = (ourSpeed.dot(waypoint.waypointDirection) / waypoint.distanceToWaypoint);
          }

          // let roundedDistance = Math.round(waypoint.distanceToWaypoint / 1000) * 1000;
          let roundedDistance = Math.round(waypoint.distanceToWaypoint);
          let mapShown = (this.parameters.height/2) / this.parameters.scale;
          let waypointText = waypoint.name + "\n" +
                             roundedDistance + Assets.Units.distance + "\n" +
                             waypoint.closing.toPrecision(3) + Assets.Units.speed;


         let focusPos = Victor.fromArray(this.getFocusCoord());
         waypoint.directionFromFocus =   waypoint.waypointPos.clone().subtract(focusPos);
         waypoint.distanceFromFocus = waypoint.directionFromFocus.magnitude();

         // if (waypoint.distanceToWaypoint < mapShown) {
         if ( waypoint.distanceFromFocus < mapShown) {
              // draw to map
              this.unsetDialMarker('dial'+waypoint.name);
              this.setMarker('mark'+waypoint.name, waypoint.x, waypoint.y, 'waypoint', waypoint.name);
          } else {
              // draw on the dial
              this.unsetMarker('mark'+waypoint.name);
              this.setDialMarker('dial'+waypoint.name, waypoint.bearing, 'waypoint', waypointText);
          }
      }.bind(this));
    }

    // remove any waypoints we don't see any more
    if (this.waypoints) {
      Object.keys(this.waypoints).forEach((key) => {
        if (!currentWaypoints[key]) {
          this.unsetDialMarker(key);
          this.unsetMarker(key);
        }
      });
    }

    // remember these waypoints (so we can spot when they are removed)
    this.waypoints = currentWaypoints || [];
  }

  setDialMarker(name, angle, styleName, text) {

    if (!this.parameters.dial) return;

    // add an arrow
    let arrowPos = this.getPositionForMarker(angle, (this.parameters.height/2) - this.parameters.arrowMargin);
    let sprite = this.sprites[name];
    if (!sprite) {
      if (styleName == 'waypoint') {
        sprite = this.createArrow(this.parameters.filters[styleName], this.parameters.internalZIndex[name], this.parameters.baseUrl+Assets.Images.waypoint);
        sprite.width = this.parameters.arrowSize * 2;
        sprite.height = this.parameters.arrowSize * 2;
      } else if (styleName == 'target') {
        sprite = this.createArrow(this.parameters.filters[styleName], this.parameters.internalZIndex[name], this.parameters.baseUrl+Assets.Images.target);
        sprite.width = this.parameters.arrowSize * 1.5;
        sprite.height = this.parameters.arrowSize * 1.5;
      } else {
        sprite = this.createArrow(this.parameters.filters[styleName], this.parameters.internalZIndex[name]);
      }
      this.hudContainer.addChild(sprite);
      this.sprites[name] = sprite;
    }
    sprite.x = arrowPos.x;
    sprite.y = arrowPos.y;
    sprite.rotation = angle;

    // add text if there is some, otherwise remove it
    if (text && text.length > 0) {
      let textPos = this.getPositionForMarker(angle, (this.parameters.height/2) - (this.parameters.arrowMargin + this.parameters.arrowSize));
      let spriteText = this.sprites[name+'Text'];
      if (!spriteText) {
        spriteText = this.createArrowText(this.parameters.colors[styleName], this.parameters.internalZIndex[styleName])
        this.hudContainer.addChild(spriteText);
        this.sprites[name+'Text'] = spriteText;
      }
      spriteText.text = text;
      spriteText.x = textPos.x;
      spriteText.y = textPos.y;
      spriteText.rotation = angle + (Math.PI) % (Math.PI * 2);
    } else if (this.sprites[name+'Text']) {
      this.hudContainer.removeChild(this.sprites[name+'Text']);
      this.sprites[name+'Text'].destroy();
    }
  }

  setMarker(name, x, y, styleName, text) {

    // convert screen coords
    let p = this.relativeScreenCoord(x, y);

    // draw icon directly to map
    let sprite = this.sprites[name];
    if (!sprite) {
      let texture = this.resources[this.parameters.baseUrl+Assets.Images[styleName]].texture;
      sprite = new PIXI.Sprite(texture);
      sprite.width = this.parameters.markerSize;
      sprite.height = this.parameters.markerSize;
      sprite.anchor.set(0.5);
      sprite.zIndex = this.parameters.internalZIndex[styleName];
      sprite.filters = [ this.parameters.filters[styleName] ];
      this.hudContainer.addChild(sprite);
      this.sprites[name] = sprite;
    }
    sprite.x = p.x;
    sprite.y = p.y;

    // add text if there is some, otherwise remove it
    if (text && text.length > 0) {
      let spriteText = this.sprites[name+'Text'];
      if (!spriteText) {
        spriteText = this.createArrowText(this.parameters.colors[styleName], this.parameters.internalZIndex[styleName])
        spriteText.anchor.set(0, 0.5);
        this.hudContainer.addChild(spriteText);
        this.sprites[name+'Text'] = spriteText;
      }
      spriteText.text = text;
      spriteText.x = p.x + this.parameters.arrowSize + 2;
      spriteText.y = p.y;
    } else if (this.sprites[name+'Text']) {
      this.hudContainer.removeChild(this.sprites[name+'Text']);
      this.sprites[name+'Text'].destroy();
      delete this.sprites[name+'Text'];
    }
  }

  unsetDialMarker(name) {
    if (this.sprites[name]) {
      this.hudContainer.removeChild(this.sprites[name]);
      this.sprites[name].destroy();
      delete this.sprites[name];
    }
    if (this.sprites[name+'Text']) {
      this.hudContainer.removeChild(this.sprites[name+'Text']);
      this.sprites[name+'Text'].destroy();
      delete this.sprites[name+'Text'];
    }
  }

  unsetMarker(name) {
    if (this.sprites[name]) {
      this.hudContainer.removeChild(this.sprites[name]);
      this.sprites[name].destroy();
      delete this.sprites[name];
    }
    if (this.sprites[name+'Text']) {
      this.hudContainer.removeChild(this.sprites[name+'Text']);
      this.sprites[name+'Text'].destroy();
      delete this.sprites[name+'Text'];
    }
  }

  relativeScreenCoord(x, y) {

    const focus = this.getFocusCoord();
    const focusX = focus[0];
    const focusY = focus[1];

      let matrix = new PIXI.Matrix();
			matrix.translate(x, y);
			matrix.translate(0 - focusX, 0 - focusY);
			matrix.scale(this.parameters.scale, this.parameters.scale);
			matrix.translate(this.centerX, this.centerY);
			let p = new PIXI.Point(0, 0);
			p = matrix.apply(p);

			return p;
	}


}
