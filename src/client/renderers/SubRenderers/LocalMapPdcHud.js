const PIXI = require('pixi.js');

import Assets from '../Utils/images.js';
import Victor from 'victor';
import {ColorReplaceFilter} from '@pixi/filter-color-replace';
import UiUtils from '../Utils/UiUtils';

const effects = {
  pdcHudColor: new ColorReplaceFilter([0, 0, 0], [0.2, 1, 0.2], 0.2)
};

// designed to be drawn above the LocalMap, shows the current
// state of the PDC
export default class LocalMapPdcHud {

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
      zoom: 1
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
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }
    
    this.drawPDCHud();
  }

  drawPDCHud() {

    if (!this.playerShip) return;

    let hullData = this.playerShip.getHullData();

    // not shown if ship has no PDC
    if (!hullData.pdc) return;

    // add or update the hud ui
    if (this.playerShip.pdcState > 0) {
      let rotation = UiUtils.adjustAngle(this.playerShip.pdcAngle);

      // draw/add the helm sprite and set rotation
      if (!this.sprites.pdcHud) {
        this.sprites.pdcHud = new PIXI.Sprite(this.resources[this.parameters.baseUrl+Assets.Images.pdchud].texture);
        this.sprites.pdcHud.filters = [ effects.pdcHudColor ];
        this.sprites.pdcHud.width = hullData.pdc.range * 2 * this.parameters.scale;
        this.sprites.pdcHud.height = hullData.pdc.range * 2 * this.parameters.scale;
        this.sprites.pdcHud.anchor.set(0.5);
        this.sprites.pdcHud.x = this.centerX;
        this.sprites.pdcHud.y = this.centerY;
        this.sprites.pdcHud.zIndex = this.parameters.zIndex;
        this.sprites.pdcHud.rotation = rotation;
        this.hudContainer.addChild(this.sprites.pdcHud);
      } else {
        this.sprites.pdcHud.width = hullData.pdc.range * 2 * this.parameters.scale;
        this.sprites.pdcHud.height = hullData.pdc.range * 2 * this.parameters.scale;
        this.sprites.pdcHud.rotation = rotation;
        this.sprites.pdcHud.visible = true;
      }
    } else if (this.sprites.pdcHud) {
        this.sprites.pdcHud.visible = false;
    }
  }


}
