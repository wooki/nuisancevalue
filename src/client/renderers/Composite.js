// container for building the PIXI app and managing some high-level housekeeping
// and giving access to the PIXI app to a set if child "subrenderers"
const PIXI = require('pixi.js');

import KeyboardControls from './Utils/KeyboardControls.js';
import Assets from './Utils/images.js';
import UiUtils from './Utils/UiUtils';

import Ship from './../../common/Ship';

// TODO: move some of this to class below
let destroyed = false;
let backToLobby = false;
let leaveTimer = false;
let lastPlayerShip = null;
let el = null;
let game = null;
let client = null;
let pixiApp = null;
let pixiContainer = null;
let loadedSprites = false;
let resources = null;
let uiWidth = window.innerWidth;
let uiHeight = window.innerHeight;
let serverObjects = {}; // list of in-game object keys that we keep track of
let stationConfig = null;
let sprites = {};  // keep track of any sprites we add

export default class CompositeRenderer {

    // create a PIXI app and add to the #game element, start load of resources
    constructor(gameEngine, clientEngine, config) {
    	game = gameEngine;
      client = clientEngine;
      stationConfig = Object.assign({
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        dashboardColor: 0xCC0000,
        subRenderers: []
      }, config);

      this.subRenderers = [];

      // handle being destroyed at this level
      destroyed = false;
      backToLobby = false;
      leaveTimer = false;
      lastPlayerShip = null;

      // container div and app refs
      el = null;
      pixiApp = null;
      pixiContainer = null;

      let root = document.getElementById('game');
    	root.innerHTML = '';
    	el = document.createElement('div');
      root.append(el);

      // create pixie app and container
      pixiApp = new PIXI.Application({
          width: uiWidth,
          height: uiHeight,
          backgroundColor: Assets.Colors.Black,
          resolution: window.devicePixelRatio || 1
      });

      pixiApp.stage.sortableChildren = true;
      pixiContainer = new PIXI.Container();
      pixiContainer.sortableChildren = true;
      pixiContainer.zIndex = 1;
      pixiApp.stage.addChild(pixiContainer);
      el.append(pixiApp.view); // add to the page

      // prepare to load resources
      const loader = PIXI.Loader.shared;

      // load sprites
      UiUtils.loadAllAssets(pixiApp.loader, stationConfig.baseUrl);

      // manage loading of resources
      pixiApp.loader.load(this.loadResources.bind(this));
    }

    remove() {
      if (el) {
        el.remove();
        el = null;
      }
    }

    destroyed(playerShip) {
      if (dspritesestroyed) return;
      destroyed = true;
      this.updatePlayerShip(playerShip, false, destroyed);

      let root = document.getElementById('game');
      UiUtils.leaveTimer("YOU WERE DESTROYED", root).then(function() {
        backToLobby = true;
      });
    }

    loadResources(loader, resources) {

        loadedSprites = true;
        resources = resources;

        // UI create a texture to overlay on top of the background
        let dashboardGraphics = new PIXI.Graphics();
        // dashboardGraphics.beginFill(Assets.Colors.Dashboard, 1);
        dashboardGraphics.beginTextureFill({
            texture: resources[stationConfig.baseUrl+Assets.Images.dashboard].texture,
            color: stationConfig.dashboardColor,
            alpha: 1
        });
        dashboardGraphics.drawRect(0, 0, uiWidth, uiHeight);
        dashboardGraphics.endFill();
        let dashboardTexture = pixiApp.renderer.generateTexture(dashboardGraphics);
        dashboardGraphics.destroy();
        sprites.dashboardSprite = new PIXI.Sprite(dashboardTexture);
        sprites.dashboardSprite.anchor.set(0.5);
        sprites.dashboardSprite.x = Math.floor(uiWidth / 2);
        sprites.dashboardSprite.y = Math.floor(uiHeight / 2);
        sprites.dashboardSprite.width = uiWidth;
        sprites.dashboardSprite.height = uiHeight;
        pixiContainer.addChild(sprites.dashboardSprite);

        // initialise sub-renderers
        for (let i = 0; i < this.subRenderers.length; i++) {
          this.subRenderers[i].init(el, pixiContainer, resources, this);
        }
    }

    addObject(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        this.subRenderers[i].addObject(obj, this);
      }
    }
    updateObject(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        this.subRenderers[i].updateObject(obj, this);
      }
    }
    removeObject(key) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        this.subRenderers[i].removeObject(key, this);
      }
    }
    updatePlayerShip(playerShip, isDocked, isDestroyed) {

      lastPlayerShip = playerShip; // remember, so we still have the data when it is removed from game

      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        this.subRenderers[i].updatePlayerShip(playerShip, isDocked, isDestroyed);
      }
    }

    draw(t, dt) {

        if (loadedSprites) {

          // keep track of all objects we have - so we can remove missing ones later
          let serverObjects = {};

          // find the player ship first, so we can set objects positions relative to it
          let playerShip = null;
          let isDocked = false;
          let gameObjects = [];
          game.world.forEachObject((objId, obj) => {
              if (obj instanceof Ship) {
                  if (obj[stationConfig.stationProperty] == game.playerId) {
                      playerShip = obj;
                  } else {

                      gameObjects.push(obj);
                  }
              } else {
                  gameObjects.push(obj);
              }
          });

          // check docked if we haven't found yet
          if (!playerShip) {
            game.world.forEachObject((objId, obj) => {
              if (obj instanceof Ship) {
                if (obj.docked && obj.docked.length > 0) {
                  let dockedMatch = obj.docked.find(function(dockedShip) {
                    return (dockedShip[stationConfig.stationProperty] == game.playerId);
                  });
                  if (dockedMatch) {
                    isDocked = true;
                    playerShip = obj;
                    gameObjects = gameObjects.filter(function(mothership) {
                      return (mothership.id != obj.id);
                    });
                  }
                }
              }
            });
          }

          if (playerShip) {

            // keep track of our ship
            this.updatePlayerShip(playerShip, isDocked, false);

            // keep track so we know when something is gone
            let foundObjects = {};

            // player has been excluded from this list already
            gameObjects.forEach((obj) => {
              // is this a new, or existing object?
              if (serverObjects[obj.id]) {
                this.updateObject(obj);
              } else {
                this.addObject(obj);
              }

              // remember we had this one
              foundObjects[obj.id] = true;
            });


            // remove any objects that we no-longer have
            Object.keys(serverObjects).forEach((key) => {
                if (!foundObjects[key]) {
                    this.removeObject(key);
                }
            });

          } else {
            // must have been destroyed, keep original ship but flag as such
            playerShip = lastPlayerShip;
            this.destroyed(playerShip);
          } // playerShip

        }
        return backToLobby;
    }

}
