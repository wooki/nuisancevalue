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
            mapSize: 30000
          }),
          new LocalMapPaths({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 12,
            predictTime: 36,
            trackObjects: false,
            mapSize: 30000
          }),
          new LocalMap({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 15,
            mapSize: 30000
          }),
          new LocalMapHud({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 20,
            mapSize: 30000
          }),
          // new EngineControl({
          //   x: margin,
          //   y: fullHeight - (margin + 372),
          //   zIndex: 30,
          //   keyboardControls: true
          // }),
          // new ManeuverControl({
          //   x: margin + margin + 60, // engine control + 2 margins
          //   y: fullHeight - (margin + 63),
          //   zIndex: 30,
          //   keyboardControls: true
          // }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false
          }),
          new HudData({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: fullHeight - marginFull,
            zIndex: 30
          }),
          new TargetSelection({}), // watch for selection and set as target
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
          })
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
