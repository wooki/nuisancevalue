const PIXI = require('pixi.js');
import Assets from '../Utils/images.js';
import UiUtils from '../Utils/UiUtils';
import Systems from '../../../common/Systems';

export default class PowerGrid {

  // keep track of where the renderer wants us to draw this
  constructor(params) {

    this.parameters = Object.assign({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      zIndex: 1,
      baseUrl: '/',
      borderWidth: 4,
      reactorFontSize: 72,
      systemFontSize: 12,
      internalZIndex: {
        background: 1,
        reactor: 2,
        system: 2,
        powergrid :3
      }
    }, params);

  }

  // keep reference and draw what we can
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.pixiApp = pixiApp;
    this.pixiContainer = pixiContainer;
    this.resources = resources;
    this.renderer = renderer;

    // put everything in a container
    this.gridContainer = new PIXI.Container();
    this.gridContainer.sortableChildren = true;
    this.gridContainer.zIndex = this.parameters.zIndex;
    pixiContainer.addChild(this.gridContainer);

    this.centerX = this.parameters.x + (this.parameters.width/2);
    this.centerY = this.parameters.y + (this.parameters.height/2);

    // draw a border around the mask
    let borderGraphics = new PIXI.Graphics();
    borderGraphics.lineStyle(this.parameters.borderWidth, Assets.Colors.Dial, 1, 0.5);
    borderGraphics.drawRect(this.parameters.x, this.parameters.y, this.parameters.width, this.parameters.height);
    let borderTexture = pixiApp.renderer.generateTexture(borderGraphics);
    borderGraphics.destroy();
    borderTexture = new PIXI.Sprite(borderTexture);
    borderTexture.anchor.set(0.5);
    borderTexture.x = this.centerX;
    borderTexture.y = this.centerY;
    borderTexture.zIndex = this.parameters.zIndex+1;
    pixiContainer.addChild(borderTexture);

    // prevent drawing outside the grid
    let dashboardMaskBorderGraphics = new PIXI.Graphics();
    dashboardMaskBorderGraphics.beginFill(Assets.Colors.Black, 1);
    dashboardMaskBorderGraphics.drawRect(this.parameters.x, this.parameters.y, this.parameters.width, this.parameters.height);
    this.gridContainer.mask = dashboardMaskBorderGraphics;

    // draw background
    let backgroundTexture = resources[this.parameters.baseUrl+Assets.Images.powergridBackground].texture;
    this.backgroundSprite = new PIXI.TilingSprite(backgroundTexture, 1631, 1024);
    this.backgroundSprite.anchor.set(0.5);
    this.backgroundSprite.x = this.centerX;
    this.backgroundSprite.y = this.centerY;
    this.backgroundSprite.width = this.parameters.width;
    this.backgroundSprite.height = this.parameters.height;
    this.backgroundSprite.zIndex = this.parameters.internalZIndex.background;
    this.gridContainer.addChild(this.backgroundSprite);

    this.sprites = {};

    // keep track of system state
    this.grid = new Systems();

    // calculate sizes
    this.gridSquareSize = this.parameters.width / this.grid.getGridSize()[0];
    this.gridHeight = this.gridSquareSize * this.grid.getGridSize()[1];
    this.gridTop = this.parameters.y + ((this.parameters.height/2) - (this.gridHeight/2));
    this.gridBottom = this.parameters.y + ((this.parameters.height/2) + (this.gridHeight/2));

