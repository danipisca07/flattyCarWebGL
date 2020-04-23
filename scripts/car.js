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
    getWorldMatrices : function(baseMatrix, mozzo){
        return [
            
            m4.scale(baseMatrix, 0.25, 0.14, 1),
            m4.translate(
                m4.xRotate(
                    m4.scale(
                        baseMatrix,
                    0.1, 0.20, 0.20)
                ,mozzo),
             0.58,-0.05,0.8), //baseMatrix*S*R*T*postMatrix
            
        ];
    }
        
}

function renderVCar(gl, baseWorldMatrix, viewProjectionMatrix){

    let worldMatrices = vCar.getWorldMatrices(baseWorldMatrix,0);
    worldMatrices.forEach((element) => renderElement(gl, vCar, element, viewProjectionMatrix));
    
}

function renderElement(gl, model, worldMatrix, viewProjectionMatrix){
    let program = webglUtils.createProgramFromSources(gl, [ model.vertexShader, model.fragmentShader]);

    let worldInverseTranspose = m4.transpose(m4.inverse(worldMatrix));
    let uniforms = {
        u_world : worldMatrix,
        u_worldViewProjection : m4.multiply(viewProjectionMatrix, worldMatrix),
        u_worldInverseTranspose : worldInverseTranspose,
        u_color: [0.3,0.3,0.3,1],
    }

    let arrays = {
        position: { data: model.vertices, numComponents: 3},
        //colors: { data: model.colors, numComponents: 3, },
        indices: { data: model.indices, numComponents: 3,},
    }
    uniforms.u_color= [0.3,0.3,0.3,1];
    setUpElementFromArrays(gl, program, arrays, uniforms);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

    arrays = {
        position: { data: model.verticesWF, numComponents: 3},
        //colors: { data: model.colorsWF, numComponents: 3},
        indices: { data: model.indicesWF, numComponents: 3,},
    }
    uniforms.u_color= [0,0,0,1];
    setUpElementFromArrays(gl, program, arrays, uniforms);
    gl.drawElements(gl.LINES, model.indicesWF.length, gl.UNSIGNED_SHORT, 0); 
}

