const PIXI = require('pixi.js');
import Assets from '../Utils/assets.js';
import {Howl, Howler} from 'howler';

export default class SoundControl {

  constructor(params) {
    this.parameters = Object.assign({
      baseUrl: '/',
      spatialScale: 0.001,
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

  playExplosion(obj) {

    let x = obj.physicsObj.position[0] * this.parameters.spatialScale;
    let y = obj.physicsObj.position[1] * this.parameters.spatialScale;
    let z = 0;

    let i = this.explosion.play();
    this.explosion.pos(x, y, z, i);
  }

  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {

    // this.playerShip = playerShip;

    let x = playerShip.physicsObj.position[0] * this.parameters.spatialScale;
    let y = playerShip.physicsObj.position[1] * this.parameters.spatialScale;
    let z = 0;

    // set the listener position
    Howler.pos(x, y, z);
  }


}
