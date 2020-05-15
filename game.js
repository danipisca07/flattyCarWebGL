"use strict";

var CAMERA_MODE = {
    MENU: -1,
    FIRST_PERSON: 0,
    THIRD_PERSON: 1,
    FROM_TOP: 2,
}

var cameraSettings = {
    cameraMode: CAMERA_MODE.MENU,
    cameraPosition: [0, 0, 0],
    cameraRotation: [0, 0, 0],
    lookUpVector: [0, 1, 0],
    fieldOfViewRadians: degToRad(60),
    zNear: 0.1,
    zFar: 2000,
}

var key = [false, false, false, false]; //Vedi car.js per i codici tasti
var translation = [0, 0, 0];
var rotation = [degToRad(0), degToRad(0), degToRad(0)];
var scale = [1, 1, 1];

var gfxSettings = 'high';
var shadows = true;
var alphaBlending = true; // On/Off trasparenze
var ambientLight = 0.2; //Illuminazione di base (ambiente)
var pointLightPosition = [0, 10, 0.0]; //Posizione punto luce

var gl, baseCarMatrix;
var sceneObjects = new Array(); //Array contenente tutti gli oggetti della scena
var targetData; //Oggetto dove salverò i dati dell'oggetto bersaglio in modo da non doverlo ricaricare più volte
var newTargetMaxDistance = 10;

//Funzione di inizializzazione
$(document).ready(function () {
    gl = document.querySelector("#canvas").getContext("webgl");
    if (!gl) { alert("ERRORE! NESSUN CANVAS TROVATO!") }
    gl.clearColor(0, 0, 1, 0.2);
    const ext = gl.getExtension('WEBGL_depth_texture');
    if (!ext) {
        return alert('need WEBGL_depth_texture');
    }
    lib_init();

    //Caricamento oggetti scena
    loadCar('low');
    loadFloor();
    loadCube();
    loader.loadMesh('./assets/target.obj').then((data) => {
        let targetMesh = loader.loadObj(data);
        targetData = {
            vertices: targetMesh.vertices,
            normals: targetMesh.normals,
            textCoord: targetMesh.textCoord,
            color: [0, 0, 0, 1],
            shininess: 100,
        }
        loader.loadTexture(gl, targetData, './assets/target.jpg');
        createBuffers(gl, targetData);
    });
    startAnimating(60, drawScene);//Avvia la renderizzazione della scena
});

//Avvia il gioco
function start(){
    document.getElementById("startGame").style.display = 'none';
    cameraSettings.cameraMode = CAMERA_MODE.THIRD_PERSON;
    document.getElementById("cameraMode").disabled = false;
    //Abilita gli eventi di input
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    generateNewTarget(); //Genera un nuovo target in una posizione casuale
}

// Metodo di rendering
function drawScene(elapsed) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    vCar.doStep(key);//Aggiornamento fisica della macchina

    let textureMatrix = m4.identity();
    let shadowProjectionSettings = {
        aspectRatio : 1,
        fieldOfViewRadians : degToRad(160),
        zNear : 0.1,
        zFar : 100,
        cameraPosition : pointLightPosition,
        cameraRotation: [-degToRad(90), 0, 0],
    }
    let lightViewProjectionMatrix = getViewProjectionMatrix(gl, shadowProjectionSettings);
    textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = textureMatrix = m4.multiply(textureMatrix, lightViewProjectionMatrix);
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer); 
    gl.viewport(0,0,depthTextureSize, depthTextureSize);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(shadows && gfxSettings !== 'low'){//Calcola ombre
        sceneObjects.forEach((element) => renderElement(gl, element, lightViewProjectionMatrix, 'low'));
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(alphaBlending){
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    } else{
        gl.disable(gl.BLEND);
    }
    
    let viewProjectionMatrix;
    switch (cameraSettings.cameraMode) {
        case (CAMERA_MODE.MENU):
            /* Visuale menu principale */
            cameraSettings.lookAtTarget = [vCar.px, 0.5, vCar.pz];
            cameraSettings.cameraPosition = [-1, 1, -2]; //Posizione della camera relativa all'oggetto che sta seguendo
            viewProjectionMatrix = getViewProjectionMatrixLookAt(gl);
            break;
        case (CAMERA_MODE.FIRST_PERSON):
            /* Visuale prima persona */
            cameraSettings.cameraRotation = [0, degToRad(vCar.facing), 0]; //Orientazione della camera (stessa della macchina)
            cameraSettings.cameraPosition = [vCar.px, vCar.py + 1, vCar.pz]; //Posizione della camera (appena sopra la macchina)
            viewProjectionMatrix = getViewProjectionMatrix(gl);
            break;
        case (CAMERA_MODE.THIRD_PERSON):
            /* Visuale terza persona */
            //Obbiettivo a cui la camera deve puntare (appena sopra la macchina per puntare dove la macchina sta andando)
            cameraSettings.lookAtTarget = [vCar.px, vCar.py + 1, vCar.pz];
            cameraSettings.cameraOffset = [0, 1, 3]; //Posizione della camera relativa all'oggetto che sta seguendo
            cameraSettings.cameraRotation = [0, degToRad(vCar.facing), 0]; //Orientazione della camera (la stessa della macchina)
            viewProjectionMatrix = getViewProjectionMatrixFollow(gl);
            break;
        case (CAMERA_MODE.FROM_TOP):
            /* CAMERA AEREA */
            const FROM_TOP_DISTANCE = 7;
            cameraSettings.lookAtTarget = [vCar.px, vCar.py, vCar.pz], //Obbiettivo a cui la camera deve puntare
            cameraSettings.cameraPosition = [vCar.px, vCar.py + FROM_TOP_DISTANCE, vCar.pz + FROM_TOP_DISTANCE]; //Posizione della camera
            viewProjectionMatrix = getViewProjectionMatrixLookAt(gl);
            break;
    } 
    sceneObjects.forEach((element) => renderElement(gl, element, viewProjectionMatrix, gfxSettings, textureMatrix));
}

