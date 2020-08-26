// draws circles centred on the player ship indicating their hulls visual and sensor ranges
const PIXI = require('pixi.js');

import {AlphaFilter} from '@pixi/filter-alpha';

export default class MapSensorRangeUi extends PIXI.Graphics {

    constructor(params) {
        super();

        this.params = Object.assign({
          uiSize: 1000,
          uiWidth: 1000,
          uiHeight: 1000,
          scale: 1,
          alpha: 0.2,
          zIndex: 1,
          color: 0xFFFFFF,
          ranges: [], // array of ranges,  {x: 0, y: 0, radius: 0}
        }, params);

        let filter = new AlphaFilter();
        filter.alpha = this.params.alpha;
        this.filters = [filter];

        this.ranges = this.params.ranges;

        this.draw();
    }

    draw() {

    	this.clear();
        this.zIndex = this.params.zIndex;
        this.width = this.params.uiWidth;
        this.height = this.params.uiHeight;
        this.anchor = 0.5;
        this.x = (this.params.uiWidth / 2);
        this.y = (this.params.uiHeight / 2);

        // this doesn't work - each circle drawn overlaps and combines, we need
        // to set a filter instead (done in constructor)
        // this.alpha = this.params.alpha;

        if (this.ranges && this.ranges.length > 0) {

          this.beginFill(this.params.color);

          for (let i = 0; i < this.ranges.length; i++) {
            if (this.ranges[i]) {
              this.drawCircle(this.ranges[i].x - this.x, this.ranges[i].y - this.y, this.ranges[i].radius);
            }
          }

          this.endFill();

        }

    }

    update(ranges) {

        this.ranges = ranges;
        this.draw();
    }
}
