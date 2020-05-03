"use strict";

var cameraSettings = { 
    cameraPosition : [0, 0, 0],
    cameraRotation : [0, 0, 0],
    lookUpVector : [0, 1, 0],
    fieldOfViewRadians : degToRad(48),
    zNear : 0.1,
    zFar : 2000,
}

var translation = [0,0,0];
var rotation = [degToRad(0), degToRad(0), degToRad(0)];
var scale = [1,1,1]; 

var gfxSettings = 'high';
var ambientLight = 0.2; //Illuminazione di base (ambiente)
var pointLightPosition = [0.0, 5.0, 0.0 ]; //Posizione punto luce

var gl, baseCarMatrix;
var sceneObjects = new Array(); //Array contenente tutti gli oggetti della scena

function init() {
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    gl = canvas.getContext("webgl");
    if (!gl) { alert("ERRORE! NESSUN CANVAS TROVATO!") }

    //Pavimento
    floor.worldMatrix = m4.scaling(3000,1,3000);
    sceneObjects.push(floor);
    //Macchina
    vCar.worldMatrix = m4.translation(0, 0.28,0);
    sceneObjects.push(vCar);
    setupUI();
    
}

// Metodo di rendering
function drawScene(elapsed) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    /* CAMERA AEREA */
    /* cameraSettings.lookAtTarget = [vCar.px, vCar.py, vCar.pz], //Obbiettivo a cui la camera deve puntare
    cameraSettings.cameraPosition = [vCar.px, vCar.py+7, vCar.pz+7]; //Posizione della camera
    let viewProjectionMatrix = getViewProjectionMatrixLookAt(gl); */

    /* Visuale prima persona */
    /* cameraSettings.cameraRotation = [0, degToRad(vCar.facing), 0]; //Orientazione della camera (stessa della macchina)
    cameraSettings.cameraPosition = [vCar.px, vCar.py+1, vCar.pz]; //Posizione della camera (appena sopra la macchina)
    let viewProjectionMatrix = getViewProjectionMatrix(gl); */

    /* Visuale terza persona */
    //Obbiettivo a cui la camera deve puntare (appena sopra la macchina per puntare dove la macchina sta andando)
    cameraSettings.lookAtTarget = [vCar.px, vCar.py+1, vCar.pz];
    cameraSettings.cameraOffset = [0, 1, 3]; //Posizione della camera relativa all'oggetto che sta seguendo
    cameraSettings.cameraRotation = [0, degToRad(vCar.facing), 0]; //Orientazione della camera (la stessa della macchina)
    let viewProjectionMatrix = getViewProjectionMatrixFollow(gl);
    
    vCar.doStep(key);//Aggiornamento fisica della macchina

    sceneObjects.forEach((element) => renderElement(gl, element, viewProjectionMatrix, gfxSettings) );
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
    let newPart = new Object(); //La parte che rappresenta l'oggetto letto dal file .obj
    //let indices = new Array();
    let mesh = new Object();
    //let mesh = new subd_mesh();
    mesh = ReadOBJ(content, mesh);
    newPart.vertices = new Array();
    if(mesh.texCoord != null)
        newPart.textCoord = new Array();
    newPart.normals = new Array();
    //newPart.indices = indices;

    //Ciclo su ogni faccia e compongo gli array vertices e normals in base all'ordine delle facce
    for(let i=0; i<mesh.nface; i++){ //Per ogni faccia
        let face = mesh.face[i+1];
        let nIndices = 0; //Numero di indici nella faccia
        while(face.vert[nIndices]>0) nIndices++;
        //Nei file OBJ le facce vengono indicate tramite la specifica TRIANGLE_FAN quindi ciclo con
        // una finestra scorrevole di dimensione 3. In questo modo mantengo la compatibilità anche
        // con file OBJ che specificato facce non triangolari
        for(let j=0; j<nIndices-2; j++){
            /* indices.push(face[0]-1);
            indices.push(face[j+1]-1);
            indices.push(face[j+2]-1); */
            try {
                //Aggiungo i vertici della faccia
                newPart.vertices.push(mesh.vert[face.vert[0]].x,mesh.vert[face.vert[0]].y,mesh.vert[face.vert[0]].z);
                newPart.vertices.push(mesh.vert[face.vert[j+1]].x,mesh.vert[face.vert[j+1]].y,mesh.vert[face.vert[j+1]].z);
                newPart.vertices.push(mesh.vert[face.vert[j+2]].x,mesh.vert[face.vert[j+2]].y,mesh.vert[face.vert[j+2]].z);
                if(mesh.texCoord != null){
                    //Aggiungo coordinate texture
                    newPart.textCoord.push(mesh.texCoord[(face.tcor[0]-1)*2], mesh.texCoord[(face.tcor[0]-1)*2+1]);
                    newPart.textCoord.push(mesh.texCoord[(face.tcor[j+1]-1)*2], mesh.texCoord[(face.tcor[j+1]-1)*2+1]);
                    newPart.textCoord.push(mesh.texCoord[(face.tcor[j+2]-1)*2], mesh.texCoord[(face.tcor[j+2]-1)*2+1]);    
                }
                //Aggiungo le normali della faccia
                newPart.normals.push(mesh.normals[(face.norm[0]-1)*3], mesh.normals[(face.norm[0]-1)*3+1], mesh.normals[(face.norm[0]-1)*3+2]);
                newPart.normals.push(mesh.normals[(face.norm[j+1]-1)*3], mesh.normals[(face.norm[j+1]-1)*3+1], mesh.normals[(face.norm[j+1]-1)*3+2]);
                newPart.normals.push(mesh.normals[(face.norm[j+2]-1)*3], mesh.normals[(face.norm[j+2]-1)*3+1], mesh.normals[(face.norm[j+2]-1)*3+2]);
            }
            catch(e){
                console.log(e);
            }
        }
        //indices = new Array();for(let j=0; j<nIndices; j++) indices.push(face[j]-1); //ordine TRIANGLE_FAN
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

//Caricamento asincrono di una mesh da file obj. Restituisce una promise 
function loadMesh(filename) {
    return $.ajax({
        url: filename,
        dataType: 'text'
    }).fail(function() {
        alert('File [' + filename + "] non trovato!");
    });
}

//Effettua il caricamento dai file .obj dei modelli della macchina a definizione bassa
function loadCar(setting){
    loadMesh('./assets/camaro_body_'+setting+'.obj').then( (data) => {
        let body = loadObj(data); //Carica vertices e normal da file OBJ
        body.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        body.color = [0.1, 0.8, 0.1, 1];
        body.shininess = 100;
        vCar.parts[0] = body;
        vCar.drawMode = 'arrays'; 
        if(!vCar.loaded){
            //Avvia la renderizzazione della scena
            vCar.loaded = true; 
            startAnimating(60, drawScene);
            //loadCar('high');//Avvia il caricamento dei modelli di più alta definizione
        }
        
    });
    loadMesh('./assets/camaro_wheel_'+setting+'.obj').then( (data) => {
        let wheel = loadObj(data); //Carica il modello della ruota che verrà utilizzate per tutte e 4
        wheel.color = [0.1, 0.1, 0.1, 1];
        wheel.shininess = 1000;
        for(let i = 1; i<5; i++){
            vCar.parts[i] = {...wheel};
        }
        vCar.parts[1].type = CAR_PARTS.WHEEL_REAR_R;
        vCar.parts[2].type = CAR_PARTS.WHEEL_REAR_L;
        vCar.parts[3].type = CAR_PARTS.WHEEL_FRONT_R;
        vCar.parts[4].type = CAR_PARTS.WHEEL_FRONT_L;
    });
}


$(document).ready(function() {
    //loadMesh('./assets/camaro/Chevrolet_Camaro_SS_Low.obj', vCar, CAR_PARTS.BODY, CAR_PARTS.BODY);
    //loadMesh('./assets/camaro/Chevrolet_Camaro_SS_High.obj', vCar, CAR_PARTS.BODY, CAR_PARTS.BODY); // 151k e 149k

    loadCar('low');
    loadMesh('./assets/texturedCube.obj').then( (data) => {
        let cubeMesh = loadObj(data);
        var cube = { //L'ordine delle coordinate texture è corretto???????????????????
            parts : [
                {
                    vertices : cubeMesh.vertices,
                    normals : cubeMesh.normals,
                    textCoord : cubeMesh.textCoord,
                    color: [0.3,0.3,0.3,1],
                    shininess: 100,
                }
            ],
            isTextured: true,
            drawMode : 'arrays',
            worldMatrix : getLocalMatrix(m4.identity(), [1,1,1], [0,0,degToRad(90)], [0,1,-10] ),
            getPartLocalMatrix : function(partType){
                return this.worldMatrix;
            },
        };
        var texImage = new Image();
        texImage.src = './assets/f-tex.png';
        texImage.addEventListener('load', () =>{
            cube.parts[0].texture = texImage;
            sceneObjects.push(cube);
        });
    });
});

init();