/*
//
//          CARICAMENTO OGGETTI IN SCENA
//
*/

//Genera un nuovo oggetto bersaglio automaticamente in una posizione casuale 
//(in una distanza limitata dalla posizione attuale del giocatore)
function generateNewTarget() {
    let startPos = [vCar.px, -0.08, vCar.pz];
    //Calcolo una posizione casuale
    startPos[0] += (Math.random() - 0.5) * 2 * newTargetMaxDistance;
    startPos[2] += (Math.random() - 0.5) * 2 * newTargetMaxDistance;
    var target = {
        parts: [
            targetData //Utilizzo la mesh precaricata (con buffers e texture)
        ],
        position: startPos,
        hit: false,
        getPartLocalMatrix: function (partType) {
            if (!this.hit) {
                let dist = m4.length(m4.subtractVectors(this.position, [vCar.px, vCar.py, vCar.pz]));
                if (dist < 0.75) { //Distanza dalla macchina minima per essere colpito
                    this.hit = true;
                    //Calcolo la nuova worldMatrix, con il bersaglio schiacciato a terra, che rimarra invariata d'ora in poi
                    let newPos = [startPos[0], startPos[1] - 0.1, startPos[2]];
                    let matrix = m4.lookAt(newPos, [vCar.px, vCar.py, vCar.pz], cameraSettings.lookUpVector);
                    matrix = m4.scale(matrix, 0.5, 0.5, 0.5);
                    matrix = m4.xRotate(matrix, degToRad(45));
                    this.worldMatrix = matrix; //Salvo la worldMatrix in modo da non doverla ricaricare più
                    generateNewTarget(); //Genero il prossimo bersaglio
                }
            }
            if (this.worldMatrix !== undefined) { //Se ho già caricato la worldMatrix finale significa che son già stato colpito
                return this.worldMatrix;
            }

            //Se non sono stato colpito seguo ("guardo") la macchina
            let matrix = m4.lookAt(startPos, [vCar.px, vCar.py, vCar.pz], cameraSettings.lookUpVector);
            matrix = m4.scale(matrix, 0.5, 0.5, 0.5);
            return matrix;
        },
    };
    sceneObjects.unshift(target); //Aggiungo il bersaglio all'inizio della lista degli oggetti dato che non ha trasparenza
}

