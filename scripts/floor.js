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