const PIXI = require('pixi.js');
import Assets from '../Utils/assets.js';
import UiUtils from '../Utils/UiUtils';
import {GlitchFilter} from '@pixi/filter-glitch';
import {PixelateFilter} from '@pixi/filter-pixelate';

export default class MapBackground {

  // keep track of where the renderer wants us to draw this
  constructor(params) {

    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      zIndex: 1,
      baseUrl: '/',
      shape: "circle", // or "rectangle"
      borderWidth: 4,
      backgroundAsset: 'spaceblack',
    }, params);

  }

  // keep reference and draw what we can
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.pixiApp = pixiApp;
    this.pixiContainer = pixiContainer;
    this.resources = resources;
    this.renderer = renderer;

    // put everything in a container
    this.mapContainer = new PIXI.Container();
    this.mapContainer.sortableChildren = true;
    this.mapContainer.zIndex = this.parameters.zIndex;
    this.mapContainer.interactive = true;
    this.mapContainer.on('mousedown', this.canvasClick.bind(this));
    this.mapContainer.on('touchstart', this.canvasClick.bind(this));
    pixiContainer.addChild(this.mapContainer);

    this.centerX = this.parameters.x + (this.parameters.width/2);
    this.centerY = this.parameters.y + (this.parameters.height/2);

    // draw a border around the mask
    let borderGraphics = new PIXI.Graphics();
    borderGraphics.lineStyle(this.parameters.borderWidth, Assets.Colors.Dial, 1, 0.5);
    if (this.parameters.shape == "circle") {
      borderGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    } else {
      borderGraphics.drawRect(this.centerX - (this.parameters.width/2), this.centerY - (this.parameters.height/2), this.parameters.width, this.parameters.height);
    }

    let borderTexture = pixiApp.renderer.generateTexture(borderGraphics);
    borderGraphics.destroy();
    borderTexture = new PIXI.Sprite(borderTexture);
    borderTexture.anchor.set(0.5);
    borderTexture.x = this.centerX;
    borderTexture.y = this.centerY;
    borderTexture.zIndex = this.parameters.zIndex+1;
    pixiContainer.addChild(borderTexture);

    // prevent drawing outside the map
    let dashboardMaskBorderGraphics = new PIXI.Graphics();
    dashboardMaskBorderGraphics.beginFill(Assets.Colors.Black, 1);
    if (this.parameters.shape == "circle") {
      dashboardMaskBorderGraphics.drawCircle(this.centerX, this.centerY, (this.parameters.width/2));
    } else {
      dashboardMaskBorderGraphics.drawRect(this.centerX - (this.parameters.width/2), this.centerY - (this.parameters.height/2), this.parameters.width, this.parameters.height);
    }
    this.mapContainer.mask = dashboardMaskBorderGraphics;

    // draw background
    let backgroundTexture = resources[this.parameters.baseUrl+Assets.Images[this.parameters.backgroundAsset]].texture;
    this.backgroundSprite = new PIXI.TilingSprite(backgroundTexture, 1024, 1024);
    this.backgroundSprite.anchor.set(0.5);
    this.backgroundSprite.x = this.centerX;
    this.backgroundSprite.y = this.centerY;
    this.backgroundSprite.width = this.parameters.width;
    this.backgroundSprite.height = this.parameters.height;
    // this.backgroundSprite.zIndex = this.parameters.internalZIndex.background;
    this.mapContainer.addChild(this.backgroundSprite);
  }

  canvasClick(event) {
      event.stopPropagation();
      this.renderer.playSound('click');
      this.renderer.updateSharedState({
    		selection: null
    	});
  }
}
