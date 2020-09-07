import CompositeRenderer from './Composite';
import LocalMapBackground from './SubRenderers/LocalMapBackground';
import LocalMapRanges from './SubRenderers/LocalMapRanges';
import LocalMap from './SubRenderers/LocalMap';
import LocalMapHud from './SubRenderers/LocalMapHud';
import LocalMapPaths from './SubRenderers/LocalMapPaths';
import ZoomControl from './SubRenderers/ZoomControl';
import NavData from './SubRenderers/NavData';
import SelectedNavData from './SubRenderers/SelectedNavData';
import LocalMapPanControl from './SubRenderers/LocalMapPanControl';
import SoundControl from './SubRenderers/SoundControl';

// extend compsite with pre-set subrenderers
export default class NavRenderer extends CompositeRenderer {

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
      const mapSize = 100000;

      let config = {
        station: 'nav',
        stationProperty: 'navPlayerId',
        baseUrl: '/',
        dashboardColor: 0x996633,
        subRenderers: [
          new LocalMapBackground({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 5,
            mapSize: mapSize,
            shape: "rectangle",
            borderWidth: 0,
            backgroundAsset: 'black'
          }),
          new LocalMapRanges({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 9,
            mapSize: mapSize,
            shape: "rectangle"
          }),
          new LocalMapPaths({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 12,
            predictTime: 120,
            trackObjects: true,
            relativeToGravity: false,
            mapSize: mapSize,
            shape: "rectangle"
          }),
          new LocalMap({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 15,
            mapSize: mapSize,
            shape: "rectangle"
          }),
          new LocalMapHud({
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            zIndex: 20,
            mapSize: mapSize,
            shape: "rectangle",
            dial: false,
            predictTime: 120,
            showSelection: true
          }),
          new ZoomControl({
            keyboardControls: true,
            onScreenControls: false,
            minZoom: 0.05,
            maxZoom: 8,
            zoomStep: 0.05,
          }),
          new LocalMapPanControl({
            wasd: true,
            arrows: false,
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
          new SoundControl({
          }),
        ]
      };

      super(gameEngine, clientEngine, config);
    }


}
