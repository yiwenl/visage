import { FaceLandmarkManager } from '../dist/visage.esm.js';
import { mat4 } from 'gl-matrix';

const vertexShaderSource = `
    attribute vec3 a_position;
    uniform mat4 u_matrix;
    uniform float u_pointSize;

    void main() {
        gl_Position = u_matrix * vec4(a_position, 1.0);
        gl_PointSize = u_pointSize;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;

    void main() {
        gl_FragColor = u_color;
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

async function init() {
    const canvas = document.getElementById('gl-canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }


    // Camera/Face Setup
    // Use FaceLandmarkManager to handle camera
    const faceManager = new FaceLandmarkManager({ maxFaces: 1 });
    await faceManager.init();

    const video = faceManager.getVideo();
    if (video) {
        video.id = 'lens-video';
        if (faceManager.mirror) {
            video.style.transform = 'scaleX(-1)';
        }
        document.body.appendChild(video); // Append but hidden via CSS
    }

    // Matrices
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const viewProjectionMatrix = mat4.create();

    // Camera setup (static)
    mat4.lookAt(viewMatrix, [0, 0, 2], [0, 0, 0], [0, 1, 0]);

    function updateMatrices() {
        if (!video) return;
        const fov = 60 * Math.PI / 180;
        // const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const aspect = video.videoWidth / video.videoHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    }

    // Resize canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        updateMatrices();
    }
    window.addEventListener('resize', resize);
    resize();

    // Shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Locations
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const matrixLoc = gl.getUniformLocation(program, 'u_matrix');
    const colorLoc = gl.getUniformLocation(program, 'u_color');
    const pointSizeLoc = gl.getUniformLocation(program, 'u_pointSize');

    // Buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    
    let verticesData = new Float32Array(0);

    faceManager.addEventListener('face-detected', (e) => {
        const vertices = faceManager.getVertices();
        document.getElementById('face-count').innerText = faceManager.getFaceCount();
        document.getElementById('vertex-count').innerText = vertices.length;

        if (vertices.length > 0 && video) {
            // Flatten vertices
            if (verticesData.length !== vertices.length * 3) {
                verticesData = new Float32Array(vertices.length * 3);
            }
            // Center the face approx. detected coordinates are in pixels (e.g. 0-640, 0-480)
            // We want to center them around 0.
            const cx = video.videoWidth / 2;
            const cy = video.videoHeight / 2;

            for (let i = 0; i < vertices.length; i++) {
                // Flip Y because WebGL Y is up, pixel Y is down
                // Also Z is usually negative for further away efficiently in MediaPipe? 
                // MediaPipe face mesh Z is scaled such that iris diameter is 1 unit. 
                // Let's just normalize rough pixel coordinates.
                verticesData[i * 3] = (vertices[i][0] - cx) / cx; // -1 to 1 approx
                verticesData[i * 3 + 1] = -(vertices[i][1] - cy) / cx; // maintain aspect ratio relative to width
                verticesData[i * 3 + 2] = -vertices[i][2] / cx; // Store Z somewhat scaled
            }
        } else {
             verticesData = new Float32Array(0);
        }
    });

    function render() {
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (verticesData.length > 0) {
            gl.useProgram(program);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, verticesData, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(matrixLoc, false, viewProjectionMatrix);
            gl.uniform4f(colorLoc, 0.0, 1.0, 0.5, 1.0); // Cyan-ish green
            gl.uniform1f(pointSizeLoc, 4.0);

            gl.drawArrays(gl.POINTS, 0, verticesData.length / 3);
        }

        requestAnimationFrame(render);
    }

    render();
}

init();
