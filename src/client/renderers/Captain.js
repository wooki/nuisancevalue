import CompositeRenderer from './Composite';
import LocalMapBackground from './SubRenderers/LocalMapBackground';
import LocalMapRanges from './SubRenderers/LocalMapRanges';
import LocalMap from './SubRenderers/LocalMap';
import LocalMapHud from './SubRenderers/LocalMapHud';
import LocalMapPaths from './SubRenderers/LocalMapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
// import OpenCommsControl from './SubRenderers/OpenCommsControl';
// import CommsControl from './SubRenderers/CommsControl';
import HudData from './SubRenderers/HudData';
import LocalMapPanControl from './SubRenderers/LocalMapPanControl';
import EngineeringDataControl from './SubRenderers/EngineeringDataControl';

// extend compsite with pre-set subrenderers
export default class CaptainRenderer extends CompositeRenderer {

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
      const mapSize = 30000;

      let config = {
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        dashboardColor: 0x990000,
        subRenderers: [
          new LocalMapBackground({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 5,
            mapSize: mapSize
          }),
          new LocalMapRanges({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 9,
            mapSize: mapSize
          }),
          new LocalMapPaths({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 12,
            predictTime: 30,
            trackObjects: true,
            mapSize: mapSize
          }),
          new LocalMap({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 15,
            mapSize: mapSize
          }),
          new LocalMapHud({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 20,
            mapSize: mapSize,
            // dial: false,
            predictTime: 120 // to match waypoint predicition with nav
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false
          }),
          new LocalMapPanControl({
            wasd: true,
            arrows: true,
          }),
          new HudData({
            x: margin,
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: fullHeight - marginFull,
            zIndex: 30
          }),
          new EngineeringDataControl({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: (fullHeight - marginFull),
            zIndex: 31
          }),
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
