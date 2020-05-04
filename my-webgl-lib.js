//FUNZIONI TRIGONOMETRICHE
function radToDeg(r) {
    return r * 180 / Math.PI;
}

function degToRad(d) {
    return d * Math.PI / 180;
}

//FUNZIONI VETTORI TRIDIMENSIONALI
function addVec3(a,b){
    return new Array(a[0]+b[0], a[1]+b[1], a[2]+b[2]);
}

function multiplyVec3(a,b){
    return new Array(a[0]*b[0], a[1]*b[1], a[2]*b[2]);
}

function multiplyVec3Scalar(v, scalar){
    return new Array(v[0]*scalar, v[1]*scalar, v[2]*scalar);
}

//FUNZIONI MATRICI
//Funzione per ottere la matrice di manipolazione di un oggetto(anche composto da più parti) nello spazio, 
// anche chiamata worldMatrix o modelMatrix, quindi applica le trasformazioni nell'ordine matrix*T*R*S
function getManipulationMatrix(matrix, scale, rotation, translation){
    if(scale != undefined)
    {
        if(scale.length !== 3) alert("getManipulationMatrix: Attenzione, dimensione scale != 3!!");
        matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    }
    if(rotation != undefined)
    {
        if(scale.length !== 3) alert("getManipulationMatrix: Attenzione, dimensione rotation != 3!!");
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
    }
    if(translation != undefined)
    {
        if(scale.length !== 3) alert("getManipulationMatrix: Attenzione, dimensione translation != 3!!");
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    }
    return matrix;
}

//Funzione per ottere la matrice di manipolazione di una parte di un oggetto rispetto alla worldMatrix dell' oggetto radice, 
// solitamente chiamata LocalMatrix, quindi applica le trasformazioni nell'ordine matrix*S*R*T
function getLocalMatrix(matrix, scale, rotation, translation){
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    return matrix;
}

function getProjectionMatrix(gl, cameraSettings){
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(cameraSettings.fieldOfViewRadians, aspect, 
        cameraSettings.zNear, cameraSettings.zFar);
    return projectionMatrix;
}

//Restituisce la ViewProjectionMatrix per una telecamera prospettiva con obbiettivo lookAt
// cameraSettings: impostazioni camera, se undefined utilizza quelle predefinite
function getViewProjectionMatrixLookAt(gl, cameraSettings){
    if(cameraSettings == undefined) cameraSettings = this.cameraSettings;
    var projectionMatrix = getProjectionMatrix(gl,cameraSettings);

    var cameraMatrix = m4.lookAt(cameraSettings.cameraPosition, cameraSettings.lookAtTarget, cameraSettings.lookUpVector);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}

//Restituisce la ViewProjectionMatrix per una telecamera prospettiva con posizione e rotazione
// definite da cameraPosition e cameraRotation
// cameraSettings: impostazioni camera, se undefined utilizza quelle predefinite
function getViewProjectionMatrix(gl, cameraSettings){
    if(cameraSettings == undefined) cameraSettings = this.cameraSettings;
    var projectionMatrix = getProjectionMatrix(gl,cameraSettings);
    
    var cameraMatrix = m4.identity();
    cameraMatrix= m4.translate(cameraMatrix, 
        cameraSettings.cameraPosition[0],cameraSettings.cameraPosition[1],cameraSettings.cameraPosition[2]);
    cameraMatrix = m4.xRotate(cameraMatrix, cameraSettings.cameraRotation[0]);
    cameraMatrix = m4.yRotate(cameraMatrix, cameraSettings.cameraRotation[1]);
    cameraMatrix = m4.zRotate(cameraMatrix, cameraSettings.cameraRotation[2]);
    
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}

//Restituisce la ViewProjectionMatrix per una telecamera prospettiva che segue l'obbiettivo lookAtTarget
// da un distanza definita da cameraOffset e un angolazione relativa definita da cameraRotation
// cameraSettings: impostazioni camera, se undefined utilizza quelle predefinite
function getViewProjectionMatrixFollow(gl, cameraSettings){
    if(cameraSettings == undefined) cameraSettings = this.cameraSettings;
    var projectionMatrix = getProjectionMatrix(gl,cameraSettings);

    var cameraMatrix = m4.identity();
    cameraMatrix= m4.translate(cameraMatrix, 
        cameraSettings.lookAtTarget[0],cameraSettings.lookAtTarget[1],cameraSettings.lookAtTarget[2]);
    if(cameraSettings.cameraRotation != undefined){
        cameraMatrix = m4.xRotate(cameraMatrix, cameraSettings.cameraRotation[0]);
        cameraMatrix = m4.yRotate(cameraMatrix, cameraSettings.cameraRotation[1]);
        cameraMatrix = m4.zRotate(cameraMatrix, cameraSettings.cameraRotation[2]);
    }
    cameraMatrix= m4.translate(cameraMatrix, 
        cameraSettings.cameraOffset[0],cameraSettings.cameraOffset[1],cameraSettings.cameraOffset[2]);

    cameraSettings.cameraPosition = [cameraMatrix[12],cameraMatrix[13], cameraMatrix[14]];
    var cameraMatrix = m4.lookAt(cameraSettings.cameraPosition, cameraSettings.lookAtTarget, cameraSettings.lookUpVector);
    
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}

