import CompositeRenderer from './Composite';
import MapBackground from './SubRenderers/MapBackground';
import MapRanges from './SubRenderers/MapRanges';
import Map from './SubRenderers/Map';
import MapHud from './SubRenderers/MapHud';
import MapGrid from './SubRenderers/MapGrid';
import MapPaths from './SubRenderers/MapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
import MapPanControl from './SubRenderers/MapPanControl';
import HudData from './SubRenderers/HudData';
import EngineeringDataControl from './SubRenderers/EngineeringDataControl';
import GlobalSound from './SubRenderers/GlobalSound';
import LocalSound from './SubRenderers/LocalSound';

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
      const mapSize = 60000;

      let config = {
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        // dashboardColor: 0x333333,
        subRenderers: [
          new MapBackground({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 5,
            mapSize: mapSize
          }),
          new MapRanges({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 9,
            mapSize: mapSize
          }),
          new MapGrid({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 10,
            mapSize: mapSize
          }),
          new MapPaths({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 12,
            predictTime: 30,
            trackObjects: true,
            mapSize: mapSize
          }),
          new Map({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 15,
            mapSize: mapSize
          }),
          new MapHud({
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
          new MapPanControl({
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
          new GlobalSound({
          }),
          new LocalSound({
          }),
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
