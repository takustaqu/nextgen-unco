/**
 * Initialize scene.
 * @param  {CardboardApp} app instance of CardboardApp class. See http://ejeinc.github.io/simple-cardboard-template/jsdoc/CardboardApp.html.
 */
function init(app) {
  var scene = app.scene,
    camera = app.camera,
    renderer = app.renderer;

  var sphere = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), new THREE.MeshBasicMaterial({
    map: THREE.ImageUtils.loadTexture('toilet2048.jpg')
  }));
  sphere.scale.z = -1;
  scene.add(sphere);

  // app.on('click', function() {
  //   // Do something
  // });

  // Add update callback receiver
  // e.detail is CardboardApp.State object.
  // e.detail.dt is a result of THREE.Clock.getDelta() for each frames.
  // e.detail.touching is true while user is touching to screen (with VR kit's button).
  // app.on('update', function(e) {
  // // Do something
  // });
}
