const keys = {
    W: 0, W_CODE: 87,
    A: 1, A_CODE: 65,
    S: 2, S_CODE: 83,
    D: 3, D_CODE: 68,
}

const CAR_PARTS = {
    BODY: 0,
    WHEEL_REAR_R: 1,
    WHEEL_REAR_L: 2,
    WHEEL_FRONT_R: 3,
    WHEEL_FRONT_L: 4,
}

var baseCube = {
    vertices : [
        -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, 
        -1,-1,1, 1,-1,1, 1,1,1, -1,1,1, 
        -1,-1,-1, -1,1,-1, -1,1,1, -1,-1,1,
        1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1, 
        -1,-1,-1, -1,-1,1, 1,-1,1, 1,-1,-1, 
        -1,1,-1, -1,1,1, 1,1,1, 1,1,-1,
    ],
    colors: [
        1,0,0,  1,0,0,  1,0,0,  1,0,0,
        1,0,0,  1,0,0,  0,1,0,  0,1,0,
        0,1,0,  0,1,0,  0,1,0,  0,1,0,
        0,0,1,  0,0,1,  0,0,1,  0,0,1,
        0,0,1,  0,0,1,  1,1,0,  1,1,0,
        1,1,0,  1,1,0,  1,1,0,  1,1,0,
    ],
    indices : [
        2,1,0, 3,2,0, 4,5,6, 4,6,7, 10,9,8, 11,10,8, 12,13,14, 
        12,14,15, 18,17,16, 19,18,16, 20,21,22, 20,22,23 
    ],
    normals: [
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 
    ],
    //WIREFRAME arrays
    verticesWF : [-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,],
    indicesWF : [0,1, 1,2, 2,3, 3,0, 4,5, 5,6, 6,7, 7,4, 1,5, 2,6, 3,7, 0,4],

    //Model Settings
    carlingaScale: [0.25, 0.14, 1], //Scala dimensione modello carrozzeria macchina
    raggioRuotaA : 0.25, //Scala dimensione raggio ruote anteriori
    raggioRuotaP : 0.3, //Scala dimensione raggio ruote posteriori
    spallaRuota : 0.1, //Scala dimensione spalla ruota
    larghezzaAsse : 1.16/2, //Larghezza asse ruote macchina (diviso / 2)
    posizioneAsseP : 0.8,
    posizioneAsseA : 0.55,
}

var vCar = {
    //MESH arrays
    parts : [
        {
            type: CAR_PARTS.BODY,
            vertices: baseCube.vertices,
            indices: baseCube.indices,
            normals: baseCube.normals,
            color: [1, 0, 0, 1],
            shininess : 100, 
            verticesWF : baseCube.verticesWF,
            indicesWF : baseCube.indicesWF,
        },
        {
            type: CAR_PARTS.WHEEL_REAR_R,
            vertices: baseCube.vertices,
            indices: baseCube.indices,
            normals: baseCube.normals,
            color: [0, 1, 0, 1],
            shininess : 100, 
        },
        {
            type: CAR_PARTS.WHEEL_REAR_L,
            vertices: baseCube.vertices,
            indices: baseCube.indices,
            normals: baseCube.normals,
            color: [0, 0, 1, 1],
            shininess : 100, 
        },
        {
            type: CAR_PARTS.WHEEL_FRONT_R,
            vertices: baseCube.vertices,
            indices: baseCube.indices,
            normals: baseCube.normals,
            color: [1, 1, 0, 1],
            shininess : 100, 
        },
        {
            type: CAR_PARTS.WHEEL_FRONT_L,
            vertices: baseCube.vertices,
            indices: baseCube.indices,
            normals: baseCube.normals,
            color: [0, 1, 1, 1],
            shininess : 100, 
        },
    ],
    drawMode : 'elements',
    
    

    //Funzione contenente la fisica del movimento della macchina. Richiamarla ogni volta che si deve aggiornare la sua posizione
    //keyPressed: Array [bool, bool, bool, bool] dove ogni posizione indica se il rispettivo tasto è stato premuto
    doStep: (keyPressed, opt_target) => {
        let vCar = opt_target === undefined ? this.vCar : opt_target;
        //let vCar = this;
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
    },

    //Restituisce le worldMatrix(=modelMatrix) di ognuna delle parti che compongono la macchina per poter
    // passare direttamente alla renderizzazione di ognuna
    getPartLocalMatrix : function(baseMatrix, partType){
        baseMatrix = getLocalMatrix(baseMatrix, [1,1,1], [0,degToRad(this.facing),0], [this.px, this.py, this.pz]);
        //baseMatrix*S*R*T
        if(partType === CAR_PARTS.BODY)
            return getLocalMatrix(baseMatrix, this.carlingaScale, [0,0,0], [0,0,0]);
        else if (partType === CAR_PARTS.WHEEL_REAR_R)
            return getLocalMatrix(baseMatrix, [this.spallaRuota, this.raggioRuotaP, this.raggioRuotaP], [degToRad(-this.mozzoP), degToRad(180), 0], [this.larghezzaAsse,this.raggioRuotaP-0.28,this.posizioneAsseP]);
        else if (partType === CAR_PARTS.WHEEL_REAR_L)
            return getLocalMatrix(baseMatrix, [this.spallaRuota, this.raggioRuotaP, this.raggioRuotaP], [degToRad(this.mozzoP), 0, 0], [-this.larghezzaAsse,this.raggioRuotaP-0.28,this.posizioneAsseP]);
        else if (partType === CAR_PARTS.WHEEL_FRONT_R)
            return getLocalMatrix(baseMatrix, [this.spallaRuota, this.raggioRuotaA, this.raggioRuotaA], [degToRad(-this.mozzoA), degToRad(180+this.sterzo), 0], [this.larghezzaAsse,this.raggioRuotaA-0.28,-this.posizioneAsseA]);
        else if (partType === CAR_PARTS.WHEEL_FRONT_L)
            return getLocalMatrix(baseMatrix, [this.spallaRuota, this.raggioRuotaA, this.raggioRuotaA], [degToRad(this.mozzoA), degToRad(this.sterzo), 0], [-this.larghezzaAsse,this.raggioRuotaA-0.28,-this.posizioneAsseA]);
        else
            return baseMatrix;
    },

    //Stato iniziale
    px: 0, py: 0, pz: 0, //Posizione
    facing: 0, // orientamento (0 = -Z)
    mozzoP: 0, mozzoA: 0, sterzo:0,   // Rotazione ruote
    vx: 0, vy: 0, vz: 0, //Velocità

    //Settings fisici
    velSterzo : 3.4,
    velRitornoSterzo : 0.93,
    accMax : 0.0151,
    attritoZ : 0.991,
    attritoX :  0.8, 
    attritoY : 1.0,
    grip : 0.75,

    //Model Settings
    carlingaScale: [0.3, 0.3, 0.3], //Scala dimensione modello carrozzeria macchina
    raggioRuotaA : 0.28, //Scala dimensione raggio ruote anteriori
    raggioRuotaP : 0.3, //Scala dimensione raggio ruote posteriori
    spallaRuota : 0.3, //Scala dimensione spalla ruota
    larghezzaAsse : 1/2, //Larghezza asse ruote macchina (diviso / 2)
    posizioneAsseP : 0.75, //Posizione (offset sull'asse z) delle ruote posteriori
    posizioneAsseA : 1, //Posizione (offset sull'asse z) delle ruote anteriori
}



