var shaderScripts = {
    low : {
        vertexShader : `attribute vec4 a_position;
        attribute vec2 a_textCoord;
        uniform mat4 u_worldViewProjection; 
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
            gl_FragColor = tex + u_color * (1.-tex.a); //oltre alla normale applicazione della texture applico anche la trasparenza nel caso di texture png
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
            float light = u_ambient + pointLight;

            if(light < u_ambient) {
                light = u_ambient;
            }
            
            vec4 tex = texture2D(u_texture, v_textCoord);
            gl_FragColor = tex + u_color * (1.-tex.a);
            gl_FragColor.rgb *= light;
            gl_FragColor.rgb += specularLight;
        }`,
    },
    shadows : {
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

        //Shadows
        uniform mat4 u_depthProjectionMatrix;
        varying vec4 v_projectedTexcoord;

        void main() {
            gl_Position = u_worldViewProjection * a_position; //Dovrei farmi dare solo vp e qui fare vp * worldPos
            v_textCoord = a_textCoord;
            v_normal = vec3(a_normal.x, a_normal.y, a_normal.z); //Perche le normali erano sbagliate, non farlo se non serve
            v_normal = mat3(u_world) * v_normal;
            vec3 surfaceWorldPosition = (u_world * a_position).xyz;
            v_surfaceToLight = u_pointLightPosition - surfaceWorldPosition; //Vettore direzione dalla superficie verso la luce
            v_surfaceToCamera = u_cameraPosition - surfaceWorldPosition; //Vettore direzione dalla superficie verso la camera

            //Shadows
            vec4 worldPosition = u_world * a_position;
            v_projectedTexcoord = u_depthProjectionMatrix * worldPosition;
        }`,
        fragmentShader: `precision mediump float;

        uniform float u_ambient;
        uniform float u_shininess;
        uniform vec4 u_color;
        uniform sampler2D u_texture;
        
        varying vec3 v_normal, v_surfaceToLight, v_surfaceToCamera;
        varying vec2 v_textCoord;

        //Shadows
        uniform sampler2D u_depthTexture;
        varying vec4 v_projectedTexcoord;
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
            float light = u_ambient + pointLight;
            
            //Shadows
            vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
            float currentDepth = projectedTexcoord.z - 0.002;

            bool inProjectionRange =
                projectedTexcoord.x >= 0.0 &&
                projectedTexcoord.x <= 1.0 &&
                projectedTexcoord.y >= 0.0 &&
                projectedTexcoord.y <= 1.0;

            float projectedDepth = texture2D(u_depthTexture, projectedTexcoord.xy).r;
            float shadowLight = projectedDepth <= currentDepth ? 0.5 : 1.0;
            if(inProjectionRange){
            light *= shadowLight;
            }
            if(light < u_ambient) {
                light = u_ambient;
            }
            
            vec4 tex = texture2D(u_texture, v_textCoord);
            gl_FragColor = tex + u_color * (1.-tex.a);
            gl_FragColor.rgb *= light;
            gl_FragColor.rgb += specularLight * shadowLight;
        }`,
    },
    skybox: {
        vertexShader:`
            attribute vec4 a_position;
            varying vec4 v_position;
            void main() {
                v_position = a_position;
                gl_Position = a_position;
                gl_Position.z = 1.0;
            }
        `,
        fragmentShader:`
            precision mediump float;

            uniform samplerCube u_skybox;
            uniform mat4 u_viewDirectionProjectionInverse;
            
            varying vec4 v_position;
            void main() {
                vec4 t = u_viewDirectionProjectionInverse * v_position;
                gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
            }
        `
    },
    shadowProjection : {
        vertexShader : `attribute vec4 a_position;
        uniform mat4 u_worldViewProjection; 
        void main(void) { 
            gl_Position = u_worldViewProjection * a_position;
        }`,
        fragmentShader : `precision mediump float; 
        void main(void) {
            gl_FragColor = vec4(1,1,1,1);
        }`,
    },
};

