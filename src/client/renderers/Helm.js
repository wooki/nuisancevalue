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
import FuelGauge from './SubRenderers/FuelGauge';

// extend compsite with pre-set subrenderers
export default class HelmRenderer extends CompositeRenderer {

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
        station: 'helm',
        stationProperty: 'helmPlayerId',
        baseUrl: '/',
        dashboardColor: 0x2c332c,
        subRenderers: [
          new LocalMapBackground({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 5            ,
            focus: 5
          }),
          new LocalMapPaths({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 12            ,
            focus: 5
          }),
          new LocalMap({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 15            ,
            focus: 5
          }),
          new LocalMapHud({
            x: halfWidth - (halfHeight - margin),
            y: margin,
            width: fullHeight - marginFull,
            height: fullHeight - marginFull,
            zIndex: 20            ,
            focus: 5
          }),
          new EngineControl({
            x: margin,
            y: fullHeight - (margin + 372),
            zIndex: 30,
            keyboardControls: true
          }),
          new ManeuverControl({
            x: margin + margin + 60, // engine control + 2 margins
            y: fullHeight - (margin + 63),
            zIndex: 30,
            keyboardControls: true
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false
          }),
          new DockingControl({
            x: margin,
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: (halfHeight - (margin * 2)),
            zIndex: 30,
            keyboardControls: true
          }),
          new FuelGauge({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: fullHeight - (margin + 63),
            width: Math.max(sideWidth, sideControlsMin),
            height: 63,
            zIndex: 25
          }),
          new HudData({
            x: fullWidth - (margin + Math.max(sideWidth, sideControlsMin)),
            y: margin,
            width: Math.max(sideWidth, sideControlsMin),
            height: fullHeight - marginFull,
            zIndex: 30
          })
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
