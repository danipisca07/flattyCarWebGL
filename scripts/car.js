var vCar = {
    //MESH arrays
    vertices :[
        -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, 
        -1,-1,1, 1,-1,1, 1,1,1, -1,1,1, 
        -1,-1,-1, -1,1,-1, -1,1,1, -1,-1,1,
        1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1, 
        -1,-1,-1, -1,-1,1, 1,-1,1, 1,-1,-1, 
        -1,1,-1, -1,1,1, 1,1,1, 1,1,-1,
    ],
    colors: [
        0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
        0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
        0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
        0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
        0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
        0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9, 
    ],
    indices : [
        0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11, 12,13,14, 
        12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23 
    ],
    partsColor : [
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 0, 1],
        [0, 1, 1, 1],
    ],
    
    //WIREFRAME arrays
    verticesWF : [-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,],
    colorsWF : [
        0,0,0,  0,0,0,  0,0,0,  0,0,0,
        0,0,0,  0,0,0,  0,0,0,  0,0,0
    ],
    indicesWF : [0,1, 1,2, 2,3, 3,0, 4,5, 5,6, 6,7, 7,4, 1,5, 2,6, 3,7, 0,4],

    //SHADERS scripts
    vertexShader : `attribute vec4 a_position;
    uniform mat4 u_world; 
    uniform mat4 u_worldViewProjection; 
    uniform mat4 u_worldInverseTranspose;
    void main(void) { //pre-built function
        gl_Position = u_worldViewProjection * a_position;
    }`,
    fragmentShader : `precision mediump float; 
    uniform vec4 u_color;
    void main(void) {
        gl_FragColor = u_color;
    }`,

    //TODO: mettere la lista delle manipolazioni qui poi ciclare su questa per renderizzare
    getWorldMatrices : function(baseMatrix){
        baseMatrix = getLocalMatrix(baseMatrix, [1,1,1], [0,degToRad(this.facing),0], [this.px, this.py, this.pz]);
        return [
            //baseMatrix*S*R*T
            getLocalMatrix(baseMatrix, [0.25, 0.14, 1], [0,0,0], [0,0,0]), //Carlinga
            getLocalMatrix(baseMatrix, [0.1, this.raggioRuotaP, this.raggioRuotaP], [degToRad(this.mozzoP), 0, 0], [0.58,this.raggioRuotaP-0.28,0.8]), //Ruota posteriore D (verde)
            getLocalMatrix(baseMatrix, [0.1, this.raggioRuotaP, this.raggioRuotaP], [degToRad(this.mozzoP), 0, 0], [-0.58,this.raggioRuotaP-0.28,0.8]), //Ruota posteriore S (blu)
            getLocalMatrix(baseMatrix, [0.08, this.raggioRuotaA, this.raggioRuotaA], [degToRad(this.mozzoA), degToRad(this.sterzo), 0], [0.58,this.raggioRuotaA-0.28,-0.55]), //Ruota anteriore D (gialla)
            getLocalMatrix(baseMatrix, [0.08, this.raggioRuotaA, this.raggioRuotaA], [degToRad(this.mozzoA), degToRad(this.sterzo), 0], [-0.58,this.raggioRuotaA-0.28,-0.55]), //Ruota anteriore D (azzurra)
        ];
    },

    px: 0, py: 0, pz: 0,
    facing: 0, // posizione e orientamento
    mozzoA: 0, mozzoP: 0, sterzo:0,   // stato
    vx: 0, vy: 0, vz: 0,

    //Settings
    velSterzo : 3.4,
    velRitornoSterzo : 0.93,
    accMax : 0.0011,
    attritoZ : 0.991,
    attritoX :  0.8, 
    attritoY : 1.0,
    raggioRuotaA : 0.25,
    raggioRuotaP : 0.30,
    grip : 0.75,
}

