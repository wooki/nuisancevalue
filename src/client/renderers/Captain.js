import CompositeRenderer from './Composite';
import LocalMapBackground from './SubRenderers/LocalMapBackground';
import LocalMap from './SubRenderers/LocalMap';
import LocalMapHud from './SubRenderers/LocalMapHud';
// import EngineControl from './SubRenderers/EngineControl';
// import ManeuverControl from './SubRenderers/ManeuverControl';
// import DockingControl from './SubRenderers/DockingControl';
// import HudData from './SubRenderers/HudData';
import LocalMapPaths from './SubRenderers/LocalMapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
// import TargetSelection from './SubRenderers/TargetSelection';
// import OpenCommsControl from './SubRenderers/OpenCommsControl';
// import CommsControl from './SubRenderers/CommsControl';
// import TorpedoFireControl from './SubRenderers/TorpedoFireControl';
// import LocalMapPdcHud from './SubRenderers/LocalMapPdcHud';
// import PdcFireControl from './SubRenderers/PdcFireControl';
import NavData from './SubRenderers/NavData';
import SelectedNavData from './SubRenderers/SelectedNavData';

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
      const mainAreaWidth = fullWidth - (2 * sidebarWidth);

      let config = {
        station: 'captain',
        stationProperty: 'captainPlayerId',
        baseUrl: '/',
        dashboardColor: 0x990000,
        subRenderers: [
          new LocalMapBackground({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 5,
            mapSize: 100000,
            shape: "rectangle",
            borderWidth: 0,
            backgroundAsset: 'black'
          }),
          new LocalMapPaths({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 12,
            predictTime: 180,
            trackObjects: true,
            relativeToGravity: false,
            mapSize: 100000,
            shape: "rectangle"
          }),
          new LocalMap({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 15,
            mapSize: 100000,
            shape: "rectangle"
          }),
          new LocalMapHud({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 20,
            mapSize: 100000,
            shape: "rectangle",
            dial: false
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false,
            minZoom: 0.05,
            maxZoom: 8,
            zoomStep: 0.05,
          }),
          new NavData({
            x: margin,
            y: margin,
            width: sidebarWidth - marginFull,
            height: fullHeight - marginFull,
            zIndex: 30
          }),
          new SelectedNavData({
            x: sidebarWidth + mainAreaWidth + margin,
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
