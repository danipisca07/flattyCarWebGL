"use strict";

var nObjs = 20;
var nPerRow = 5;
var translation = [0,0,0];
var rotation = [degToRad(0), degToRad(0), degToRad(0)];
var scale = [1,1,1]; //1,1,1

var offset = [2,2,0];
var offsetAngle = [degToRad(0), degToRad(0), degToRad(0)];

var cameraSettings = {
    cameraPosition : [0, 3, 3],
    //cameraRotation : [degToRad(0), degToRad(0), degToRad(0)],
    lookUpVector : [0, 1, 0],
    fieldOfViewRadians : degToRad(48),
    zNear : 1,
    zFar : 2000,
}
var cameraTarget = translation;

var lightPosition = [-100, -100, -400];

var gl, program;
var positionLocation, positionBuffer;
var colorLocation, colorBuffer;
var uniformSetters, attributeSetters, bufferInfo; 
var attribs, staticUniforms, computedUniforms;

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    gl = canvas.getContext("webgl");
    if (!gl) { return; }

    setupUI();
    drawScene();
}

// Draw the scene.
function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    renderVCar(gl, program);
}
main();

//Lui la chiama WORLD matrix, in ogni caso è quella che manipola tutta la scena
function getMatrix(i){
    var totOffset = [ translation[0]+offset[0]*(i%nPerRow), 
        translation[1]+offset[1]*Math.floor(i/nPerRow), 
        translation[2]+offset[2]*i];
    var totRotation = addVec3(rotation, multiplyVec3Scalar(offsetAngle, i));
    var matrix = getManipulationMatrix(m4.identity(), scale, totRotation, totOffset);
    return matrix;
}
