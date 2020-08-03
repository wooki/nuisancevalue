import HudData from './HudData';
import Victor from 'victor';
import Assets from '../Utils/images.js';
import {h, createProjector} from 'maquette';

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
            this.renderer.updateSharedState({
          		focus: "player"
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: 26,
          width: 26
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.updateSharedState({
            		selection: playerShip
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: 26,
          width: 26
        }, [])])
      ];

    } else if (item.type == "gravity") {
      let gravityObjectId = item.source.id;
      return [
        h("button", {
          key: "navdata-action-focus"+index,
          onclick: (event) => {
            this.renderer.updateSharedState({
          		focus: gravityObjectId
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: 26,
          width: 26
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.updateSharedState({
            		selection: item.source
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: 26,
          width: 26
        }, [])])
      ];

    } else if (item.type == "target") {
      let targetObject = item.source;

      return [
        h("button", {
          key: "navdata-action-focus"+index,
          onclick: (event) => {
            this.renderer.updateSharedState({
          		focus: item.source.id
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.focus,
          height: 26,
          width: 26
        }, [])]),
        h("button", {
          key: "navdata-action-select"+index,
          onclick: (event) => {
            this.renderer.updateSharedState({
            		selection: item.source
          	});
          }
        }, [h("img", {
          src: "./"+Assets.Images.select,
          height: 26,
          width: 26
        }, [])])
      ];

    } else if (item.type == "waypoint") {
      let waypoint = item.source;

      console.log("ACTIONS FOR WAYPOINT");

    }
    return false;
  }

}
