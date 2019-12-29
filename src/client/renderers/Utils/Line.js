const PIXI = require('pixi.js');
export default class Line extends PIXI.Graphics {

    constructor(points, lineSize, lineColor, alpha, native) {
        super();

        var s = this.lineWidth = lineSize || 5;
        var c = this.lineColor = lineColor || "0x000000";
        var a = this.alpha = alpha || 1;
        var n = native || false;

        this.points = points;

        this.lineStyle({
            width: s,
            color: c,
            alpha: a,
            native: n
        });

        this.moveTo(points[0], points[1]);
        this.lineTo(points[2], points[3]);
    }

    updatePoints(p) {

        var points = this.points = p.map((val, index) => val || this.points[index]);

        var s = this.lineWidth, c = this.lineColor;

        this.clear();
        this.lineStyle(s, c);
        this.moveTo(points[0], points[1]);
        this.lineTo(points[2], points[3]);
    }
}