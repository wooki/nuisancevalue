const PIXI = require('pixi.js');
import Assets from '../Utils/assets.js';
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
      systemFontSize: 26,
      systemEfficiencyFontSize: 20,
      boostFontSize: 12,
      internalZIndex: {
        background: 1,
        reactor: 5,
        system: 6,
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
    this.gridSquareSize = this.parameters.width / this.grid.getGridSize()[1];
    this.gridHeight = this.gridSquareSize * this.grid.getGridSize()[0];
    this.gridTop = this.parameters.y + ((this.parameters.height/2) - (this.gridHeight/2));
    this.gridBottom = this.parameters.y + ((this.parameters.height/2) + (this.gridHeight/2));

    // draw data based items (systems can't be drawn until we have a ship)
    this.drawReactor();
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDocked) {
      this.playerShip = isDocked;
    } else {
      this.playerShip = playerShip;
    }

    let hullData = this.playerShip.getHullData();
    this.grid.unpack(this.playerShip.power);

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
      reactorGraphics.beginFill(Assets.Colors.Systems[0], 0.66);
      reactorGraphics.drawRect(0, 0, this.parameters.width, reactorHeight);

      let reactorTexture = this.pixiApp.renderer.generateTexture(reactorGraphics);
      reactorGraphics.destroy();
      reactorTexture = new PIXI.Sprite(reactorTexture);
      reactorTexture.x = this.parameters.x;
      reactorTexture.y = this.parameters.y;
      reactorTexture.height = reactorHeight;
      reactorTexture.width = this.parameters.width;
      this.sprites.reactor.addChild(reactorTexture);

      // Draw boost multiplier on some sections
      let boostCols = this.grid.getBoostCols();
      let boostMultiplier = this.grid.getBoostMultiplier();
      for (let i = 0; i < boostCols.length; i++) {
        let boostLabel = new PIXI.Text("x"+boostMultiplier, {dropShadow: true, dropShadowDistance: 0,dropShadowAlpha: 0.66, dropShadowBlur: 3, dropShadowColor: Assets.Colors.White, fontSize: this.parameters.boostFontSize, fontFamily : Assets.Fonts.Mono, fill : Assets.Colors.Black, align : 'center' });
        boostLabel.anchor.set(0.5, 1);
        boostLabel.x = this.parameters.x + ((boostCols[i] + 0.5) * this.gridSquareSize);
        boostLabel.y = this.parameters.y + reactorHeight;
        this.sprites.reactor.addChild(boostLabel);
      }

      let reactorLabel = new PIXI.Text("REACTOR", {dropShadow: true, dropShadowDistance: 0,dropShadowAlpha: 0.66, dropShadowBlur: 8, dropShadowColor: Assets.Colors.White, fontSize: this.parameters.reactorFontSize, fontFamily : Assets.Fonts.Mono, fill : Assets.Colors.Black, align : 'center' });
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

    let systems = hullData.systems;
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
    for (let i = 0; i < gridSize[0]; i++) {

      // create or get row
      let row = this.sprites.grid[i] || [];

      // iterate cells in row and create/update sprites
      for (let j = 0; j < gridSize[1]; j++) {

        // if we haven't yet got that sprite create it
        if (!row[j]) {
          let cell = new PIXI.AnimatedSprite(powerlinesSheet.animations['all']);
          cell.width = this.gridSquareSize;
          cell.height = this.gridSquareSize;
          cell.anchor.set(0, 0);
          cell.x = this.parameters.x + (j * this.gridSquareSize);
          cell.y = this.gridTop + (i * this.gridSquareSize);
          cell.interactive = true;
          cell.on('mousedown', (e) => { this.cellClick(i, j, e) });
          cell.on('touchstart', (e) => { this.cellClick(i, j, e) });
          this.sprites.powergridContainer.addChild(cell);
          row[j] = cell;
        }

        // set animation state
        row[j].gotoAndStop(this.grid.getConnector(i, j));

      }
      this.sprites.grid[i] = row;
    }
  }

  // toggle the cell state, updating server each time
  cellClick(row, col, event) {

    let currentState = this.grid.getConnector(row, col);
    if (currentState != 0) {

      let shiftKey = event.data.originalEvent.shiftKey;

      let newState = currentState;

      if (shiftKey) {
        newState = (newState - 1);
        if (newState == 0) newState = 7;
      } else {
        newState = (newState + 1) % 8;
      if (newState == 0) newState = 1;
      }

      this.renderer.playSound('click');

      if (this.renderer.client) {
        this.renderer.client.setPowerCell(row, col, newState);
      }
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

    let systemHeight = (this.parameters.x + this.parameters.height) - this.gridBottom;
    systemHeight = Math.max(systemHeight, 180);
    let systemTop = (this.parameters.y + this.parameters.height) - systemHeight;

    if (!this.sprites.systems[currentSystem]) {
      let sysSprite = new PIXI.Container();
      sysSprite.zIndex = this.parameters.internalZIndex.system;

      let systemGraphics = new PIXI.Graphics();
      systemGraphics.beginFill(Assets.Colors.Systems[currentSystem], 0.66);
      systemGraphics.drawRect(0, 0, this.gridSquareSize * systemSize, systemHeight);

      let systemTexture = this.pixiApp.renderer.generateTexture(systemGraphics);
      systemGraphics.destroy();
      systemTexture = new PIXI.Sprite(systemTexture);
      systemTexture.x = this.parameters.x + (this.gridSquareSize * systemStart);
      systemTexture.y = systemTop;
      systemTexture.height = systemHeight;
      systemTexture.width = this.gridSquareSize * systemSize;
      this.sprites.reactor.addChild(systemTexture);

      let systemLabel = new PIXI.Text(this.grid.getSystemName(currentSystem), {dropShadow: true, dropShadowDistance: 0,dropShadowAlpha: 0.66, dropShadowBlur: 3, dropShadowColor: Assets.Colors.White, fontSize: this.parameters.systemFontSize, fontFamily : Assets.Fonts.Mono, fill : Assets.Colors.Black, align : 'center' });
      systemLabel.anchor.set(0, 0.5);
      systemLabel.pivot.set(0.5);
      systemLabel.angle = -90;
      systemLabel.x = this.parameters.x + (this.gridSquareSize * systemStart) + (this.gridSquareSize * systemSize * 0.5);
      systemLabel.y = systemTop + (systemHeight - 30);
      this.sprites.reactor.addChild(systemLabel);

      this.gridContainer.addChild(sysSprite);

      this.sprites.systems[currentSystem] = sysSprite;

    } else {
      // sprite exists but potentially changed - for now do nothing, need to change here if
      // ships can change systems eg. upgrade at station

      // check efficiency of existing system
      let efficiency = Math.round(this.grid.getEfficiency(currentSystem) * 100) + "%";
      let efficiencyKey = 'eff'+currentSystem;
      if (!this.sprites.systems[efficiencyKey]) {

        let efficiencyLabel = new PIXI.Text(efficiency, {dropShadow: true, dropShadowDistance: 0,dropShadowAlpha: 0.66, dropShadowBlur: 3, dropShadowColor: Assets.Colors.White, fontSize: this.parameters.systemEfficiencyFontSize, fontFamily : Assets.Fonts.Mono, fill : Assets.Colors.Black, align : 'center' });
        efficiencyLabel.anchor.set(0.5, 1);
        efficiencyLabel.x = this.parameters.x + (this.gridSquareSize * systemStart) + (this.gridSquareSize * systemSize * 0.5);
        efficiencyLabel.y = this.parameters.x + this.parameters.height;
        this.sprites.reactor.addChild(efficiencyLabel);
        this.sprites.systems[efficiencyKey] = efficiencyLabel;
      } else {
        this.sprites.systems[efficiencyKey].text = efficiency;
      }
    }
  }



}
