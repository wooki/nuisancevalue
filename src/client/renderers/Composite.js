// container for building the PIXI app and managing some high-level housekeeping
// and giving access to the PIXI app to a set if child "subrenderers"
const PIXI = require('pixi.js');

import KeyboardControls from './Utils/KeyboardControls.js';
import Assets from './Utils/images.js';
import UiUtils from './Utils/UiUtils';
import Ship from './../../common/Ship';

export default class CompositeRenderer {

    // create a PIXI app and add to the #game element, start load of resources
    constructor(gameEngine, clientEngine, config) {

      // remember params
      this.game = gameEngine;
      this.client = clientEngine;

      this.stationConfig = Object.assign({
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        dashboardColor: 0xCCCCCC,
        subRenderers: []
      }, config);
      this.subRenderers = this.stationConfig.subRenderers;

      this.keyboardControls = new KeyboardControls(clientEngine);
      this.loadedSprites = false;
      this.resources = null;
      this.uiWidth = window.innerWidth;
      this.uiHeight = window.innerHeight;
      this.serverObjects = {}; // list of in-game object keys that we keep track of
      this.sprites = {};  // keep track of any sprites we add
      this.sharedState = {}; // state that can be shared between subRenderers so one renderer can effect another

      // handle being destroyed at this level
      this.destroyed = false;
      this.backToLobby = false;
      this.leaveTimer = false;
      this.lastPlayerShip = null;
      this.isDocked = false;

      // container div and app refs
      this.el = null;
      this.pixiApp = null;
      this.pixiContainer = null;

      // create element to hold pixi app
      let root = document.getElementById('game');
    	root.innerHTML = '';
    	this.el = document.createElement('div');
      this.el.classList.add('renderer');
      this.el.classList.add('composite')
      root.append(this.el);

      // create pixie app and container
      this.pixiApp = new PIXI.Application({
          width: this.uiWidth,
          height: this.uiHeight,
          backgroundColor: Assets.Colors.Black,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
      });
      this.pixiApp.stage.sortableChildren = true;
      this.pixiContainer = new PIXI.Container();
      this.pixiContainer.sortableChildren = true;
      this.pixiContainer.zIndex = 1;
      this.pixiApp.stage.addChild(this.pixiContainer);
      this.el.append(this.pixiApp.view); // add to the page

      // prepare to load resources
      const loader = this.pixiApp.loader;
      this.assetCount = 0;
      this.assetLoadedCount = 0;
      loader.onProgress.add(() => {
        this.assetLoadedCount = this.assetLoadedCount + 1;
        // let percent = (100 / this.assetCount) * this.assetLoadedCount;
        this.loadingEl.innerHTML = "<div>Loading Assets "+this.assetLoadedCount+"/"+this.assetCount+"</div>";
      });
      loader.onComplete.add(() => {
        this.assetCount = 0;
        this.assetLoadedCount = 0;
        this.loadingEl.remove();
      });

      // load sprites
      this.assetCount = UiUtils.loadAllAssets(loader, this.stationConfig.baseUrl);

      this.loadingEl = document.createElement("div");
  		this.loadingEl.classList.add('ui-loading');
  		this.loadingEl.innerHTML = "<div>Loading Assets "+this.assetLoadedCount+"/"+this.assetCount+"</div>";
      this.el.append(this.loadingEl);

      // manage loading of resources
      loader.load(this.loadResources.bind(this));

      // listen for explosion events
      gameEngine.emitonoff.on('explosion', this.addExplosion.bind(this));
    }

    remove() {
      if (this.el) {
        this.el.remove();
        this.el = null;
      }
    }

    destroyPlayership(playerShip) {
      if (this.destroyed) return;
      this.destroyed = true;
      this.updatePlayerShip(playerShip, false, this.destroyed, 0);

      let root = document.getElementById('game');
      UiUtils.leaveTimer("YOU WERE DESTROYED", root).then(function() {
        this.backToLobby = true;
      }.bind(this));
    }