//Effettua il caricamento dai file .obj dei modelli della macchina a definizione bassa
function loadCar(setting) {
    document.getElementById('loading').style.display = "block";
    let folder = "car_"+setting;
    vCar.parts = new Array();
    const bodyColor = [1, 0.5, 0, 1];
    const wheelColor = [0.1, 0.1, 0.1, 1];
    loader.loadMesh('./assets/'+folder+'/body.obj').then((data) => { //Carrozzeria
        let body = loader.loadObj(data); //Carica vertices e normal da file OBJ
        body.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        body.color = bodyColor;
        body.shininess = 100;
        createBuffers(gl, body);
        vCar.parts[0] = body;
        if (!vCar.loaded) {
            sceneObjects.push(vCar); //Aggiungo la macchina alla lista degli oggetti di scena, è importante aggiungerla come ultimo elemento
                                // dell' array in modo che venga renderizzata per ultima in modo da ottenere l'effetto trasparenza per i vetri
            vCar.loaded = true;
            //loadCar('high');//Avvia il caricamento dei modelli di più alta definizione
        }
        document.getElementById('loading').style.display = "none";
    });
    loader.loadMesh('./assets/'+folder+'/wheel.obj').then((data) => { //Ruote
        let wheel = loader.loadObj(data); //Carica il modello della ruota che verrà utilizzate per tutte e 4
        wheel.color = wheelColor;
        wheel.shininess = 1000;
        createBuffers(gl, wheel);
        for (let i = 1; i < 5; i++) {
            vCar.parts[i] = { ...wheel };
        }
        vCar.parts[1].type = CAR_PARTS.WHEEL_REAR_R;
        vCar.parts[2].type = CAR_PARTS.WHEEL_REAR_L;
        vCar.parts[3].type = CAR_PARTS.WHEEL_FRONT_R;
        vCar.parts[4].type = CAR_PARTS.WHEEL_FRONT_L;

    });
    loader.loadMesh('./assets/'+folder+'/doors.obj').then((data) => { //Sportelli
        let doors = loader.loadObj(data); //Carica vertices e normal da file OBJ
        doors.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        doors.color = bodyColor;
        doors.shininess = 100;
        createBuffers(gl, doors);
        loader.loadTexture(gl, doors, './assets/lee-number.png');
        vCar.parts[5] = doors;
    });
    loader.loadMesh('./assets/driver.obj').then((data) => { //Pilota
        let driver = loader.loadObj(data); //Carica vertices e normal da file OBJ
        driver.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        driver.color = [0,0,0,1];
        driver.shininess = 10;
        createBuffers(gl, driver);
        vCar.parts[6] = driver;
    });
    loader.loadMesh('./assets/'+folder+'/details.obj').then((data) => { //Particolari carrozzeria
        let details = loader.loadObj(data); //Carica vertices e normal da file OBJ
        details.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        details.color = [0.7,0.7,0.7,1];
        details.shininess = 50;
        createBuffers(gl, details);
        vCar.parts[7] = details;
    });
    loader.loadMesh('./assets/'+folder+'/glass.obj').then((data) => { //Vetri
        let glass = loader.loadObj(data); //Carica vertices e normal da file OBJ
        glass.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        glass.color = [0,0,0.2,0.5];
        glass.shininess = 10;
        createBuffers(gl, glass);
        vCar.parts[8] = glass;
    });
}

function loadFloor() {
    loader.loadMesh('./assets/floor.obj').then((data) => {
        let floorMesh = loader.loadObj(data);
        var floor = {
            parts: [
                {
                    vertices: floorMesh.vertices,
                    normals: floorMesh.normals,
                    textCoord: floorMesh.textCoord,
                    color: [0.3, 0.3, 0.3, 1],
                    shininess: 100000000000,
                }
            ],
            worldMatrix: getModelMatrix(m4.identity(), [50, 1, 50], [0, 0, 0], [0, 0, 0]),
            getPartLocalMatrix: function (partType) {
                return this.worldMatrix;
            },
        };
        loader.loadTexture(gl, floor.parts[0], './assets/asphalt.jpg', true);
        createBuffers(gl, floor.parts[0]);
        sceneObjects.unshift(floor); //Aggiungo il pavimento all'inizio della lista degli oggetti dato che non ha trasparenza
    });
}


function loadCube() {
    loader.loadMesh('./assets/texturedCube.obj').then((data) => {
        let cubeMesh = loader.loadObj(data);
        var cube = {
            parts: [
                {
                    vertices: cubeMesh.vertices,
                    normals: cubeMesh.normals,
                    textCoord: cubeMesh.textCoord,
                    color: [0, 0, 0, 1],
                    shininess: 10000,
                }
            ],
            worldMatrix: getModelMatrix(m4.identity(), [1, 1, 1], [0, 0, degToRad(90)], [0, 1, -10]),
            getPartLocalMatrix: function (partType) {
                return this.worldMatrix;
            },
        };
        createBuffers(gl, cube.parts[0]);
        loader.loadTexture(gl, cube.parts[0], './assets/f-tex.png');
        sceneObjects.unshift(cube); //Aggiungo il cubo all'inizio della lista degli oggetti dato che non ha trasparenza
    });
}

