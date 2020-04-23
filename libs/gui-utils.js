 function setupUI(){
    // Setup a ui.
    webglLessonsUI.setupSlider("#fieldOfView", {value: radToDeg(cameraSettings.fieldOfViewRadians), slide: updateFieldOfView, min: 1, max: 179});
    webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), min: -200, max: 200 });
    webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), min: -200, max: 200});
    webglLessonsUI.setupSlider("#z", {value: translation[2], slide: updatePosition(2), min: -1000, max: 0});
    webglLessonsUI.setupSlider("#angleX", {value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360});
    webglLessonsUI.setupSlider("#angleY", {value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360});
    webglLessonsUI.setupSlider("#angleZ", {value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360});
    webglLessonsUI.setupSlider("#cameraX", {value: cameraSettings.cameraPosition[0], slide: updateCameraPosition(0), min: -500, max: 500});
    webglLessonsUI.setupSlider("#cameraY", {value: cameraSettings.cameraPosition[1], slide: updateCameraPosition(1), min: -500, max: 500});
    webglLessonsUI.setupSlider("#cameraZ", {value: cameraSettings.cameraPosition[2], slide: updateCameraPosition(2), min: -500, max: 500});
    /* webglLessonsUI.setupSlider("#cameraAngleX", {value: radToDeg(cameraSettings.cameraRotation[0]), slide: updateCameraRotation(0), max: 360});
    webglLessonsUI.setupSlider("#cameraAngleY", {value: radToDeg(cameraSettings.cameraRotation[1]), slide: updateCameraRotation(1), max: 360});
    webglLessonsUI.setupSlider("#cameraAngleZ", {value: radToDeg(cameraSettings.cameraRotation[2]), slide: updateCameraRotation(2), max: 360});
 */
}

function updateFieldOfView(event, ui) {
    fieldOfViewRadians = degToRad(ui.value);
    drawScene();
  }

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateCameraPosition(index) {
    return function(event, ui) {
      cameraSettings.cameraPosition[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateCameraRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      cameraSettings.cameraRotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }