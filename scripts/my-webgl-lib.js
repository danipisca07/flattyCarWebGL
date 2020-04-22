function radToDeg(r) {
    return r * 180 / Math.PI;
}

function degToRad(d) {
    return d * Math.PI / 180;
}

function addVec3(a,b){
    return new Array(a[0]+b[0], a[1]+b[1], a[2]+b[2]);
}

function multiplyVec3(a,b){
    return new Array(a[0]*b[0], a[1]*b[1], a[2]*b[2]);
}

function multiplyVec3Scalar(v, scalar){
    return new Array(v[0]*scalar, v[1]*scalar, v[2]*scalar);
}

function getManipulationMatrix(matrix, scale, rotation, translation){
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);

    return matrix;
}

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