// ANIMAZIONE
var fpsInterval, now, then, elapsed;
let renderFunction;
function startAnimating(fps, renderFunction){
    this.renderFunction = renderFunction; //Imposta la funzione da richiamare per ogni rendering (definita in game.js)
    fpsInterval = 1000 / fps; //Imposta un intervallo di tempo minimo per gli fps (fps limiter)
    then = Date.now();
    animate();
}
function animate() {
    requestAnimationFrame(animate);
    now = Date.now();
    elapsed = now - then; //Calcola il tempo passato dall'ultimo frame
    if (elapsed > fpsInterval) { //Nuovo frame solo se è passato abbastanza tempo dall'ultimo frame (fps limiter)
        then = now - (elapsed % fpsInterval); //Aggiorna il tempo dell'ultimo frame
        this.renderFunction(elapsed); //Render nuovo frame
    }
}

let lastShaders = null; let program; //Variabili utilizzate per mantenere l'ultimo shader caricato (evitano il ricaricamento se non necessario)
let lastBufferInfo = null; let arrays; //Variabili utilizzate per mantenere gli ultimi buffer caricati (evitano il ricaricamento se non necessario)
//RENDERING OGGETTI MIA LIBRERIA
function renderElement(gl, model, viewProjectionMatrix, gfxSettings){
    if(gfxSettings === undefined) gfxSettings = this.gfxSettings;
    let shaders = shaderScripts[gfxSettings];
    if(shaders === undefined) alert("Settaggio grafico sconosciuto, controllare impostazioni!");
    if(shaders !== lastShaders) //Ricarico gli shader solo se necessario
    { 
        lastShaders = shaders;
        program = webglUtils.createProgramFromSources(gl, [ shaders.vertexShader, shaders.fragmentShader]);
        gl.useProgram(program);
        lastBufferInfo = null; //Se ricarico gli shader dovrò per forza ricaricare anche tutti i buffer (cambiano gli indirizzi)
    }   
    for(let i=0; i<model.parts.length; i++){
        if(model.parts[i] !== undefined)
            renderPart(gl, program, model, model.parts[i], viewProjectionMatrix, gfxSettings);
    }
}

function renderPart(gl, program, model, part, viewProjectionMatrix, gfxSettings){
    let worldMatrix = model.getPartLocalMatrix(part.type);
    let uniforms = {
        u_world : worldMatrix,
        u_worldViewProjection : m4.multiply(viewProjectionMatrix, worldMatrix),
        u_color : part.color,
    }
    arrays = { 
        position: { data: part.vertices, numComponents: 3},
    };

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if(part.textCoord != undefined && part.texture != undefined){
        arrays.textCoord = { data: part.textCoord, numComponents: 2 };
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, part.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        var transparentPixel = new Uint8Array([0, 0, 0, 0]); 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, transparentPixel); //Imposto la texture di default ad un pixel trasparente
        var texcoordLocation = gl.getAttribLocation(program, "a_textCoord");
        gl.disableVertexAttribArray(texcoordLocation); //Dato che non uso l'attribute lo disabilito (avrà valore di default [0,0])
    }

    if(model.drawMode === 'elements'){
        arrays.indices= { data: part.indices, numComponents: 3,};
    }
        
    if(gfxSettings === 'high'){
        uniforms.u_ambient = ambientLight;
        uniforms.u_pointLightPosition = pointLightPosition;
        uniforms.u_cameraPosition = cameraSettings.cameraPosition;
        uniforms.u_shininess = part.shininess;
        arrays.normal = { data: part.normals, numComponents: 3};
    }
    setUpElementFromArrays(gl, program, arrays, uniforms);
    
    if(model.drawMode === 'arrays'){
        gl.drawArrays(gl.TRIANGLES, 0, part.vertices.length/3);
    }else if(model.drawMode === 'elements'){
        gl.drawElements(gl.TRIANGLES, part.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    //WIREFRAME 
    if(gfxSettings === 'low' && part.indicesWF !== undefined){
        arrays = {
            position: { data: part.verticesWF, numComponents: 3},
            indices: { data: part.indicesWF, numComponents: 2,},
        }
        uniforms.u_color= [0,0,0,1];
        setUpElementFromArrays(gl, program, arrays, uniforms);
        gl.drawElements(gl.LINES, part.indicesWF.length, gl.UNSIGNED_SHORT, 0); 
    }
    
}

function setUpElementFromArrays(gl, program, arrays, uniforms){
    let uniformSetters = webglUtils.createUniformSetters(gl,program);
    let attributeSetters = webglUtils.createAttributeSetters(gl,program);
    let bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
    if(bufferInfo != lastBufferInfo){
        lastBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, attributeSetters, bufferInfo);
    }
    
    webglUtils.setUniforms(uniformSetters, uniforms);
}
