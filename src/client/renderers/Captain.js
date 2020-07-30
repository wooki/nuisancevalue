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
import OpenCommsControl from './SubRenderers/OpenCommsControl';
import CommsControl from './SubRenderers/CommsControl';
import TorpedoFireControl from './SubRenderers/TorpedoFireControl';
import LocalMapPdcHud from './SubRenderers/LocalMapPdcHud';
import PdcFireControl from './SubRenderers/PdcFireControl';

// extend compsite with pre-set subrenderers
export default class CaptainRenderer extends CompositeRenderer {

    constructor(gameEngine, clientEngine) {

      // set some useful vars for positioning subRenderers
      const fullWidth = window.innerWidth;
      const fullHeight = window.innerHeight;
      const halfWidth = Math.round(fullWidth/2);
      const halfHeight = Math.round(fullHeight/2);
      let margin = 30;
      const marginFull = margin * 2;
      const sideWidth = (fullWidth * 0.25) - marginFull;
      const sideControlsMin = 360;
      const sidebarWidth = Math.min(sideWidth, sideControlsMin);
      const mainAreaWidth = fullWidth - sidebarWidth;

      let config = {
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        dashboardColor: 0x990000,
        subRenderers: [
          new LocalMapBackground({
            x: 0,
            y: 0,
            width: mainAreaWidth,
            height: fullHeight,
            zIndex: 5,
            mapSize: 100000,
            shape: "rectangle",
            borderWidth: 0,
            backgroundAsset: 'black',
            focus: [0, 0]
          }),
          new LocalMapPaths({
            x: 0,
            y: 0,
            width: mainAreaWidth,
            height: fullHeight,
            zIndex: 12,
            predictTime: 36,
            trackObjects: false,
            mapSize: 100000,
            shape: "rectangle",
            focus: [0, 0]
          }),
          new LocalMap({
            x: 0,
            y: 0,
            width: mainAreaWidth,
            height: fullHeight,
            zIndex: 15,
            mapSize: 100000,
            shape: "rectangle",
            focus: [0, 0]
          }),
          new LocalMapHud({
            x: 0,
            y: 0,
            width: mainAreaWidth,
            height: fullHeight,
            zIndex: 20,
            mapSize: 100000,
            shape: "rectangle",
            dial: false,
            focus: [0, 0]
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false,
            minZoom: 0.05,
            maxZoom: 8,
            zoomStep: 0.05,
          }),
          new HudData({
            x: mainAreaWidth + margin,
            y: margin,
            width: sidebarWidth - marginFull,
            height: fullHeight - marginFull,
            zIndex: 30
          }),
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
