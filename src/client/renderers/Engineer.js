import CompositeRenderer from './Composite';
import LocalMapBackground from './SubRenderers/LocalMapBackground';
import LocalMap from './SubRenderers/LocalMap';
import LocalMapHud from './SubRenderers/LocalMapHud';
import PowerGrid from './SubRenderers/PowerGrid';
import TorpedoLoadControl from './SubRenderers/TorpedoLoadControl';
import EngineeringDataControl from './SubRenderers/EngineeringDataControl';

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
      const rightColWidth = 400;

      let config = {
        station: 'engineer',
        stationProperty: 'engineerPlayerId',
        baseUrl: '/',
        dashboardColor: 0x990000,
        subRenderers: [
          new LocalMapBackground({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 1,
            mapSize: 6000
          }),
          new LocalMap({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 2,
            mapSize: 6000
          }),
          new LocalMapHud({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 3,
            mapSize: 6000,
            arrowSize: 10,
            arrowMargin: 6,
            dialSmallDividerSize: 2,
            dialLargeDividerSize: 5,
            dialFontSize: 7
          }),
          new PowerGrid({
            x: margin,
            y: margin,
            width: fullWidth - (rightColWidth + marginFull + margin),
            height: (fullHeight*0.66) - marginFull,
            zIndex: 4
          }),
          new TorpedoLoadControl({
            x: margin,
            y: marginFull + ((fullHeight*0.66) - marginFull),
            width: fullWidth - (rightColWidth + marginFull + margin),
            height: (fullHeight*0.33) - margin,
            zIndex: 5
          }),
          new EngineeringDataControl({
            x: fullWidth - (rightColWidth + margin),
            y: marginFull + rightColWidth,
            width: rightColWidth,
            height: (fullHeight - rightColWidth) - marginFull,
            zIndex: 6
          }),
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