    loadResources(loader, resources) {

        this.loadedSprites = true;
        this.resources = resources;

        // UI create a texture to overlay on top of the background
        let dashboardGraphics = new PIXI.Graphics();
        dashboardGraphics.beginTextureFill({
            texture: resources[this.stationConfig.baseUrl+Assets.Images.dashboard].texture,
            color: this.stationConfig.dashboardColor,
            alpha: 1
        });
        dashboardGraphics.drawRect(0, 0, this.uiWidth, this.uiHeight);
        dashboardGraphics.endFill();
        let dashboardTexture = this.pixiApp.renderer.generateTexture(dashboardGraphics);
        dashboardGraphics.destroy();
        this.sprites.dashboardSprite = new PIXI.Sprite(dashboardTexture);
        this.sprites.dashboardSprite.anchor.set(0.5);
        this.sprites.dashboardSprite.x = Math.floor(this.uiWidth / 2);
        this.sprites.dashboardSprite.y = Math.floor(this.uiHeight / 2);
        this.sprites.dashboardSprite.width = this.uiWidth;
        this.sprites.dashboardSprite.height = this.uiHeight;
        this.pixiContainer.addChild(this.sprites.dashboardSprite);

        // initialise sub-renderers
        for (let i = 0; i < this.subRenderers.length; i++) {
          this.subRenderers[i].init(this.el, this.pixiApp, this.pixiContainer, this.resources, this);
        }
    }

    addExplosion(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].addExplosion) {
          this.subRenderers[i].addExplosion(obj, this);
        }
      }
    }

    addObject(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].addObject) {
          this.subRenderers[i].addObject(obj, this);
        }
      }
    }
    updateObject(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].updateObject) {
          this.subRenderers[i].updateObject(obj, this);
        }
      }
    }
    removeObject(key) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].removeObject) {
          this.subRenderers[i].removeObject(key, this);
        }
      }
    }
    updatePlayerShip(playerShip, isDocked, isDestroyed, dt) {

      this.lastPlayerShip = playerShip; // remember, so we still have the data when it is removed from game

      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].updatePlayerShip) {
          this.subRenderers[i].updatePlayerShip(playerShip, isDocked, this.isDestroyed, this, dt);
        }
      }
    }

    updateSharedState(newState) {
      this.sharedState = Object.assign(this.sharedState, newState);
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].updateSharedState) {
          this.subRenderers[i].updateSharedState(this.sharedState, this);
        }
      }
    }

    draw(t, dt) {

        if (this.loadedSprites) {

          // find the player ship first, so we can set objects positions relative to it
          let playerShip = null;
          let actualPlayerShip = null;
          let gameObjects = [];
          this.game.world.forEachObject((objId, obj) => {
              if (obj instanceof Ship) {
                  if (obj[this.stationConfig.stationProperty] == this.game.playerId) {
                      playerShip = obj;
                      actualPlayerShip = obj;
                      this.isDocked = false;
                  } else {

                      gameObjects.push(obj);
                  }
              } else {
                  gameObjects.push(obj);
              }
          });

          // check docked if we haven't found yet
          if (!playerShip) {
            this.game.world.forEachObject((objId, obj) => {
              if (obj instanceof Ship) {
                if (obj.docked && obj.docked.length > 0) {
                  let dockedMatch = obj.docked.find((dockedShip) => {
                    return (dockedShip[this.stationConfig.stationProperty] == this.game.playerId);
                  });
                  if (dockedMatch) {
                    this.isDocked = dockedMatch; // keep actual player ship available
                    actualPlayerShip = dockedMatch;
                    playerShip = obj;
                  }
                }
              }
            });
          }

          if (playerShip) {

            // keep track of our ship
            this.updatePlayerShip(playerShip, this.isDocked, false, dt);

            // keep track so we know when something is gone
            let foundObjects = {};

            // player has been excluded from this list already
            gameObjects.forEach((obj) => {

              // check if we have sensed (for types that need to be)
              let sensed = false;
              if (!obj.isSensedBy) {
                sensed = true;
              } else if (obj.sensedBy && obj.isSensedBy(actualPlayerShip.faction)) {
                sensed = true;
              }

              if (sensed) {
                // is this a new, or existing object?
                if (this.serverObjects[obj.id]) {
                  this.updateObject(obj);
                } else {
                  this.serverObjects[obj.id] = true;
                  this.addObject(obj);
                }

                // remember we had this one
                foundObjects[obj.id] = true;
              }
            });


            // remove any objects that we no-longer have
            Object.keys(this.serverObjects).forEach((key) => {
                if (!foundObjects[key]) {
                    delete this.serverObjects[key];
                    this.removeObject(key);
                }
            });

          } else {
            // must have been destroyed, keep original ship but flag as such
            if (this.lastPlayerShip) {
              playerShip = this.lastPlayerShip;
              this.destroyPlayership(playerShip);
            }
          } // playerShip

        }
        return this.backToLobby;
    }

}
