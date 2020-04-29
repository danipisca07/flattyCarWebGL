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

//Restituisce la ViewProjectionMatrix per una telecamera prospettiva con obbiettivo lookAt
// cameraSettings: impostazioni camera, se undefined utilizza quelle predefinite
function getViewProjectionMatrixLookAt(gl, lookAtTarget, cameraSettings){
    if(cameraSettings == undefined) cameraSettings = this.cameraSettings;
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(cameraSettings.fieldOfViewRadians, aspect, 
        cameraSettings.zNear, cameraSettings.zFar);

    var cameraMatrix = m4.lookAt(cameraSettings.cameraPosition, lookAtTarget, cameraSettings.lookUpVector);

    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}

//Restituisce la ViewProjectionMatrix per una telecamera prospettiva
// cameraSettings: impostazioni camera, se undefined utilizza quelle predefinite
function getViewProjectionMatrix(gl, cameraSettings){
    if(cameraSettings == undefined) cameraSettings = this.cameraSettings;
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(cameraSettings.fieldOfViewRadians, aspect, 
        cameraSettings.zNear, cameraSettings.zFar);
    
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

// ANIMAZIONE
var fps, fpsInterval, now, then, elapsed;
function startAnimating(fps, renderFunction){
    fpsInterval = 1000 / fps;
    then = Date.now();
    animate();
}
function animate() {
    requestAnimationFrame(animate);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        drawScene(elapsed);
    }
}

//RENDERING OGGETTI MIA LIBRERIA
function renderElement(gl, model, baseWorldMatrix, viewProjectionMatrix){
    let program = webglUtils.createProgramFromSources(gl, [ model.vertexShader, model.fragmentShader]);
    let worldMatrices = model.getWorldMatrices(baseWorldMatrix);
    worldMatrices.forEach((worldMatrix, count) => renderPart(gl, program, model, count, worldMatrix, viewProjectionMatrix));
}

function renderPart(gl, program, model, partNumber, worldMatrix, viewProjectionMatrix){
    let worldInverseTranspose = m4.transpose(m4.inverse(worldMatrix));
    let uniforms = {
        u_world : worldMatrix,
        u_worldViewProjection : m4.multiply(viewProjectionMatrix, worldMatrix),
        u_worldInverseTranspose : worldInverseTranspose,
        u_color: model.partsColor[partNumber],
    }

    let arrays = {
        position: { data: model.vertices, numComponents: 3},
        //colors: { data: model.colors, numComponents: 3, },
        indices: { data: model.indices, numComponents: 3,},
    }
    setUpElementFromArrays(gl, program, arrays, uniforms);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

    arrays = {
        position: { data: model.verticesWF, numComponents: 3},
        //colors: { data: model.colorsWF, numComponents: 3},
        indices: { data: model.indicesWF, numComponents: 2,},
    }
    uniforms.u_color= [0,0,0,1];
    setUpElementFromArrays(gl, program, arrays, uniforms);
    gl.drawElements(gl.LINES, model.indicesWF.length, gl.UNSIGNED_SHORT, 0); 
}

function setUpElementFromArrays(gl, program, arrays, uniforms){
    let uniformSetters = webglUtils.createUniformSetters(gl,program);
    let attributeSetters = webglUtils.createAttributeSetters(gl,program);
    let bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
    
    webglUtils.setBuffersAndAttributes(gl, attributeSetters, bufferInfo);

    webglUtils.setUniforms(uniformSetters, uniforms);
}