import CompositeRenderer from './Composite';

import MapBackground from './SubRenderers/MapBackground';
import MapGrid from './SubRenderers/MapGrid';
import Map from './SubRenderers/Map';
import MapHud from './SubRenderers/MapHud';
import MapRanges from './SubRenderers/MapRanges';
import MapPaths from './SubRenderers/MapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
import MapPanControl from './SubRenderers/MapPanControl';
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
      let marginFull = margin * 2;

      let rightColWidth = Math.floor(fullWidth*0.5) - margin;
      if ((fullHeight+marginFull) < rightColWidth) {
        rightColWidth = fullHeight - marginFull;
      }
      let leftColWidth = fullWidth - (rightColWidth + marginFull + margin);
      let bottomLeftColWidth = 400;
      let bottomRightColWidth = leftColWidth - (margin + bottomLeftColWidth);
      let bottomHeight = 400;
      let topHeight = fullHeight - (bottomHeight + margin + margin);
      let mapSize = 60000;

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
            height: fullHeight - marginFull,
            zIndex: 1,
            mapSize: mapSize
          }),
          new MapRanges({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: fullHeight - marginFull,
            zIndex: 1,
            mapSize: mapSize
          }),
          new MapGrid({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: fullHeight - marginFull,
            zIndex: 5,
            mapSize: mapSize
          }),
          new MapPaths({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: fullHeight - marginFull,
            zIndex: 8,
            predictTime: 30,
            trackObjects: true,
            mapSize: mapSize
          }),
          new Map({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: fullHeight - marginFull,
            zIndex: 10,
            mapSize: mapSize
          }),
          new MapHud({
            x: fullWidth - (rightColWidth + margin),
            y: margin,
            width: rightColWidth,
            height: fullHeight - marginFull,
            zIndex: 15,
            mapSize: mapSize,
            arrowSize: 10,
            arrowMargin: 6,
            dialSmallDividerSize: 2,
            dialLargeDividerSize: 5,
            dialFontSize: 7,
            predictTime: 120 // to match waypoint predicition with nav
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false
          }),
          new MapPanControl({
            wasd: false,
            arrows: true,
          }),
          new PowerGrid({
            x: margin,
            y: margin,
            width: leftColWidth,
            height: topHeight,
            zIndex: 20
          }),
          new TorpedoLoadControl({
            x: bottomLeftColWidth + marginFull,
            y: marginFull + topHeight,
            width: bottomRightColWidth,
            height: bottomHeight,
            zIndex: 25
          }),
          new EngineeringDataControl({
            x: margin,
            y: marginFull + topHeight,
            width: bottomLeftColWidth,
            height: bottomHeight,
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
