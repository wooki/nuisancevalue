// draws circles centred on the player ship indicating their hulls visual and sensor ranges

const PIXI = require('pixi.js');

export default class MapSensorRangeUi extends PIXI.Graphics {

    constructor(params) {
        super();

        this.params = Object.assign({
          uiSize: 1000,
          uiWidth: 1000,
          uiHeight: 1000,
          scale: 1,
          alpha: 1,
          zIndex: 1,
          ranges: [], // {x: 0, y: 0, radius: 0, color: 0xff0000, alpha: 0.5}
        }, params);

        this.paths = this.params.paths;

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
        this.alpha = this.params.alpha;

        if (this.ranges) {
          this.ranges.forEach((range) => {
            if (range) {
              this.beginFill(range.color, range.alpha);
              this.drawCircle(range.x - this.x, range.y - this.y, range.radius);
              this.endFill();
            }
          });
        }

    }

    update(ranges) {

        this.ranges = ranges;
        this.draw();
    }
}
