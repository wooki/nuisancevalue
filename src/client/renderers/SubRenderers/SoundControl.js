const PIXI = require('pixi.js');

import Victor from 'victor';
import UiUtils from '../Utils/UiUtils';
import Assets from '../Utils/assets.js';
import {Howl, Howler} from 'howler';

export default class SoundControl {

  constructor(params) {
    this.parameters = Object.assign({
      baseUrl: '/',
      spatialScale: 0.001,
      cannonReloadTime: 300, // minimum time between playing cannon sound
      volume: {
        cannon: 0.06,
        explosion: 1,
        collision: 1,
        torp: 0.5,
        engine: 0.05,
        theme: 0,
        // theme: 0.2
      }
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.resources = resources;
    this.renderer = renderer;
    this.game = renderer.game;

    this.isDestroyed = false;

    // check if we want sound
    let params = new URLSearchParams(document.location.search.substring(1));
    this.useSound = params.get("sound") == "on";

    if (this.useSound) {

      // prepare sounds

      // while testing - ignore theme
      this.theme = new Howl({
        src: Assets.Sounds.theme,
        volume: this.parameters.volume.theme,
        autoplay: true,
        loop: true
      });

      this.explosion = new Howl({
        src: Assets.Sounds.explosion,
        volume: this.parameters.volume.explosion
      });

      this.cannon = new Howl({
        src: Assets.Sounds.cannon,
        volume: this.parameters.volume.cannon
      });
      this.lastCannonPlayed = 0;

      this.engineLevel = 0;
      this.engine = new Howl({
        src: Assets.Sounds.engine,
        volume: this.engineLevel * this.parameters.volume.engine, // start at zero/off
        autoplay: true,
        loop: true
      });

      this.collision = new Howl({
        src: Assets.Sounds.collision,
        volume: this.parameters.volume.collision
      });

      this.torp = new Howl({
        src: Assets.Sounds.torp,
        volume: this.parameters.volume.torp
      });

      // click: 'assets/sounds/click.mp3',
  		// collision: 'assets/sounds/collision.mp3',
  		// torp: 'assets/sounds/torp.mp3',

      // listen for events
      this.game.emitonoff.on('explosion', this.playExplosion.bind(this));
      this.game.emitonoff.on('collision', this.playCollision.bind(this));
      this.game.emitonoff.on('torp', this.playTorp.bind(this));
    }
  }

  playExplosion(obj) {

    if (!this.useSound) return;
    if (this.isDestroyed) return;

    let x = Math.round(obj.physicsObj.position[0] * this.parameters.spatialScale);
    let y = Math.round(obj.physicsObj.position[1] * this.parameters.spatialScale);
    let z = 0;

    let i = this.explosion.play();
    this.explosion.pos(x, y, z, i);
  }

  playCollision(obj) {

    if (!this.useSound) return;
    if (this.isDestroyed) return;

    let x = Math.round(obj.physicsObj.position[0] * this.parameters.spatialScale);
    let y = Math.round(obj.physicsObj.position[1] * this.parameters.spatialScale);
    let z = 0;

    let i = this.collision.play();
    this.collision.pos(x, y, z, i);
  }

  playTorp(obj) {

    if (!this.useSound) return;
    if (this.isDestroyed) return;

    // keep track of any torps we play creation sound for and do not play again
    if (!this.playedTorps) this.playedTorps = {};
    if (this.playedTorps[obj.id]) return;
    this.playedTorps[obj.id] = true;

    let x = Math.round(obj.physicsObj.position[0] * this.parameters.spatialScale);
    let y = Math.round(obj.physicsObj.position[1] * this.parameters.spatialScale);
    let z = 0;

    let i = this.torp.play();
    this.torp.pos(x, y, z, i);
  }


  isDestroyed() {
      this.isDestroyed = true;

      if (!this.useSound) return;

      this.theme.stop();
      this.engine.stop();
      this.explosion.stop();
      this.cannon.stop();
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDestroyed) {
        this.isDestroyed = true;
    }

    if (!this.useSound) return;

    let actualPlayerShip = isDocked || playerShip;
    let hullData = playerShip.getPowerAdjustedHullData();

    // set the listener position
    let x = Math.round(playerShip.physicsObj.position[0] * this.parameters.spatialScale);
    let y = Math.round(playerShip.physicsObj.position[1] * this.parameters.spatialScale);
    let z = 0;
    Howler.pos(x, y, z);

    // work out which way we are facing
    let angle = UiUtils.adjustAngle(playerShip.physicsObj.angle);
    let facing = new Victor(0, 1);
    facing.rotate(angle).normalize();
    Howler.orientation(facing.x, facing.y, 0, 0, 0, 1)

    // Engine - ade from current volume to desired
    let newEngineLevel = actualPlayerShip.engine * this.parameters.volume.engine;
    if (newEngineLevel != this.engineLevel) {
      this.engine.fade(this.engineLevel, newEngineLevel, 500);
      this.engineLevel = newEngineLevel;
    }

    // if pdc firing
    this.lastCannonPlayed = this.lastCannonPlayed + dt;
    if (playerShip.pdcState == 2 && this.lastCannonPlayed >= this.parameters.cannonReloadTime) {
      this.lastCannonPlayed = 0;
      let cannonId = this.cannon.play();
      this.cannon.pos(x, y, z, cannonId);
    }
  }


}
