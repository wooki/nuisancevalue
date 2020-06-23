import CompositeRenderer from './Composite';
import LocalMapBackground from './SubRenderers/LocalMapBackground';
import LocalMap from './SubRenderers/LocalMap';
import LocalMapHud from './SubRenderers/LocalMapHud';
import EngineControl from './SubRenderers/EngineControl';
import ManeuverControl from './SubRenderers/ManeuverControl';
import DockingControl from './SubRenderers/DockingControl';
import HudData from './SubRenderers/HudData';
import LocalMapPaths from './SubRenderers/LocalMapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
import TargetSelection from './SubRenderers/TargetSelection';

// extend compsite with pre-set subrenderers
export default class EngineerRenderer extends CompositeRenderer {

    constructor(gameEngine, clientEngine) {

      // set some useful vars for positioning subRenderers
      const fullWidth = window.innerWidth;
      const fullHeight = window.innerHeight;
      const halfWidth = Math.round(fullWidth/2);
      const halfHeight = Math.round(fullHeight/2);
      let spaceWidth = fullWidth - fullHeight;
      let margin = 30;
      if (spaceWidth < 0) {
        spaceWidth = 0;
        margin = 15;
      }
      const sideWidth = Math.round((spaceWidth/2) - margin);
      const marginFull = margin * 2;
      const sideControlsMin = 200;

      let config = {
        station: 'engineer',
        stationProperty: 'engineerPlayerId',
        baseUrl: '/',
        dashboardColor: 0xCC00CC,
        subRenderers: [
          new LocalMapBackground({
            x: fullWidth - (400 + margin),
            y: margin,
            width: 400,
            height: 400,
            zIndex: 1,
            mapSize: 4000
          }),
          new LocalMap({
            x: fullWidth - (400 + margin),
            y: margin,
            width: 400,
            height: 400,
            zIndex: 2,
            mapSize: 4000
          }),
          new LocalMapHud({
            x: fullWidth - (400 + margin),
            y: margin,
            width: 400,
            height: 400,
            zIndex: 3,
            mapSize: 4000,
            arrowSize: 10,
            arrowMargin: 6,
            dialSmallDividerSize: 2,
            dialLargeDividerSize: 5,
            dialFontSize: 7
          })
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
