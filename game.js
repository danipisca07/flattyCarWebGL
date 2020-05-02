"use strict";

var cameraSettings = { 
    cameraPosition : [0, 7, 7],
    //cameraRotation : [degToRad(0), degToRad(0), degToRad(0)],
    lookUpVector : [0, 1, 0],
    fieldOfViewRadians : degToRad(48),
    zNear : 1,
    zFar : 2000,
}
var cameraTarget = [vCar.px, vCar.py, vCar.pz];

var translation = [0,0,0];
var rotation = [degToRad(0), degToRad(0), degToRad(0)];
var scale = [1,1,1]; 

var gfxSettings = 'high';
var ambientLight = 0.2; //Illuminazione di base (ambiente)
var pointLightPosition = [0.0, 5.0, 0.0 ]; //Posizione punto luce

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
    //drawScene();
    
}

// Draw the scene.
function drawScene(elapsed) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    let viewProjectionMatrix = getViewProjectionMatrixLookAt(gl, cameraTarget);
    
    renderElement(gl, floor, m4.identity(), viewProjectionMatrix, gfxSettings);

    let baseCarMatrix = m4.translation(0, 0.28,0);
    vCar.doStep(key);
    renderElement(gl, vCar, baseCarMatrix, viewProjectionMatrix, gfxSettings);
}

var key=[false,false,false,false]; //Vedi car.js per i codici tasti
window.addEventListener('keydown', doKeyDown, true);
function doKeyDown(e){
    switch(e.keyCode){
        case keys.W_CODE:
            key[keys.W]=true;
            break;
        case keys.A_CODE:
            key[keys.A]=true;
            break;
        case keys.S_CODE:
            key[keys.S]=true;
            break;
        case keys.D_CODE:
            key[keys.D]=true;
            break;
    }
}
window.addEventListener('keyup', doKeyUp, true);
function doKeyUp(e){
    switch(e.keyCode){
        case keys.W_CODE:
            key[keys.W]=false;
            break;
        case keys.A_CODE:
            key[keys.A]=false;
            break;
        case keys.S_CODE:
            key[keys.S]=false;
            break;
        case keys.D_CODE:
            key[keys.D]=false;
            break;
    }
}

//Caricamento .obj
function loadObj(content){
    let newPart = new Object();
    let vertices = new Array();
    let indices = new Array();
    let normals = new Array();
    let mesh = new Object();
    //let mesh = new subd_mesh();
    mesh = ReadOBJ(content, mesh);
    newPart.vertices = new Array();
    newPart.normals = new Array();
    //obj.indices = indices;
    for (var i=0; i<mesh.nvert; i++)
    {
        vertices.push([mesh.vert[i+1].x, mesh.vert[i+1].y, mesh.vert[i+1].z]);
    }
    for (var i=0; i/3<mesh.normals.length; i=i+3)
    {
        normals.push([mesh.normals[i], mesh.normals[i+1], mesh.normals[i+2]]);
    }
    for(let i=0; i<mesh.nface; i++){ //Per ogni faccia
        let face = mesh.face[i+1];
        let nIndices = 0;
        while(face.vert[nIndices]>0) nIndices++; //Controllo quanti vertici ha la faccia
        
        for(let j=0; j<nIndices-2; j++){ //Per ogni "tripletta" di vertici della faccia (TRIANGLE_FAN)
            /* indices.push(face[0]-1);
            indices.push(face[j+1]-1);
            indices.push(face[j+2]-1); */
            try {
                newPart.vertices.push(...vertices[face.vert[0]-1]);
                newPart.vertices.push(...vertices[face.vert[j+1]-1]);
                newPart.vertices.push(...vertices[face.vert[j+2]-1]);
                newPart.normals.push(...normals[face.norm[0]-1]);
                newPart.normals.push(...normals[face.norm[j+1]-1]);
                newPart.normals.push(...normals[face.norm[j+2]-1]);
            }
            catch(e){
                console.log(e);
            }
            

        }
        //indices = new Array();for(let j=0; j<nIndices; j++) indices.push(face[j]-1); //TRIANGLE_FAN??
    }
    
    /* var indicesWF = new Array();
    mesh=LoadSubdivMesh(mesh);
    for (var i=0; i<mesh.nedge; i++)
    {
        indicesWF.push(mesh.edge[i+1].vert[0]-1);
        indicesWF.push(mesh.edge[i+1].vert[1]-1);
    } */
    

    return newPart;
}

function loadMesh(filename) {
    return $.ajax({
        url: filename,
        dataType: 'text'
    }).fail(function() {
        alert('File [' + filename + "] non trovato!");
    });
}

function loadCarLow(){
    loadMesh('./assets/camaro_body_low.obj').then( (data) => {
        let body = loadObj(data);
        body.type = CAR_PARTS.BODY;
        body.color = [0.1, 0.8, 0.1, 1];
        body.shininess = 100;
        vCar.parts[0] = body;
        vCar.drawMode = 'arrays';
        vCar.loaded = true;
        startAnimating(60, drawScene);
        loadCarHigh();
    });
    loadMesh('./assets/camaro_wheel_low.obj').then( (data) => {
        let wheel = loadObj(data);
        wheel.color = [0.1, 0.1, 0.1, 1];
        wheel.shininess = 100;
        for(let i = 1; i<5; i++){
            vCar.parts[i] = {...wheel};
        }
        vCar.parts[1].type = CAR_PARTS.WHEEL_REAR_R;
        vCar.parts[2].type = CAR_PARTS.WHEEL_REAR_L;
        vCar.parts[3].type = CAR_PARTS.WHEEL_FRONT_R;
        vCar.parts[4].type = CAR_PARTS.WHEEL_FRONT_L;
    });
}

function loadCarHigh(){
    loadMesh('./assets/camaro_body_high.obj').then( (data) => {
        let body = loadObj(data);
        vCar.parts[0].vertices = body.vertices;
        vCar.parts[0].normals = body.normals;
    });
    loadMesh('./assets/camaro_wheel_high.obj').then( (data) => {
        let wheel = loadObj(data);
        for(let i = 1; i<5; i++){
            vCar.parts[i].vertices = wheel.vertices;
            vCar.parts[i].normals = wheel.normals;
        }
    });
}

$(document).ready(function() {
    //loadMesh('./assets/camaro/Chevrolet_Camaro_SS_Low.obj', vCar, CAR_PARTS.BODY, CAR_PARTS.BODY);
    //loadMesh('./assets/camaro/Chevrolet_Camaro_SS_High.obj', vCar, CAR_PARTS.BODY, CAR_PARTS.BODY); // 151k e 149k

    loadCarLow();
    //loadCarHigh();
});

main();

