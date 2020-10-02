import HudData from './HudData';
import Victor from 'victor';
import Assets from '../Utils/assets.js';
import {h, createProjector} from 'maquette';

const actionImageHeight = 18;

// extends a HudData SubRenderer to provide
// actions for various for data items
export default class NavData extends HudData {

  constructor(params) {
    super(params);
  }

  createItemActions(item, index) {

    if (item.type == "heading") {
      let playerShip = item.source;
      return [
        h("button", {
          key: "navdata-action-focus"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
          		focus: "player"
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
            		selection: playerShip
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])])
      ];

    } else if (item.type == "gravity") {
      let gravityObjectId = item.source.id;
      return [
        h("button", {
          key: "navdata-action-focus"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
          		focus: gravityObjectId
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
            		selection: item.source
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])])
      ];

    } else if (item.type == "target") {
      let targetObject = item.source;

      return [
        h("button", {
          key: "navdata-action-focus"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
          		focus: item.source.id
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
            		selection: item.source
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])])
      ];

    } else if (item.type == "waypoint") {
      let waypoint = item.source;

      return [
        h("button", {
          key: "navdata-action-focus"+index,
          onclick: (event) => {
            this.renderer.updateSharedState({
              focus: waypoint.objId
            });
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.playSound('click');
            this.renderer.updateSharedState({
                selection: waypoint.obj
            });
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: actionImageHeight,
          width: actionImageHeight
        }, [])])
      ];

    }
    return false;
  }

}
