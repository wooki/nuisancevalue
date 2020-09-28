import CompositeRenderer from './Composite';
import MapBackground from './SubRenderers/MapBackground';
import MapRanges from './SubRenderers/MapRanges';
import Map from './SubRenderers/Map';
import MapHud from './SubRenderers/MapHud';
import MapPaths from './SubRenderers/MapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
import TargetSelection from './SubRenderers/TargetSelection';
import OpenCommsControl from './SubRenderers/OpenCommsControl';
import CommsControl from './SubRenderers/CommsControl';
import TorpedoFireControl from './SubRenderers/TorpedoFireControl';
import MapPdcHud from './SubRenderers/MapPdcHud';
import PdcFireControl from './SubRenderers/PdcFireControl';
import SignalsData from './SubRenderers/SignalsData';
import GlobalSound from './SubRenderers/GlobalSound';
import LocalSound from './SubRenderers/LocalSound';

// extend compsite with pre-set subrenderers
export default class SignalsRenderer extends CompositeRenderer {

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
        station: 'signals',
        stationProperty: 'signalsPlayerId',
        baseUrl: '/',
        dashboardColor: 0x003366,
        subRenderers: [
          new MapBackground({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 5,
            mapSize: 30000
          }),
          new MapRanges({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 9,
            mapSize: 30000
          }),
          new MapPaths({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 12,
            predictTime: 30,
            trackObjects: true,
            mapSize: 30000
          }),
          new Map({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 15,
            mapSize: 30000
          }),
          new MapHud({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 20,
            mapSize: 30000,
            predictTime: 120 // to match waypoint predicition with nav
          }),
          new MapPdcHud({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 25,
            mapSize: 30000
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false
          }),
          new SignalsData({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: fullHeight - marginFull,
            zIndex: 30
          }),
          new TargetSelection({}), // watch for selection and set as target
          new TorpedoFireControl({
            x: margin,
            y: (marginFull + 126),
            width: Math.max(sideWidth, sideControlsMin),
            zIndex: 30,
            keyboardControls: false
          }),
          new PdcFireControl({
            x: margin,
            y: fullHeight - (margin + 252),
            width: Math.max(sideWidth, sideControlsMin),
            height: 252,
            zIndex: 35,
            keyboardControls: true
          }),
          new OpenCommsControl({
            x: margin,
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            zIndex: 40,
            keyboardControls: true
          }),
          new CommsControl({
            x: margin,
            y: margin,
            width: fullWidth - marginFull,
            height: fullHeight - marginFull,
            zIndex: 100
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
