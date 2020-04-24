// keeps track of a bunch of moving elements

const PIXI = require('pixi.js');

export default class HelmUi extends PIXI.Graphics {

    constructor(params) {
        super();

        this.params = Object.assign({ uiSize: 1000, uiWidth: 1000, uiHeight:
        1000, scale: 1, bearing: null, course: null, angularVelocity: null,
        gravity: null, alpha: 1, zIndex: 1, waypoints: [], path: [] }, params);

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

        if (this.angularVelocity) {
            let angularPos = this.angularVelocity > 0 ? this.angularVelocity : 0;
            let angularNeg = this.angularVelocity < 0 ? this.angularVelocity : 0;
            this.lineStyle(3, 0xFF0000, 0.3);
            this.arc(0, 0,
                     (smallestDimension / 2) - 5,
                     this.bearing + (angularNeg / Math.PI), this.bearing + (angularPos / Math.PI));
        }

        if (this.bearing) {
          this.moveTo();
          this.lineStyle(5, 0xFF0000, 1);
            this.arc(0, 0,
                     (smallestDimension / 2) - 5,
                     this.bearing - 0.02, this.bearing + 0.02);
        }

        if (this.course) {
            this.moveTo();
            this.lineStyle(5, 0x00FF00, 1);
            this.arc(0, 0,
                     (smallestDimension / 2) - 5,
                     this.course - 0.02, this.course + 0.02);
        }

        if (this.gravity) {
            this.moveTo();
            this.lineStyle(5, 0x0000FF, 1);
            this.arc(0, 0,
                     (smallestDimension / 2) - 5,
                     this.gravity - 0.02, this.gravity + 0.02);
        }

        if (this.waypoints) {
            this.waypoints.forEach((waypoint) => {
                this.moveTo();
                this.lineStyle(5, 0xFFFF00, 1);
                this.arc(0, 0,
                         (smallestDimension / 2) - 5,
                         waypoint.bearing - 0.02, waypoint.bearing + 0.02);
            });
        }

        // if (this.path) {
        //   this.moveTo();
        //   this.lineStyle(1, 0x00FF00, 1);
        //   this.path.forEach((p) => {
        //       this.lineTo(p.x - this.x, p.y - this.y); // adjust for anchor of HelmUi
        //   });
        // }

    }

    update(bearing, course, gravity, waypoints, angularVelocity, path) {

        this.bearing = bearing % (2 * Math.PI);
		    this.course = course  % (2 * Math.PI);
        this.gravity = gravity  % (2 * Math.PI);
        this.angularVelocity = angularVelocity;
        this.waypoints = waypoints;
        this.path = path;

        this.draw();
    }
}
