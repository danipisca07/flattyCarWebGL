"use strict";

var CAMERA_MODE = {
    FIRST_PERSON : 0,
    THIRD_PERSON : 1,
    FROM_TOP: 2,
}

var cameraSettings = { 
    cameraMode : CAMERA_MODE.THIRD_PERSON,
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
var pointLightPosition = [10.0, 10.0, 0.0 ]; //Posizione punto luce

var gl, baseCarMatrix;
var sceneObjects = new Array(); //Array contenente tutti gli oggetti della scena

$(document).ready(function() {
    gl = document.querySelector("#canvas").getContext("webgl");
    if (!gl) { alert("ERRORE! NESSUN CANVAS TROVATO!") }
    setupUI();
    

    //Caricamento oggetti
    loadCar('low');
    loadMesh('./assets/floor.obj').then( (data) => {
        let floorMesh = loadObj(data);
        var floor = {
            parts : [
                {
                    vertices : floorMesh.vertices,
                    normals : floorMesh.normals,
                    textCoord : floorMesh.textCoord,
                    color: [0.3,0.3,0.3,1],
                    shininess: 1000,
                }
            ],
            drawMode : 'arrays',
            worldMatrix : getLocalMatrix(m4.identity(), [1000,1,1000], [0,0,0], [0,0,0] ),
            getPartLocalMatrix : function(partType){
                return this.worldMatrix;
            },
        };
        sceneObjects.push(floor);
    });
    loadMesh('./assets/texturedCube.obj').then( (data) => {
        let cubeMesh = loadObj(data);
        var cube = {
            parts : [
                {
                    vertices : cubeMesh.vertices,
                    normals : cubeMesh.normals,
                    textCoord : cubeMesh.textCoord,
                    color: [0.3,1,0.3,1],
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

// Metodo di rendering
function drawScene(elapsed) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    let viewProjectionMatrix;
    switch(cameraSettings.cameraMode){
        case(CAMERA_MODE.FIRST_PERSON):
            /* Visuale prima persona */
            cameraSettings.cameraRotation = [0, degToRad(vCar.facing), 0]; //Orientazione della camera (stessa della macchina)
            cameraSettings.cameraPosition = [vCar.px, vCar.py+1, vCar.pz]; //Posizione della camera (appena sopra la macchina)
            viewProjectionMatrix = getViewProjectionMatrix(gl);
            break;
        case(CAMERA_MODE.THIRD_PERSON):
            /* Visuale terza persona */
            //Obbiettivo a cui la camera deve puntare (appena sopra la macchina per puntare dove la macchina sta andando)
            cameraSettings.lookAtTarget = [vCar.px, vCar.py+1, vCar.pz];
            cameraSettings.cameraOffset = [0, 1, 3]; //Posizione della camera relativa all'oggetto che sta seguendo
            cameraSettings.cameraRotation = [0, degToRad(vCar.facing), 0]; //Orientazione della camera (la stessa della macchina)
            viewProjectionMatrix = getViewProjectionMatrixFollow(gl);
            break;
        case(CAMERA_MODE.FROM_TOP):
            /* CAMERA AEREA */
            cameraSettings.lookAtTarget = [vCar.px, vCar.py, vCar.pz], //Obbiettivo a cui la camera deve puntare
            cameraSettings.cameraPosition = [vCar.px, vCar.py+7, vCar.pz+7]; //Posizione della camera
            viewProjectionMatrix = getViewProjectionMatrixLookAt(gl);
            break;
    }
    vCar.doStep(key);//Aggiornamento fisica della macchina

    sceneObjects.forEach((element) => renderElement(gl, element, viewProjectionMatrix, gfxSettings) );
}

var key=[false,false,false,false]; //Vedi car.js per i codici tasti
window.addEventListener('keydown', doKeyDown, true);
function doKeyDown(e){
    switch(e.keyCode){
        case KEYS.W_CODE:
            key[KEYS.W]=true;
            break;
        case KEYS.A_CODE:
            key[KEYS.A]=true;
            break;
        case KEYS.S_CODE:
            key[KEYS.S]=true;
            break;
        case KEYS.D_CODE:
            key[KEYS.D]=true;
            break;
    }
}
window.addEventListener('keyup', doKeyUp, true);
function doKeyUp(e){
    switch(e.keyCode){
        case KEYS.W_CODE:
            key[KEYS.W]=false;
            break;
        case KEYS.A_CODE:
            key[KEYS.A]=false;
            break;
        case KEYS.S_CODE:
            key[KEYS.S]=false;
            break;
        case KEYS.D_CODE:
            key[KEYS.D]=false;
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
    vCar.worldMatrix = m4.translation(0, 0.28,0);
    const bodyColor = [1, 0.5, 0, 1];
    const wheelColor = [0.1, 0.1, 0.1, 1];
    loadMesh('./assets/camaro_body_'+setting+'.obj').then( (data) => {
        let body = loadObj(data); //Carica vertices e normal da file OBJ
        body.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        body.color = bodyColor;
        body.shininess = 100;
        vCar.parts[0] = body;
        vCar.drawMode = 'arrays';
        if(!vCar.loaded){
            sceneObjects.push(vCar);
            vCar.loaded = true; 
            startAnimating(60, drawScene);//Avvia la renderizzazione della scena
            //loadCar('high');//Avvia il caricamento dei modelli di più alta definizione
        }
    });
    loadMesh('./assets/camaro_wheel_'+setting+'.obj').then( (data) => {
        let wheel = loadObj(data); //Carica il modello della ruota che verrà utilizzate per tutte e 4
        wheel.color = wheelColor;
        wheel.shininess = 1000;
        for(let i = 1; i<5; i++){
            vCar.parts[i] = {...wheel};
        }
        vCar.parts[1].type = CAR_PARTS.WHEEL_REAR_R;
        vCar.parts[2].type = CAR_PARTS.WHEEL_REAR_L;
        vCar.parts[3].type = CAR_PARTS.WHEEL_FRONT_R;
        vCar.parts[4].type = CAR_PARTS.WHEEL_FRONT_L;
    });
    setting = 'low';
    loadMesh('./assets/camaro_doors_'+setting+'.obj').then( (data) => {
        let body = loadObj(data); //Carica vertices e normal da file OBJ
        body.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        body.color = bodyColor;
        body.shininess = 100;
        vCar.parts[5] = body;
        var texImage = new Image();
        texImage.src = './assets/lee-number.png';
        texImage.addEventListener('load', () =>{
            vCar.parts[5].texture = texImage;
        });         
    });
}

function changeCameraHandler(e){
    key = [false, false, false, false];
    cameraSettings.cameraMode = event.target.selectedIndex;
}



