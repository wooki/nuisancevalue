import HudData from './HudData';
import Victor from 'victor';
import Assets from '../Utils/assets.js';
import {h, createProjector} from 'maquette';

export default class SignalsData extends HudData {

  constructor(params) {
    super(params);
    this.scanningId = null;
    this.scanTotalTime = 1000 * 4; // load takes 6 seconds
  }

  startScan(obj) {
    this.scanObj = obj;
    this.scanningId = obj.id;
    this.timeToScan = this.scanTotalTime;

    // TODO: start scanning sound
    // this.renderer.playSound('click');
  }

  stopScan() {
    this.scanningId = null;
    this.timeToScan = 0;
    this.scanObj = null;

    // TODO: end scanning sound
    // this.renderer.playSound('click');
  }

  // update progress per frame
  updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt) {
    super.updatePlayerShip(playerShip, isDocked, isDestroyed, renderer, dt);

    let actualPlayerShip = isDocked || playerShip;

    // update the timer
    if (this.scanObj && this.scanningId == actualPlayerShip.targetId) {
      this.timeToScan = this.timeToScan - dt;

      if (this.timeToScan <= 0) {

        // do the scan
        if (this.renderer.client) {
          this.renderer.client.scan(this.scanningId);
        }

        this.stopScan();
      }
    }

  }

  createItemActions(item, index) {

    if (item.type == "target" && item.scanned == 'No') {
      let targetObject = item.source;

      let content = [];
      let activeScan = false;

      // if we aren't currently scanning then add scan button
      if (this.scanningId == null || (this.scanningId != targetObject.id)) {

        this.stopScan();

        // scan button
        content.push(h("button", {
          key: "signaldata-action-scan"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.startScan(targetObject);
          }
        }, [h("img", {
          src: "./"+Assets.Images.scan,
          height: 26,
          width: 26
        }, [])]));

      } else if (this.scanningId == targetObject.id) {
        // if we're scanning the current target then draw a scan image

        let width = Math.round(100 * ((this.scanTotalTime - this.timeToScan) / this.scanTotalTime));
        activeScan = true;

        content.push(h("img", {
          src: "./"+Assets.Images.scanAnimation,
          height: 30,
          width: width + '%'
        }, []));

      }

      // output an element containing the img or button
      return [
        h("div.scan", {
          classes: {
            active: activeScan
          },
          key: "signaldata-action-container"+index
        }, content)
      ];

    }
    return false;
  }

}
