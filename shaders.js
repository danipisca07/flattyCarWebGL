var shaderScripts = {
    low : {
        vertexShader : `attribute vec4 a_position;
        attribute vec2 a_textCoord;
        uniform mat4 u_world; 
        uniform mat4 u_worldViewProjection; 
        uniform mat4 u_worldInverseTranspose;
        varying vec2 v_textCoord;
        void main(void) { 
            gl_Position = u_worldViewProjection * a_position;
            v_textCoord = a_textCoord;
        }`,
        fragmentShader : `precision mediump float; 
        uniform vec4 u_color;
        uniform sampler2D u_texture;
        varying vec2 v_textCoord;
        void main(void) {
            vec4 tex = texture2D(u_texture, v_textCoord);
            gl_FragColor = tex + u_color * (1.-tex.a);
        }`,
    },
    high : {
        vertexShader: `attribute vec4 a_position;
        attribute vec3 a_normal;
        attribute vec2 a_textCoord;
        varying vec2 v_textCoord;

        uniform mat4 u_worldViewProjection, u_world;
        uniform vec3 u_pointLightPosition;
        uniform vec3 u_cameraPosition;

        varying vec3 v_normal;
        varying vec3 v_surfaceToLight;
        varying vec3 v_surfaceToCamera;

        void main() {
            gl_Position = u_worldViewProjection * a_position; //Dovrei farmi dare solo vp e qui fare vp * worldPos
            v_textCoord = a_textCoord;
            v_normal = vec3(a_normal.x, a_normal.y, a_normal.z); //Perche le normali erano sbagliate, non farlo se non serve
            v_normal = mat3(u_world) * v_normal;
            vec3 surfaceWorldPosition = (u_world * a_position).xyz;
            v_surfaceToLight = u_pointLightPosition - surfaceWorldPosition; //Vettore direzione dalla superficie verso la luce
            v_surfaceToCamera = u_cameraPosition - surfaceWorldPosition; //Vettore direzione dalla superficie verso la camera
        }`,
        fragmentShader: `precision mediump float;

        uniform float u_ambient;
        uniform float u_shininess;
        uniform vec4 u_color;
        uniform sampler2D u_texture;

        varying vec3 v_normal, v_surfaceToLight, v_surfaceToCamera;
        varying vec2 v_textCoord;
        void main() {
            vec3 normal = normalize(v_normal);
            vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
            vec3 surfaceToViewDirection = normalize(v_surfaceToCamera);
            vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection); //Prendo il vettore "in mezzo" tra le direzioni luce e camera

            float pointLight = dot(normal, surfaceToLightDirection);
            float specularLight = 0.0;
            if(pointLight > 0.0){
                specularLight = dot(normal, halfVector);
                specularLight = pow(specularLight, u_shininess);
            } 
            float totLight = u_ambient + pointLight;
            float light = clamp(totLight/(1.-u_ambient), u_ambient, 1.0); //Mappa nel range u_ambient <-> 1
            
            vec4 tex = texture2D(u_texture, v_textCoord);
            gl_FragColor = tex + u_color * (1.-tex.a);
            vec3 v = vec3(light, light, light);
            gl_FragColor.rgb *= light;
            gl_FragColor.rgb += specularLight;

            //DEBUG
            //gl_FragColor = vec4(normal, 1.0);
            float val = pointLight;
            //gl_FragColor = vec4(val, val, val, 1.0);
        }`,
    }
};

