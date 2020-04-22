"use strict";
var nObjs = 20;
var nPerRow = 5;
var translation = [0,0,0];
var rotation = [degToRad(0), degToRad(0), degToRad(0)];
var scale = [20, 20, 20];

var offset = [2,2,0];
var offsetAngle = [degToRad(0), degToRad(0), degToRad(0)];

var cameraSettings = {
    cameraPosition : [0, 0, 400],
    //cameraRotation : [degToRad(0), degToRad(0), degToRad(0)],
    lookUpVector : [0, 1, 0],
    fieldOfViewRadians : degToRad(48),
    zNear : 1,
    zFar : 2000,
}
var cameraTarget = [0, 0, 0];

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

    // setup GLSL program
    program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

    uniformSetters = webglUtils.createUniformSetters(gl,program);
    attributeSetters = webglUtils.createAttributeSetters(gl,program);

    var arrays = getPyramidArrays();
    bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

    attribs = {
        
    }

    /* staticUniforms = {
        u_color: [Math.random(), Math.random(), Math.random(), 1], //V1
    } */

    /* computedUniforms = { //Non c'è bisogno di definirla qui se tanto la ricarico in draw
        u_matrix: m4.identity(),
    } */

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
    gl.useProgram(program);

    webglUtils.setBuffersAndAttributes(gl, attributeSetters, bufferInfo); 

    for(var i= 0; i<nObjs; i++) {

        var worldMatrix = getMatrix(i); //E' quella che sposta/scala/routa l'oggetto nello spazio
        var viewProjectionMatrix = getViewProjectionMatrixLookAt(gl, cameraTarget); //E' quella che da l'effetto prospettivo e relativo alla camera
        var worldInverseTranspose = m4.transpose(m4.inverse(worldMatrix));
        computedUniforms = {
            u_lightWorldPosition : lightPosition,
            u_world : worldMatrix,
            u_worldViewProjection : m4.multiply(viewProjectionMatrix, worldMatrix),
            u_worldInverseTranspose : worldInverseTranspose,
            u_color: [Math.random(), Math.random(), Math.random(), 1],
        }
        
        //webglUtils.setUniforms(uniformSetters, staticUniforms); 
        webglUtils.setUniforms(uniformSetters, computedUniforms);

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;
        var indexType = gl.UNSIGNED_SHORT;
        gl.drawElements(primitiveType, count, indexType, offset);
    }
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
