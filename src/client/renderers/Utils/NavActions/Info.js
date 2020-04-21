import Ship from '../../../../common/Ship';
import Asteroid from '../../../../common/Asteroid';
import Planet from '../../../../common/Planet';
import SolarObjects from '../../../../common/SolarObjects';
import Victor from 'victor';
import Hulls from '../../../../common/Hulls';

export default class Info {

    constructor(c, navCom) {
        this.command = c;
        this.navCom = navCom;
    }

    execute(log, aliases, settings, nav, game) {

        let obj = null;
        if (!(aliases[this.command.parameters.alias] === null)) {
            obj = game.world.queryObject({id: parseInt(aliases[this.command.parameters.alias])})
        }
        if (obj) {

            nav.navComSavedData = this.command.parameters.alias;

            if (obj instanceof Ship) {
                log.innerHTML = log.innerHTML + "\nDesignation: Ship";
            } else if (obj instanceof Planet) {
                log.innerHTML = log.innerHTML + "\nDesignation: Planet";
            } else if (obj instanceof Asteroid) {
                log.innerHTML = log.innerHTML + "\nDesignation: Asteroid";
            }

            // vector of objectc
            let v = new Victor(obj.physicsObj.velocity[0], 0 - obj.physicsObj.velocity[1]);

            log.innerHTML = log.innerHTML + "\nMass: " + obj.physicsObj.mass.toPrecision(3) + SolarObjects.units.mass;
            log.innerHTML = log.innerHTML + "\nHeading: " + ((Math.round(v.verticalAngleDeg()) + 360) % 360) + "°";
            log.innerHTML = log.innerHTML + "\nSpeed: " + Math.round(v.magnitude()) + SolarObjects.units.speed;
            log.innerHTML = log.innerHTML + "\nRadius: " + Math.round(obj.size / 2) + SolarObjects.units.distance;

            // bearing & distance
            let us = game.world.queryObject({id: parseInt(aliases['self'])})
            if (us && us.id != obj.id) {

                let ourPos = Victor.fromArray(us.physicsObj.position);
                let theirPos = Victor.fromArray(obj.physicsObj.position);
                let direction = theirPos.clone().subtract(ourPos);
                direction = new Victor(direction.x, 0 - direction.y);

                log.innerHTML = log.innerHTML + "\nBearing: " + ((Math.round(direction.verticalAngleDeg()) + 360) % 360) + "°";
                // log.innerHTML = log.innerHTML + "\nDistance: " + direction.magnitude().toPrecision(3) + SolarObjects.units.distance;
                // log.innerHTML = log.innerHTML + "\nDistance: " + direction.magnitude().toPrecision(6) + SolarObjects.units.distance;
                log.innerHTML = log.innerHTML + "\nDistance: " + Math.round(direction.magnitude()).toLocaleString() + SolarObjects.units.distance;


                if (obj instanceof Planet) {
                    let g = Math.round(((SolarObjects.constants.G * obj.physicsObj.mass) / Math.pow((obj.size / 2), 2)) * 100) / 100;
                    log.innerHTML = log.innerHTML + "\nSurface G: " + g + SolarObjects.units.force;
                }

                // closing speed
                // https://gamedev.stackexchange.com/questions/118162/how-to-calculate-the-closing-speed-of-two-objects
                // val tmp = a.position - b.position
                // return -((a.velocity - b.velocity).dot(tmp)/tmp.length)
                let ourVelocity = new Victor(us.physicsObj.velocity[0], 0 - us.physicsObj.velocity[1]);
                let closing = ((ourVelocity.clone().subtract(v)).dot(direction) / direction.length());
                log.innerHTML = log.innerHTML + "\nClosing: " + closing.toPrecision(3) + SolarObjects.units.speed;

            } else {
              // it is us - show grid info and more
              let hullData = Hulls[us.hull];

              let accn1 = (hullData.thrust / hullData.mass);
              let accn2 = (hullData.thrust*2 / hullData.mass);
              let accn3 = (hullData.thrust*3 / hullData.mass);
              let accn4 = (hullData.thrust*4 / hullData.mass);
              let accn5 = (hullData.thrust*5 / hullData.mass);
              let timeTo1000 = (1000 / accn5);

              log.innerHTML = log.innerHTML + "\nHull: " + hullData.name;
              log.innerHTML = log.innerHTML + "\nEngine 1: "+ accn1.toFixed(3) + SolarObjects.units.speed+'/s';
              log.innerHTML = log.innerHTML + "\nEngine 2: "+ accn2.toFixed(3) + SolarObjects.units.speed+'/s';
              log.innerHTML = log.innerHTML + "\nEngine 3: "+ accn3.toFixed(3) + SolarObjects.units.speed+'/s';
              log.innerHTML = log.innerHTML + "\nEngine 4: "+ accn4.toFixed(3) + SolarObjects.units.speed+'/s';
              log.innerHTML = log.innerHTML + "\nEngine 5: "+ accn5.toFixed(3) + SolarObjects.units.speed+'/s';
              log.innerHTML = log.innerHTML + "\n0 to 1000 "+SolarObjects.units.speed+" in "+timeTo1000.toFixed(3)+"s";
              log.innerHTML = log.innerHTML + "\nNavCom Grid Nav: 50,000 and 10,000" + SolarObjects.units.distance;
              log.innerHTML = log.innerHTML + "\nNavCom Grid Signals: 10,000 and 2,000" + SolarObjects.units.distance;
              log.innerHTML = log.innerHTML + "\nNavCom Grid Helm: 1,000" + SolarObjects.units.distance;

            }


        } else {
            log.innerHTML = log.innerHTML + "\nobject '" + this.command.parameters.alias + "' not found.";
        }
    }
}