    // draw data based items (systems can't be drawn until we have a ship)
    this.drawReactor();
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer) {

    this.playerShip = playerShip;

    let hullData = playerShip.getHullData();
    this.grid.unpack(playerShip.power);
    this.grid.setConnector(3, 3, 0);
    this.grid.setConnector(3, 4, 1);
    this.grid.setConnector(3, 5, 2);
    this.grid.setConnector(3, 6, 3);
    this.grid.setConnector(3, 7, 4);
    this.grid.setConnector(3, 8, 5);
    this.grid.setConnector(3, 9, 6);
    this.grid.setConnector(3, 10, 7);

    this.grid.setConnector(0, 20, 0);
    this.grid.setConnector(1, 21, 0);
    this.grid.setConnector(2, 20, 0);
    this.grid.setConnector(3, 21, 0);
    this.grid.setConnector(4, 20, 0);
    this.grid.setConnector(5, 21, 0);
    this.grid.setConnector(6, 20, 0);
    this.grid.setConnector(7, 21, 0);    

    // both of these may change with ship updates
    this.drawSystems(hullData);
    this.drawGrid(hullData);
  }

  // draw reactor
  drawReactor() {

    if (!this.sprites.reactor) {
      this.sprites.reactor = new PIXI.Container();
      this.sprites.reactor.zIndex = this.parameters.internalZIndex.reactor;

      let reactorHeight = this.gridTop - this.parameters.y;

      let reactorGraphics = new PIXI.Graphics();
      reactorGraphics.beginFill(Assets.Colors.Red, 0.66);
      reactorGraphics.drawRect(0, 0, this.parameters.width, reactorHeight);

      let reactorTexture = this.pixiApp.renderer.generateTexture(reactorGraphics);
      reactorGraphics.destroy();
      reactorTexture = new PIXI.Sprite(reactorTexture);
      reactorTexture.x = this.parameters.x;
      reactorTexture.y = this.parameters.y;
      reactorTexture.height = reactorHeight;
      reactorTexture.width = this.parameters.width;
      this.sprites.reactor.addChild(reactorTexture);

      let reactorLabel = new PIXI.Text("REACTOR", {fontSize: this.parameters.reactorFontSize, fontFamily : Assets.Fonts.Mono, fill : Assets.Colors.Black, align : 'center' });
      reactorLabel.anchor.set(0.5);
      reactorLabel.x = this.centerX;
      reactorLabel.y = this.parameters.y + (reactorHeight/2) + 4;
      // reactorLabel.height = reactorHeight;
      // reactorLabel.width = this.parameters.width;
      this.sprites.reactor.addChild(reactorLabel);

      this.gridContainer.addChild(this.sprites.reactor);
    }
  }

  // draw grid based on this.grid
  drawGrid(hullData) {

    // SYS_SENSORS: SYS_SENSORS,
    // SYS_ENGINE: SYS_ENGINE,
    // SYS_MANEUVER: SYS_MANEUVER,
    // SYS_TORPS: SYS_TORPS,
    // SYS_PDC: SYS_PDC,
    // SYS_LIFE: SYS_LIFE,
    // SYS_CONSOLES: SYS_CONSOLES,
    // SYS_NAV: SYS_NAV,
    // SYS_RELOAD: SYS_RELOAD
    let systems = hullData.systems;
    // console.dir(systems);
    // [
    //   SYS_SENSORS, SYS_SENSORS, SYS_SENSORS, SYS_SENSORS,
    //   SYS_ENGINE, SYS_ENGINE, SYS_ENGINE, SYS_ENGINE, SYS_ENGINE, SYS_ENGINE,
    //   SYS_MANEUVER, SYS_MANEUVER, SYS_MANEUVER, SYS_MANEUVER,
    //   SYS_TORPS, SYS_TORPS, SYS_TORPS,
    //   SYS_PDC, SYS_PDC, SYS_PDC,
    //   SYS_LIFE, SYS_LIFE, SYS_LIFE, SYS_LIFE,
    //   SYS_CONSOLES, SYS_CONSOLES,
    //   SYS_NAV, SYS_NAV,
    //   SYS_RELOAD, SYS_RELOAD
    // ]
    let systemLayout = hullData.systemLayout;
    let gridSize = this.grid.getGridSize();
    let powerlinesSheet = this.resources[this.parameters.baseUrl+Assets.Images.powerlines].spritesheet;

    if (!this.sprites.grid) {
      this.sprites.grid = [];
      this.sprites.powergridContainer = new PIXI.Container();
      this.sprites.powergridContainer.zIndex = this.parameters.internalZIndex.powergrid;
      this.gridContainer.addChild(this.sprites.powergridContainer);
    }

    // iterate rows and create/update sprites to reflect data in grid
    for (let i = 0; i < gridSize[1]; i++) {

      // create or get row
      let row = this.sprites.grid[i] || [];

      // iterate cells in row and create/update sprites
      for (let j = 0; j < gridSize[0]; j++) {

        // if we haven't yet got that sprite create it
        if (!row[j]) {
          let cell = new PIXI.AnimatedSprite(powerlinesSheet.animations['all']);
          cell.width = this.gridSquareSize;
          cell.height = this.gridSquareSize;
          cell.anchor.set(0, 0);
          cell.x = this.parameters.x + (j * this.gridSquareSize);
          cell.y = this.gridTop + (i * this.gridSquareSize);
          cell.gotoAndStop(this.grid.grid[i][j]);
          this.sprites.powergridContainer.addChild(cell);
          row[j] = cell;
        }

        // set animation state

      }
      this.sprites.grid[i] = row;
    }
  }

  // add/update sprites for systems based on the hull
  drawSystems(hullData) {

    let systems = hullData.systems;
    let systemLayout = hullData.systemLayout;

    let currentSystem = 0;
    let systemStart = 0;
    let systemSize = 0;

    // iterate system layout and draw each system
    for (let i = 0; i < systemLayout.length; i++) {

      // continuing same system or new one?
      if (currentSystem != systemLayout[i]) {

        // new system, draw the current one
        if (currentSystem > 0) {
          this.drawSystem(currentSystem, systemStart, systemSize);
        }

        // start recording the new one
        currentSystem = systemLayout[i];
        systemStart = i;
        systemSize = 1;

      } else {
        // continuing same system
        systemSize = systemSize + 1;
      }
    }

    // draw the final system
    if (currentSystem > 0) {
      this.drawSystem(currentSystem, systemStart, systemSize);
    }

  }

  drawSystem(currentSystem, systemStart, systemSize) {

    if (!this.sprites.systems) {
      this.sprites.systems = {};
    }

    if (!this.sprites.systems[currentSystem]) {
      let sysSprite = new PIXI.Container();
      sysSprite.zIndex = this.parameters.internalZIndex.system;

      let systemHeight = (this.parameters.x + this.parameters.height) - this.gridBottom;

      let systemGraphics = new PIXI.Graphics();
      systemGraphics.beginFill(Assets.Colors.Systems[currentSystem], 0.4);
      systemGraphics.drawRect(0, 0, this.gridSquareSize * systemSize, systemHeight);

      let systemTexture = this.pixiApp.renderer.generateTexture(systemGraphics);
      systemGraphics.destroy();
      systemTexture = new PIXI.Sprite(systemTexture);
      systemTexture.x = this.parameters.x + (this.gridSquareSize * systemStart);
      systemTexture.y = this.gridBottom;
      systemTexture.height = systemHeight;
      systemTexture.width = this.gridSquareSize * systemSize;
      this.sprites.reactor.addChild(systemTexture);

      let systemLabel = new PIXI.Text(this.grid.getSystemName(currentSystem), {dropShadow: true, dropShadowDistance: 0,dropShadowAlpha: 0.66, dropShadowBlur: 3, dropShadowColor: Assets.Colors.White, fontSize: this.parameters.systemFontSize, fontFamily : Assets.Fonts.Mono, fill : Assets.Colors.Black, align : 'center' });
      systemLabel.anchor.set(0.5, 0);
      systemLabel.pivot.set(0.5);
      systemLabel.angle = -90;
      systemLabel.x = this.parameters.x + (this.gridSquareSize * systemStart) + 2;
      systemLabel.y = this.gridBottom + (systemHeight * 0.5);
      this.sprites.reactor.addChild(systemLabel);

      this.gridContainer.addChild(sysSprite);

      this.sprites.systems[currentSystem] = sysSprite;

    } else {
      // sprite exists but potentially changed - for now do nothing, need to change here if
      // ships can change systems eg. upgrade at station
    }
  }



}
