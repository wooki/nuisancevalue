const PIXI = require('pixi.js');

import Victor from 'victor';
import UiUtils from '../Utils/UiUtils';
import Assets from '../Utils/assets.js';
import {Howl, Howler} from 'howler';

// play sounds for this station only - such as clicks and alerts
// checks URL param for sound=local or sound=on
export default class GlobalSound {

  constructor(params) {
    this.parameters = Object.assign({
      baseUrl: '/',
      spatialScale: 0.001,
      volume: {
        click: 1,
        scan: 1,
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
    this.useSound = (params.get("sound") == "local" || params.get("sound") == "on");

    if (this.useSound) {

      // prepare sounds
      this.sounds = {};

      this.sounds['click'] = new Howl({
        src: Assets.Sounds.click,
        volume: this.parameters.volume.click
      });

      // this.engine = new Howl({
      //   src: Assets.Sounds.engine,
      //   volume: this.engineLevel * this.parameters.volume.engine, // start at zero/off
      //   loop: true
      // });
      //
      // // listen for sound effects
      renderer.emitonoff.on('sound', this.playSound.bind(this));
    }
  }

  playSound(name, action) {

    if (!this.useSound) return;
    if (this.isDestroyed) return;

    // keyboard shortcuts all appear here with action as well, for now just send click
    if (name == "keyboard") {
      let i = this.sounds['click'].play();      
    } else if (this.sounds[name]) {
      let i = this.sounds[name].play();
    }
  }

  isDestroyed() {
      this.isDestroyed = true;

      if (!this.useSound) return;

      this.click.stop();
      // this.explosion.stop();
      // this.cannon.stop();
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    if (isDestroyed) {
        this.isDestroyed = true;
    }

    if (!this.useSound) return;
  }


}
