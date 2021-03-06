import CompositeRenderer from './Composite';
import MapBackground from './SubRenderers/MapBackground';
import MapGrid from './SubRenderers/MapGrid';
import Map from './SubRenderers/Map';
import MapHud from './SubRenderers/MapHud';
import EngineControl from './SubRenderers/EngineControl';
import ManeuverControl from './SubRenderers/ManeuverControl';
import DockingControl from './SubRenderers/DockingControl';
import HudData from './SubRenderers/HudData';
import MapPaths from './SubRenderers/MapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
import FuelGauge from './SubRenderers/FuelGauge';
import GlobalSound from './SubRenderers/GlobalSound';
import LocalSound from './SubRenderers/LocalSound';
import NextTargetControl from './SubRenderers/NextTargetControl';
import TargetSelection from './SubRenderers/TargetSelection';
import OpenCommsControl from './SubRenderers/OpenCommsControl';
import CommsControl from './SubRenderers/CommsControl';
import TorpedoFireControl from './SubRenderers/TorpedoFireControl';

// extend compsite with pre-set subrenderers
export default class PilotRenderer extends CompositeRenderer {

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
        station: 'pilot',
        stationProperty: 'helmPlayerId',
        baseUrl: '/',
        // dashboardColor: 0x2c332c,
        subRenderers: [
          new MapBackground({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 5
          }),
          new MapGrid({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 8
          }),
          new MapPaths({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 12
          }),
          new Map({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 15
          }),
          new MapHud({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 20,
            predictTime: 120 // to match waypoint predicition with nav
          }),
          new EngineControl({
            x: margin,
            y: fullHeight - (margin + 372),
            zIndex: 30,
            keyboardControls: true
          }),
          new ManeuverControl({
            x: margin + margin + 60, // engine control + 2 margins
            y: fullHeight - (margin + 44),
            zIndex: 30,
            keyboardControls: true
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false,
            minZoom: 0.06,
            maxZoom: 3,
          }),
          new NextTargetControl({
            keyboardControls: true,
            onScreenControls: false
          }),
          new TargetSelection({}), // watch for selection and set as target
          new TorpedoFireControl({
            x: margin,
            y: (marginFull + 126 + margin + 195),
            width: Math.max(sideWidth, sideControlsMin),
            height: 220,
            zIndex: 30,
            keyboardControls: false,
            autoLoad: true
          }),
          new DockingControl({
            x: margin,
            y: (marginFull + 126),
            width: Math.max(sideWidth, sideControlsMin),
            height: 195,
            zIndex: 30,
            keyboardControls: true
          }),
          new FuelGauge({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: fullHeight - (margin + 44),
            width: Math.max(sideWidth, sideControlsMin),
            height: 44,
            zIndex: 25
          }),
          new HudData({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: fullHeight - marginFull,
            zIndex: 30
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
