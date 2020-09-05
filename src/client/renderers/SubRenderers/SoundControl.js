const PIXI = require('pixi.js');
import Assets from '../Utils/images.js';
import {Howl, Howler} from 'howler';

export default class SoundControl {

  constructor(params) {
    this.parameters = Object.assign({
      baseUrl: '/',
      volume: {
        explosion: 1
      }
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.resources = resources;
    this.renderer = renderer;
    this.game = renderer.game;

    // prepare sounds
    this.explosion = new Howl({
      src: Assets.Sounds.explosion,
      volume: this.parameters.volume.explosion
    });

    // listen for events
    // game.emitonoff.emit('explosion', torpedo);
    this.game.emitonoff.on('explosion', this.playExplosion.bind(this));
  }

  playExplosion() {
    this.explosion.play();
  }


}
