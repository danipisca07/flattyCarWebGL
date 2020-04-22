function radToDeg(r) {
    return r * 180 / Math.PI;
}

function degToRad(d) {
    return d * Math.PI / 180;
}

function getManipulationMatrix(matrix, scale, rotation, translation){
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);

    return matrix;
}

function getViewProjectionMatrix(gl, fieldOfViewRadians, zNear, zFar, cameraPosition, lookAtTarget, lookUpVector){
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        
    //var up = [0,1,0]; //View-up vector

    var cameraMatrix = m4.lookAt(cameraPosition, lookAtTarget, lookUpVector);

    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}

function getViewProjectionMatrix(gl, fieldOfViewRadians, zNear, zFar, cameraPosition, cameraRotation){

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    
    var cameraMatrix = m4.identity();
    cameraMatrix= m4.translate(cameraMatrix,cameraPosition[0],cameraPosition[1],cameraPosition[2]);
    cameraMatrix = m4.xRotate(cameraMatrix, cameraRotation[0]);
    cameraMatrix = m4.yRotate(cameraMatrix, cameraRotation[1]);
    cameraMatrix = m4.zRotate(cameraMatrix, cameraRotation[2]);

    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}