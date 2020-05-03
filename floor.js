var floor = {
    //MESH arrays
    parts: [
        {
            type: 0,
            vertices :[ -1,0,-1,    1,0,-1, -1,0,1,  1,0,1, ],
            indices : [ 0,2,1, 1,2,3, ],
            normals : [ 0,1,0, 0,1,0, 0,1,0, 0,1,0, ],
            color:  [0.4, 0.4, 0.4, 1],
            shininess : 1000,
            //WIREFRAME arrays
            verticesWF : [-1,0,-1,    1,0,-1, -1,0,1,  1,0,1,],
            indicesWF : [ 1,0, 0,2, 2,3, 3,1,],
        }
    ],
    drawMode : 'elements',

    worldMatrix : m4.identity(),

    //TODO: mettere la lista delle manipolazioni qui poi ciclare su questa per renderizzare
    getPartLocalMatrix : function(partType){
        //baseMatrix*S*R*T
        return this.worldMatrix;
    },
        
}