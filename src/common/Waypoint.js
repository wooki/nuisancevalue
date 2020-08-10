import { GameObject, BaseTypes } from 'lance-gg';

export default class Waypoint extends GameObject {

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.texture = "Waypoint";
    }

    static get netScheme() {
        return {
            objId: { type: BaseTypes.TYPES.INT16 },
            orbit: { type: BaseTypes.TYPES.INT16 },
        };
    }

    toString() {
      return `Waypoint objId=${this.objId} orbit=${this.orbit}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.objId = other.objId;
        this.orbit = other.orbit;
    }
}
