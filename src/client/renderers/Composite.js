// container for building the PIXI app and managing some high-level housekeeping
// and giving access to the PIXI app to a set if child "subrenderers"
const PIXI = require('pixi.js');

import KeyboardControls from './Utils/KeyboardControls.js';
import Assets from './Utils/assets.js';
import UiUtils from './Utils/UiUtils';
import Ship from './../../common/Ship';
import EmitOnOff from 'emitonoff';

export default class CompositeRenderer {

    // create a PIXI app and add to the #game element, start load of resources
    constructor(gameEngine, clientEngine, config) {

      // check if we want admin controls
      let params = new URLSearchParams(document.location.search.substring(1));
      this.isDebug = (params.get("debug") == "1");

      // remember params
      this.game = gameEngine;
      this.client = clientEngine;

      this.stationConfig = Object.assign({
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        dashboardColor: Assets.Colors.Dashboard,
        subRenderers: []
      }, config);
      this.subRenderers = this.stationConfig.subRenderers;

      this.emitonoff = EmitOnOff();
      this.keyboardControls = new KeyboardControls(clientEngine, this);
      this.loadedSprites = false;
      this.resources = null;
      this.uiWidth = window.innerWidth;
      this.uiHeight = window.innerHeight;
      this.serverObjects = {}; // list of in-game object keys that we keep track of
      this.allServerObjects = {}; // list of ALL in-game object keys that we keep track of, this includes out of range ones
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
      // this.el.addEventListener('contextmenu', (e) => {
      //   e.preventDefault(); // prevent context menu
      // });
      root.append(this.el);

      // create pixie app and container
      this.pixiApp = new PIXI.Application({
          width: this.uiWidth,
          height: this.uiHeight,
          backgroundColor: Assets.Colors.Black,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: true
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

    playSound(name, action) {
      this.emitonoff.emit('sound', name, action);
    }
    startSound(name) {
      this.emitonoff.emit('startSound', name);
    }
    stopSound(name) {
      this.emitonoff.emit('stopSound', name);
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

      let message = "YOU WERE DESTROYED";
      if (playerShip.oxygen <= 0) {
        message = "YOU RAN OUT OF OXYGEN";
      }

      let root = document.getElementById('game');
      UiUtils.leaveTimer(message, root).then(function(el) {
        el.remove();
        this.backToLobby = true;
      }.bind(this));
    }

    loadResources(loader, resources) {

        this.loadedSprites = true;
        this.resources = resources;

        // UI create a texture to overlay on top of the background
        let dashboardGraphics = new PIXI.Graphics();
        let background = resources[this.stationConfig.baseUrl+Assets.Images.dashboard].texture;
        let backgroundScale = this.uiHeight / background.height;
        let newBackgroundWidth = background.width * backgroundScale;
        let backgroundOffsetX = (this.uiWidth/2) - (newBackgroundWidth/2);
        let backgroundMatrix = new PIXI.Matrix(backgroundScale, 0, 0, backgroundScale, backgroundOffsetX, 0);

        dashboardGraphics.beginTextureFill({
            texture: background,
            color: this.stationConfig.dashboardColor,
            alpha: 1,
            matrix: backgroundMatrix
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
    everyObject(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].everyObject) {
          this.subRenderers[i].everyObject(obj, this);
        }
      }
    }
    everyRemoveObject(obj) {
      // notify subrenderers
      for (let i = 0; i < this.subRenderers.length; i++) {
        if (this.subRenderers[i].everyRemoveObject) {
          this.subRenderers[i].everyRemoveObject(obj, this);
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
          this.subRenderers[i].updatePlayerShip(playerShip, isDocked, isDestroyed, this, dt);
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
            let allObjects = {};
            let sensedObjects = {};

            // player has been excluded from this list already
            gameObjects.forEach((obj) => {

              // some stations require every object
              this.everyObject(obj, this);
              this.allServerObjects[obj.id] = true;
              allObjects[obj.id] = true;

              // check if we have sensed (for types that need to be)
              let sensed = this.isDebug;
              if (!obj.isSensedBy) {
                sensed = true; // objects that don't have this are always visible (ie planets and PDCs)
              } else if (obj.sensedBy && obj.isSensedBy(actualPlayerShip.faction)) {
                sensed = true;
              }

              // check we have scanned (of possible)
              let scanned = false;
              if (obj.isScannedBy) {
                scanned = obj.isScannedBy(actualPlayerShip.faction);
              }

              // show sensed or scanned objects only
              if (sensed || scanned) {
                // is this a new, or existing object?
                if (this.serverObjects[obj.id]) {
                  this.updateObject(obj);
                } else {
                  this.serverObjects[obj.id] = true;
                  this.addObject(obj);
                }

                // remember we had this one
                sensedObjects[obj.id] = true;
              }

            });


            // remove any objects that we no-longer have
            Object.keys(this.serverObjects).forEach((key) => {
              if (!sensedObjects[key]) {
                  delete this.serverObjects[key];
                  this.removeObject(key);
              }
            });

            Object.keys(this.allServerObjects).forEach((key) => {
              if (!allObjects[key]) {
                  delete this.allServerObjects[key];
                  this.everyRemoveObject(key);
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
