// keeps track of a bunch of moving elements

const PIXI = require('pixi.js');

export default class HelmPathUi extends PIXI.Graphics {

    constructor(params) {
        super();

        this.params = Object.assign({ uiSize: 1000, uiWidth: 1000, uiHeight:
        1000, scale: 1, alpha: 1, zIndex: 1, paths: [] }, params);

        this.draw();
    }

    draw() {

    	this.clear();
        this.zIndex = this.params.zIndex;
        this.width = this.params.uiWidth;
        this.height = this.params.uiHeight;
        let smallestDimension = this.params.uiWidth;
        if (this.params.uiHeight < smallestDimension) {
          smallestDimension = this.params.uiHeight;
        }
        this.anchor = 0.5;
        this.x = (this.params.uiWidth / 2);
        this.y = (this.params.uiHeight / 2);
        this.alpha = this.params.alpha;

        if (this.paths) {
          this.paths.forEach((path) => {
            if (path) {
              this.moveTo();
              path.points.forEach((p, i) => {
                  let color = path.color1 || path.color;
                  let alpha = 0.4;
                  if (Math.floor((i-2)/10) % 2 > 0) { // adjust back two for the colour so last one is 59th
                    color = path.color2 || path.color;
                    alpha = 0.2;
                  }
                  this.lineStyle({
                    width: 1,
                    color: color,
                    alpha: alpha,
                    alignment: 0.5
                  });
                  this.lineTo(p.x - this.x, p.y - this.y); // adjust for anchor of HelmPathUi
              });
            }
          });
        }

    }

    update(paths) {

        this.paths = paths;
        this.draw();
    }
}