var loader = {

    //Caricamento asincrono di una mesh da file obj. Restituisce una promise 
    loadMesh : function (filename) {
        return $.ajax({
            url: filename,
            dataType: 'text',
        }).fail(function () {
            //alert('File [' + filename + "] non trovato!");
        });
    },

    //Caricamento .obj
    loadObj : function (content) {
        let newPart = new Object(); //La parte che rappresenta l'oggetto letto dal file .obj
        let mesh = new Object();
        mesh = ReadOBJ(content, mesh);
        newPart.vertices = new Array();
        if (mesh.texCoord != null)
            newPart.textCoord = new Array();
        newPart.normals = new Array();

        //Ciclo su ogni faccia e compongo gli array vertices e normals in base all'ordine delle facce
        for (let i = 0; i < mesh.nface; i++) { //Per ogni faccia
            let face = mesh.face[i + 1];
            let nIndices = 0; //Numero di indici nella faccia
            while (face.vert[nIndices] > 0) nIndices++;
            //Nei file OBJ le facce vengono indicate tramite la specifica TRIANGLE_FAN quindi ciclo con
            // una finestra scorrevole di dimensione 3. In questo modo mantengo la compatibilità anche
            // con file OBJ che specificato facce non triangolari
            for (let j = 0; j < nIndices - 2; j++) {
                try {
                    //Aggiungo i vertici della faccia
                    newPart.vertices.push(mesh.vert[face.vert[0]].x, mesh.vert[face.vert[0]].y, mesh.vert[face.vert[0]].z);
                    newPart.vertices.push(mesh.vert[face.vert[j + 1]].x, mesh.vert[face.vert[j + 1]].y, mesh.vert[face.vert[j + 1]].z);
                    newPart.vertices.push(mesh.vert[face.vert[j + 2]].x, mesh.vert[face.vert[j + 2]].y, mesh.vert[face.vert[j + 2]].z);
                    if (mesh.texCoord != null) {
                        //Aggiungo coordinate texture
                        newPart.textCoord.push(mesh.texCoord[(face.tcor[0] - 1) * 2], mesh.texCoord[(face.tcor[0] - 1) * 2 + 1]);
                        newPart.textCoord.push(mesh.texCoord[(face.tcor[j + 1] - 1) * 2], mesh.texCoord[(face.tcor[j + 1] - 1) * 2 + 1]);
                        newPart.textCoord.push(mesh.texCoord[(face.tcor[j + 2] - 1) * 2], mesh.texCoord[(face.tcor[j + 2] - 1) * 2 + 1]);
                    }
                    //Aggiungo le normali della faccia
                    newPart.normals.push(mesh.normals[(face.norm[0] - 1) * 3], mesh.normals[(face.norm[0] - 1) * 3 + 1], mesh.normals[(face.norm[0] - 1) * 3 + 2]);
                    newPart.normals.push(mesh.normals[(face.norm[j + 1] - 1) * 3], mesh.normals[(face.norm[j + 1] - 1) * 3 + 1], mesh.normals[(face.norm[j + 1] - 1) * 3 + 2]);
                    newPart.normals.push(mesh.normals[(face.norm[j + 2] - 1) * 3], mesh.normals[(face.norm[j + 2] - 1) * 3 + 1], mesh.normals[(face.norm[j + 2] - 1) * 3 + 2]);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        return newPart;
    },

    loadTexture : function (gl, target, textureSrc, generateMipmap) {
        generateMipmap = generateMipmap === undefined ? false : generateMipmap;
        let texImage = new Image();
        texImage.src = textureSrc;
        texImage.addEventListener('load', () => {
            createTexture(gl, target, texImage, generateMipmap);
        });
    }
}

/*
//
//          GESTIONE INPUT E INTERFACCIA
//
*/

function handleKey(e) {
    let pressing;
    if(e.type === 'keydown'){
        pressing = true;
    } else if(e.type=== 'keyup'){
        pressing=false;
    }
    switch (e.keyCode) {
        case KEYS.W_CODE:
            key[KEYS.W] = pressing;
            break;
        case KEYS.A_CODE:
            key[KEYS.A] = pressing;
            break;
        case KEYS.S_CODE:
            key[KEYS.S] = pressing;
            break;
        case KEYS.D_CODE:
            key[KEYS.D] = pressing;
            break;
        case KEYS.SPACE_CODE:
            key[KEYS.SPACE] = pressing;
            break;
    }
}

function toggleOnScreenControls(event) {
    var controls = document.getElementById("onScreenControls");
    if (event.currentTarget.checked) {
        controls.style.display = "block";
    } else {
        controls.style.display = "none";
    }
}

function eventBtn(btn, type) {
    console.log(type);
    switch (btn) {
        case 'up':
            key[KEYS.W] = type;
            break;
        case 'brake':
            key[KEYS.SPACE] = type;
            break;
        case 'down':
            key[KEYS.S] = type;
            break;
        case 'left':
            key[KEYS.A] = type;
            break;
        case 'right':
            key[KEYS.D] = type;
            break;
    }
}

function changeCameraHandler(e) {
    key = [false, false, false, false];
    cameraSettings.cameraMode = event.target.selectedIndex;
}


