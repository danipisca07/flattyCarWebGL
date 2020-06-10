"use strict";

//Varie tipologie di telecamera
var CAMERA_MODE = {
    MENU: -1,
    FIRST_PERSON: 0,
    THIRD_PERSON: 1,
    FROM_TOP: 2,
}

//Impostazioni iniziali telecamera
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

var gfxSettings = 'shadows'; //Impostazione grafica
var alphaBlending = true; // On/Off trasparenze
var ambientLight = 0.2; //Illuminazione di base (ambiente)
var pointLightPosition = [10, 40, 0.0]; //Posizione punto luce

//Proiezione dal punto luce verso il centro della scena per creare la shadow map
let shadowProjectionSettings = {
    aspectRatio : 1,
    fieldOfViewRadians : degToRad(70),
    zNear : 35,
    zFar : 50,
    cameraPosition : pointLightPosition,
    lookAtTarget: [3,0,0], //Guardo al centro della scena
    lookUpVector: [0,0,-1]
}

var gl;
var skybox; //Lo skybox viene mantenuto separatamente in quanto non influenzato dall'illuminazione
var sceneObjects = new Array(); //Array contenente tutti gli oggetti della scena
var targetData; //Oggetto dove salverò i dati dell'oggetto bersaglio in modo da non doverlo ricaricare più volte
var newTargetMaxDistance = 10; //Massima distanza di spawn di un nuovo bersaglio dalla posizione attuale della macchina
var score = 0; //Punteggio

//Funzione di inizializzazione
$(document).ready(function () {
    gl = document.querySelector("#canvas").getContext("webgl");
    if (!gl) { alert("ERRORE! NESSUN CANVAS TROVATO!") }
    gl.clearColor(0, 0, 1, 0.2);
    gl.ext = gl.getExtension('WEBGL_depth_texture');
    if (!gl.ext) {
        return alert('need WEBGL_depth_texture');
    }

    //Caricamento oggetti scena
    loadCar('low');
    loadFloor();
    loadFence();
    loadSkybox();
    loadCube([0, 5, -10], './assets/danielepiscaglia.jpg');
    loader.loadMesh('./assets/target.obj').then((data) => { //Precarica la mesh del bersaglio
        let targetMesh = loader.loadObj(data);
        targetData = {
            vertices: targetMesh.vertices,
            normals: targetMesh.normals,
            textCoord: targetMesh.textCoord,
            color: [0, 0, 0, 1],
            shininess: 100,
        }
        loader.loadTexture(gl, targetData, './assets/target.jpg', true);
        createBuffers(gl, targetData);
    });
    startAnimating(60, drawScene);//Avvia la renderizzazione della scena a 60 fps
});

//Avvia il gioco
function start(){
    document.getElementById("startMenu").style.display = 'none';
    document.getElementById("controlPanel").style.display = 'block';
    document.getElementById("score").style.display = 'flex';
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

    /* Rendering delle ombre dinamiche sulla scena */
    let depthProjectionMatrix = m4.identity(); //Matrice per la trasformazione di vista della depth texture
    if(gl.ext && gfxSettings === 'shadows'){//Calcola ombre solo se attive e impostazione su high (illuminazione abilitata) (e estensione disponibile)
        let lightViewProjectionMatrix = getViewProjectionMatrixLookAt(gl, shadowProjectionSettings);
        //Devo scalare e traslare la matrice texture perchè altrimenti viene utilizzato solamente il "quarto" di quadrante in alto a destra del frustrum di proiezione
        depthProjectionMatrix = getManipulationMatrix(depthProjectionMatrix, [0.5, 0.5, 0.5], [0,0,0], [0.5, 0.5, 0.5]);
        depthProjectionMatrix = m4.multiply(depthProjectionMatrix, lightViewProjectionMatrix);
        gl.bindFramebuffer(gl.FRAMEBUFFER, getDepthFramebuffer());
        gl.viewport(0,0,getDepthTextureSize(), getDepthTextureSize());
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        setupShaders(gl, 'shadowProjection'); //Imposto lo shader per la proizione delle ombre
        sceneObjects.forEach((element) => {
            if(!element.noShadows) //Se l'oggetto non deve creare ombre non lo considero
                renderElement(gl, element, lightViewProjectionMatrix)
        });
    }
    /* Rendering della scena */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(alphaBlending){ //Attivo la trasparenza
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    } else{
        gl.disable(gl.BLEND);
    }

    /* Calcolo matrice viewProjection per la camera corrente */
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
    //Render skybox
    setupShaders(gl, "skybox");
    renderSkybox(gl, skybox, viewProjectionMatrix);
    //Render scena
    setupShaders(gl, gfxSettings);
    for(let i = 0; i<sceneObjects.length; i++){
        renderElement(gl, sceneObjects[i], viewProjectionMatrix, depthProjectionMatrix); //Ciclo di rendering degli oggetti
    }

}

