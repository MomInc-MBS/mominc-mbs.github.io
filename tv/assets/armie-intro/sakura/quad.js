import * as THREE from '../vendor/three.module.js';
export class FullScreenQuad {
  constructor(material) {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.mesh.frustumCulled = false;
  }
  render(renderer) { renderer.render(this.mesh, this.camera); }
  dispose() { this.mesh.geometry.dispose(); }
}
