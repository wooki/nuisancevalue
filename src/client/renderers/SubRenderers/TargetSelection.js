
// Watches for selected object in shared state and sets/unsets the shiups target
export default class TargetSelection {

  constructor(params) {
    this.parameters = Object.assign({
    }, params);
  }

  // keep references and add to the html
  init(el, pixiApp, pixiContainer, resources, renderer) {
    this.renderer = renderer;
  }

  // watch shared state for current zoom setting
  updateSharedState(state, renderer) {

    if (state.selection) {
      this.renderer.client.setTarget(state.selection.id);
  	} else {
      this.renderer.client.setTarget(-1);
    }
  }

}
