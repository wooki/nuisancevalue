const PIXI = require('pixi.js');

import Assets from '../Utils/images.js';
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
      internalZIndex: {
        background: 1,
        dialLabels: 1,
        waypoints: 10,
        target: 20,
        gravity: 30,
        beading: 40,
        heading: 50
      },
      colors: {
        bearing: new ColorReplaceFilter([0, 0, 0], [1, 0, 0], 0.1)
      },
      arrowSize: 15,
      margin: 4,
      arrowMargin: 10,
      dialSmallDivider: 5,
      dialLargeDivider: 20,
      dialSmallDividerSize: 6,
      dialLargeDividerSize: 10,
      dialFontSize: 12
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
    dashboardMaskGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    dashboardMaskGraphics.endFill();
    this.hudContainer.mask = dashboardMaskGraphics;

    // use graphics to draw a dial once (at the correct size) for the background
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
          dialLabel = new PIXI.Text(dialIndex, {fontFamily : Assets.Fonts.Mono, fontSize: 12, fill : Assets.Colors.Dial, align : 'center'});
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

  // needed to listen for zoom
  updateSharedState(state, renderer) {

    // zoom has changed, this.parameters.zoom
    if (state.zoom && state.zoom != this.parameters.zoom) {

      // recalc scale
      this.parameters.zoom = state.zoom;
      this.parameters.scale = this.parameters.height * this.parameters.zoom / (this.parameters.mapSize);

    }
  }

  // watch the player ship and update
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {

    this.playerShip = playerShip;

    // add or update the player ship
    if (!isDestroyed) {

      // gravity effecting us

      // heading (our current vector relative to gravity)

      // our bearing (direction of facing)
      this.setBearing(playerShip);


      // target

      // waypoint

    }
  }


  // create or update bearing marker
  setBearing(playerShip) {

    let bearing = playerShip.physicsObj.angle;

    // work out its position
    let m = new PIXI.Matrix();
    m.translate(0, (this.parameters.height/2) - this.parameters.arrowMargin);
    m.rotate(bearing);
    m.translate(this.centerX, this.centerY);
    let p = new PIXI.Point(0, 0);
    p = m.apply(p);

    let bearingSprite = this.sprites.bearing;
    if (bearingSprite) {

      // move it
      bearingSprite.x = p.x;
      bearingSprite.y = p.y;
      bearingSprite.rotation = bearing;

    } else {

      // create it
      let texture = this.resources[this.parameters.baseUrl+Assets.Images.arrow].texture;
      bearingSprite = new PIXI.Sprite(texture);
      bearingSprite.width = this.parameters.arrowSize;
      bearingSprite.height = this.parameters.arrowSize;
      bearingSprite.anchor.set(0.5);
      bearingSprite.x = p.x;
      bearingSprite.y = p.y;
      bearingSprite.rotation = bearing;
      bearingSprite.filters = [ this.parameters.colors.bearing ];
      bearingSprite.zIndex = this.parameters.internalZIndex.bearing;

      this.hudContainer.addChild(bearingSprite);
      this.sprites.bearing = bearingSprite;
    }
  }

  relativeScreenCoord(x, y, focusX, focusY) {

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