/*
//
//          CARICAMENTO OGGETTI IN SCENA
//
*/

function scoreHandler(){
    score++;
    document.getElementById("scoreElement").innerText = score;
    document.getElementById("score").style.color = 'red'; //Cambia il colore del punteggio per evidenziare il punto
    setTimeout(() => {
        document.getElementById("score").style.color = 'white'; //Ripristina il colore dopo un secondo
    }, 150);
}

//Genera un nuovo oggetto bersaglio automaticamente in una posizione casuale 
//(in una distanza limitata dalla posizione attuale del giocatore)
function generateNewTarget() {
    let startPos = [0, -0.08, 0];
    //Calcolo una posizione casuale (a max distanza dalla macchina e all'interno del recinto)
    do{
        startPos[0] = vCar.px + (Math.random() - 0.5) * 2 * newTargetMaxDistance;
        startPos[2] = vCar.pz + (Math.random() - 0.5) * 2 * newTargetMaxDistance;
    } while(Math.sqrt( Math.pow(startPos[0],2) + Math.pow(startPos[2],2) ) > vCar.maxD -8);
    var target = {
        name: 'target'+sceneObjects.length,
        parts: [
            targetData //Utilizzo la mesh precaricata (con buffers e texture)
        ],
        position: startPos,
        hit: false, //bool che indica se il bersaglio è stato colpito
        getPartLocalMatrix: function (partType) {
            if (!this.hit) {
                let dist = m4.length(m4.subtractVectors(this.position, [vCar.px, vCar.py, vCar.pz]));
                if (dist < 0.75) { //Distanza dalla macchina minima per essere colpito
                    this.hit = true;
                    //Calcolo la nuova worldMatrix, con il bersaglio schiacciato a terra, che rimarra invariata d'ora in poi
                    let newPos = [startPos[0], startPos[1] - 0.15, startPos[2]];
                    let matrix = m4.lookAt(newPos, [vCar.px, 0, vCar.pz], cameraSettings.lookUpVector);
                    matrix = m4.scale(matrix, 0.5, 0.5, 0.5);
                    matrix = m4.xRotate(matrix, degToRad(45));
                    this.worldMatrix = matrix; //Salvo la worldMatrix in modo da non doverla ricaricare più
                    generateNewTarget(); //Genero il prossimo bersaglio
                    scoreHandler(); //Aggiorno punteggio
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
    let folder = "car_"+setting; //In base al settaggio grafico della macchina carico i modelli dalla cartella corrispondente
    vCar.parts = new Array();
    const bodyColor = [1, 0.5, 0, 1];
    const wheelColor = [0.1, 0.1, 0.1, 1];
    //Le varie componenti della macchina sono state separate in obj diversi quindi carico tutte le parti
    loader.loadMesh('./assets/'+folder+'/body.obj').then((data) => { //Carrozzeria
        let body = loader.loadObj(data); //Carica vertices e normal da file OBJ
        body.type = CAR_PARTS.BODY; //Tipo utilizzato per il posizionamento nel sistema di riferimento locale
        body.color = bodyColor;
        body.shininess = 100;
        createBuffers(gl, body); //Carico i dati nei buffers
        vCar.parts[0] = body;
        if (!vCar.loaded) {
            sceneObjects.push(vCar); //Aggiungo la macchina alla lista degli oggetti di scena, è importante aggiungerla come ultimo elemento
                                // dell' array in modo che venga renderizzata per ultima in modo da ottenere l'effetto trasparenza per i vetri
            vCar.loaded = true;
        }
        document.getElementById('loading').style.display = "none";
    });
    loader.loadMesh('./assets/'+folder+'/wheel.obj').then((data) => { //Ruote
        let wheel = loader.loadObj(data); //Carica il modello della ruota che verrà utilizzate per tutte e 4
        wheel.color = wheelColor;
        wheel.shininess = 0;
        createBuffers(gl, wheel);
        for (let i = 1; i < 5; i++) { //Stessa mesh per tutte e 4 le ruote
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
        loader.loadTexture(gl, doors, './assets/lee-number.png', true); //Carico la texture
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
            name: 'floor',
            parts: [
                {
                    vertices: floorMesh.vertices,
                    normals: floorMesh.normals,
                    textCoord: floorMesh.textCoord,
                    color: [0.3, 0.3, 0.3, 1],
                    shininess: 0,
                }
            ],
            worldMatrix: getManipulationMatrix(m4.identity(), [50, 1, 50], [0, 0, 0], [0, 0, 0]),
            getPartLocalMatrix: function (partType) {
                return this.worldMatrix;
            },
        };
        loader.loadTexture(gl, floor.parts[0], './assets/skybox/neg-y.png', false);
        createBuffers(gl, floor.parts[0]);
        sceneObjects.unshift(floor); //Aggiungo il pavimento all'inizio della lista degli oggetti dato che non ha trasparenza
    });
}

function loadFence() {
    loader.loadMesh('./assets/fence.obj').then((data) => {
        let fenceMesh = loader.loadObj(data);
        var fence = {
            name: 'fence',
            parts: [
                {
                    vertices: fenceMesh.vertices,
                    normals: fenceMesh.normals,
                    textCoord: fenceMesh.textCoord,
                    color: [0,0,0,0],
                    shininess: 0,
                }
            ],
            noShadows : true,
            worldMatrix: getManipulationMatrix(m4.identity(), [30, 20, 30], [0, 0, 0], [0, 0, 0]),
            getPartLocalMatrix: function (partType) {
                return this.worldMatrix;
            },
        };
        loader.loadTexture(gl, fence.parts[0], './assets/fence.png', false);
        createBuffers(gl, fence.parts[0]);
        sceneObjects.push(fence); //Aggiungo il pavimento all'inizio della lista degli oggetti dato che non ha trasparenza
    });
}

//Carica le texture e i dati dello skybox nei buffer
function loadSkybox(){
    skybox = {
        vertices : [
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
          ],
    };
    let arrays = {
        position: { data: skybox.vertices, numComponents: 2 },
    };
    skybox.bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
        {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: './assets/skybox/pos-x.png',
        },
        {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: './assets/skybox/neg-x.png',
        },
        {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: './assets/skybox/pos-y.png',
        },
        {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: './assets/skybox/neg-y.png',
        },
        {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        url: './assets/skybox/pos-z.png',
        },
        {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        url: './assets/skybox/neg-z.png',
        },
    ];
    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;

        const width = 256;
        const height = 256;
        gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    skybox.samplerCube = texture;
}


function loadCube(position, textureUrl) {
    loader.loadMesh('./assets/texturedCube.obj').then((data) => {
        let cubeMesh = loader.loadObj(data);
        var cube = {
            name: 'texturedCube',
            parts: [
                {
                    vertices: cubeMesh.vertices,
                    normals: cubeMesh.normals,
                    textCoord: cubeMesh.textCoord,
                    color: [0, 0, 0, 1],
                    shininess: 0,
                }
            ],
            worldMatrix: getManipulationMatrix(m4.identity(), [1, 1, 1], [0, 0, degToRad(90)], position),
            getPartLocalMatrix: function (partType) {
                return this.worldMatrix;
            },
        };
        createBuffers(gl, cube.parts[0]);
        loader.loadTexture(gl, cube.parts[0], textureUrl, true);
        sceneObjects.unshift(cube); //Aggiungo il cubo all'inizio della lista degli oggetti dato che non ha trasparenza
    });
}

//Oggetto helper per il caricamento degli .obj
var loader = {

    //Caricamento asincrono di una mesh da file obj. Restituisce una promise 
    loadMesh : function (filename) {
        return $.ajax({
            url: filename,
            dataType: 'text',
        }).fail(function () {
            alert('File [' + filename + "] non trovato!");
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

    loadTexture : function (gl, target, textureSrc, clampToEdge) {
        clampToEdge = clampToEdge === undefined ? false : clampToEdge;
        let texImage = new Image();
        texImage.src = textureSrc;
        texImage.addEventListener('load', () => {
            createTexture(gl, target, texImage, clampToEdge);
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

function enableOnScreenControls() {
    var controls = document.getElementById("onScreenControls");
    controls.style.display = "block";
}

function eventBtn(btn, type) {
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


