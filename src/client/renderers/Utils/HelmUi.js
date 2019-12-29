// keeps track of a bunch of moving elements

const PIXI = require('pixi.js');

export default class HelmUi extends PIXI.Graphics {

    constructor(params) {
        super();

        this.params = Object.assign({
        	uiSize: 1000,
            uiWidth: 1000,
            uiHeight: 1000,
        	scale: 1,
        	bearing: null,
        	course: null,
            gravity: null,
            alpha: 1,
            zIndex: 1
        }, params);

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

        if (this.bearing) {
            this.lineStyle(5, 0xFF0000, 1);
            this.arc(0, 0,
                     (this.params.uiHeight / 2) - 5,
                     this.bearing - 0.02, this.bearing + 0.02);
        }

        if (this.course) {
            this.moveTo();
            this.lineStyle(5, 0x00FF00, 1);
            this.arc(0, 0,
                     (this.params.uiHeight / 2) - 5,
                     this.course - 0.02, this.course + 0.02);
        }

        if (this.gravity) {
            this.moveTo();
            this.lineStyle(5, 0x0000FF, 1);
            this.arc(0, 0,
                     (this.params.uiHeight / 2) - 5,
                     this.gravity - 0.02, this.gravity + 0.02);
        }

    }

    update(bearing, course, gravity) {

        this.bearing = (bearing + (0.5 * Math.PI)) % (2 * Math.PI);
		this.course = course  % (2 * Math.PI);
        this.gravity = gravity  % (2 * Math.PI);

        this.draw();
    }
}