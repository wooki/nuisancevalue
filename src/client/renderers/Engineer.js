import CompositeRenderer from './Composite';
import MapBackground from './SubRenderers/MapBackground';
import MapGrid from './SubRenderers/MapGrid';
import Map from './SubRenderers/Map';
import MapHud from './SubRenderers/MapHud';
import PowerGrid from './SubRenderers/PowerGrid';
import TorpedoLoadControl from './SubRenderers/TorpedoLoadControl';
import EngineeringDataControl from './SubRenderers/EngineeringDataControl';
import GlobalSound from './SubRenderers/GlobalSound';
import LocalSound from './SubRenderers/LocalSound';

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
        // dashboardColor: 0x990000,
        subRenderers: [
          new MapBackground({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 1,
            mapSize: 6000
          }),
          new MapGrid({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 5,
            mapSize: 6000
          }),
          new Map({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 10,
            mapSize: 6000
          }),
          new MapHud({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: rightColWidth,
            zIndex: 15,
            mapSize: 6000,
            arrowSize: 10,
            arrowMargin: 6,
            dialSmallDividerSize: 2,
            dialLargeDividerSize: 5,
            dialFontSize: 7,
            predictTime: 120 // to match waypoint predicition with nav
          }),
          new PowerGrid({
            x: margin,
            y: margin,
            width: fullWidth - (rightColWidth + marginFull + margin),
            height: (fullHeight*0.66) - marginFull,
            zIndex: 20
          }),
          new TorpedoLoadControl({
            x: margin,
            y: marginFull + ((fullHeight*0.66) - marginFull),
            width: fullWidth - (rightColWidth + marginFull + margin),
            height: (fullHeight*0.33) - margin,
            zIndex: 25
          }),
          new EngineeringDataControl({
            x: fullWidth - (rightColWidth + margin),
            y: marginFull + rightColWidth,
            width: rightColWidth,
            height: (fullHeight - rightColWidth) - marginFull,
            zIndex: 30
          }),
          new GlobalSound({
          }),
          new LocalSound({
          }),
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
