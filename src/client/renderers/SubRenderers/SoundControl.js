const PIXI = require('pixi.js');
import Assets from '../Utils/images.js';
import {Howl, Howler} from 'howler';

export default class SoundControl {

  constructor(params) {
    this.parameters = Object.assign({
      baseUrl: '/',
      volume: {
        explosion: 1,
        theme: 0.2
      }
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.resources = resources;
    this.renderer = renderer;
    this.game = renderer.game;

    // prepare sounds

    // while testing - ignore theme
    // this.theme = new Howl({
    //   src: Assets.Sounds.theme,
    //   volume: this.parameters.volume.theme,
    //   autoplay: true,
    //   loop: true
    // });

    this.explosion = new Howl({
      src: Assets.Sounds.explosion,
      volume: this.parameters.volume.explosion
    });

    // listen for events
    // game.emitonoff.emit('explosion', torpedo);
    this.game.emitonoff.on('explosion', this.playExplosion.bind(this));
  }

  playExplosion() {
    let i = this.explosion.play();
    console.log("i:"+i);
    if (Math.random() > 0.5) {
      console.log("set pos");
      this.explosion.pos(100, 0, 0, i);
    }
  }


}