var floor = {
    //MESH arrays
    vertices :[
        -1,0,-1,    1,0,-1, -1,0,1,  1,0,1,
    ],
    indices : [
        0,2,1, 1,2,3, 
    ],
    partsColor : [
        [0.4, 0.4, 0.4, 1],
    ],
    
    //WIREFRAME arrays
    verticesWF : [
        -1,0,-1,    1,0,-1, -1,0,1,  1,0,1,
    ],
    colorsWF : [0,1,0,1], //unused
    indicesWF : [
        1,0, 0,2, 2,3, 3,1, 
    ],

    //SHADERS scripts
    vertexShader : `attribute vec4 a_position;
    uniform mat4 u_world; 
    uniform mat4 u_worldViewProjection; 
    uniform mat4 u_worldInverseTranspose;
    void main(void) { //pre-built function
        gl_Position = u_worldViewProjection * a_position;
    }`,
    fragmentShader : `precision mediump float; 
    uniform vec4 u_color;
    void main(void) {
        gl_FragColor = u_color;
    }`,

    //TODO: mettere la lista delle manipolazioni qui poi ciclare su questa per renderizzare
    getWorldMatrices : function(baseMatrix){
        return [
            //baseMatrix*S*R*T
            getLocalMatrix(baseMatrix, [12,1,12], [0,0,0], [0,0,0]), 
            ];
    }
        
}

function renderVCar(gl, baseWorldMatrix, viewProjectionMatrix, keyPressed){
        // computiamo l'evolversi della macchina
    var vxm, vym, vzm; // velocita' in spazio macchina
    
    // da vel frame mondo a vel frame macchina
    var cosf = Math.cos(vCar.facing*Math.PI/180.0);
    var sinf = Math.sin(vCar.facing*Math.PI/180.0);
    vxm = +cosf*vCar.vx - sinf*vCar.vz;
    vym = vCar.vy;
    vzm = +sinf*vCar.vx + cosf*vCar.vz;
    
    // gestione dello sterzo
    if (keyPressed[keys.A]) vCar.sterzo+=vCar.velSterzo;
    if (keyPressed[keys.D]) vCar.sterzo-=vCar.velSterzo;
    vCar.sterzo*=vCar.velRitornoSterzo; // ritorno a volante fermo
    
    if (keyPressed[keys.W]) vzm-=vCar.accMax; // accelerazione in avanti
    if (keyPressed[keys.S]) vzm+=vCar.accMax; // accelerazione indietro
    
    // attriti (semplificando)
    vxm*=vCar.attritoX; 
    vym*=vCar.attritoY;
    vzm*=vCar.attritoZ;

    // l'orientamento della macchina segue quello dello sterzo
    // (a seconda della velocita' sulla z)
    vCar.facing = vCar.facing - (vzm*vCar.grip)*vCar.sterzo;
    
    // rotazione mozzo ruote (a seconda della velocita' sulla z)
    var da ; //delta angolo
    da=(180.0*vzm)/(Math.PI*vCar.raggioRuotaA);
    vCar.mozzoA+=da;
    da=(180.0*vzm)/(Math.PI*vCar.raggioRuotaP);
    vCar.mozzoP+=da;
    
    // ritorno a vel coord mondo
    vCar.vx = +cosf*vxm + sinf*vzm;
    vCar.vy = vym;
    vCar.vz = -sinf*vxm + cosf*vzm;
    
    // posizione = posizione + velocita * delta t (ma e' delta t costante)
    vCar.px+=vCar.vx;
    vCar.py+=vCar.vy;
    vCar.pz+=vCar.vz;

    let worldMatrices = vCar.getWorldMatrices(baseWorldMatrix);
    worldMatrices.forEach((element, count) => renderElement(gl, vCar, count, element, viewProjectionMatrix));
    
}

function renderFloor(gl, viewProjectionMatrix){
    let worldMatrix = floor.getWorldMatrices(m4.identity())[0];
    renderElement(gl, floor, 0, worldMatrix, viewProjectionMatrix);
}

function renderElement(gl, model, partNumber, worldMatrix, viewProjectionMatrix){
    let program = webglUtils.createProgramFromSources(gl, [ model.vertexShader, model.fragmentShader]);

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

