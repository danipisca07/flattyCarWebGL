var floor = {
    //MESH arrays
    vertices :[
        -1,0,-1,    1,0,-1, -1,0,1,  1,0,1,
    ],
    indices : [
        0,2,1, 1,2,3, 
    ],
    normals : [
        0,1,0, 0,1,0, 0,1,0, 0,1,0, 
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

    shininess : 100,
    

    //TODO: mettere la lista delle manipolazioni qui poi ciclare su questa per renderizzare
    getWorldMatrices : function(baseMatrix){
        return [
            //baseMatrix*S*R*T
            getLocalMatrix(baseMatrix, [12,1,12], [0,0,0], [0,0,0]), 
            ];
    }
        
}