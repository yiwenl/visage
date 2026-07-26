import { FaceLandmarkManager } from '../src/index.ts';
import { projectCoverPointToClipSpace } from './overlayProjection.js';

const vertexShaderSource = `
    attribute vec3 a_position;
    uniform float u_pointSize;

    void main() {
        gl_Position = vec4(a_position, 1.0);
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
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
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
        document.body.appendChild(video);
    }

    // Resize canvas
    function resize() {
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.round(canvas.clientWidth * pixelRatio);
        canvas.height = Math.round(canvas.clientHeight * pixelRatio);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // Shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Locations
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getUniformLocation(program, 'u_color');
    const pointSizeLoc = gl.getUniformLocation(program, 'u_pointSize');

    // Buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    
    let verticesData = new Float32Array(0);

    faceManager.addEventListener(FaceLandmarkManager.EVENTS.FACE_DETECTED, () => {
        const vertices = faceManager.getVertices();
        document.getElementById('face-count').innerText = faceManager.getFaceCount();
        document.getElementById('vertex-count').innerText = vertices.length;

        if (vertices.length > 0 && video) {
            // Flatten vertices
            if (verticesData.length !== vertices.length * 3) {
                verticesData = new Float32Array(vertices.length * 3);
            }
            const sourceSize = {
                width: video.videoWidth,
                height: video.videoHeight
            };
            const targetSize = {
                width: canvas.clientWidth,
                height: canvas.clientHeight
            };

            for (let i = 0; i < vertices.length; i++) {
                const projected = projectCoverPointToClipSpace(
                    { x: vertices[i][0], y: vertices[i][1] },
                    sourceSize,
                    targetSize
                );
                verticesData[i * 3] = projected.x;
                verticesData[i * 3 + 1] = projected.y;
                verticesData[i * 3 + 2] = 0;
            }
        } else {
             verticesData = new Float32Array(0);
        }
    });

    function render() {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (verticesData.length > 0) {
            gl.useProgram(program);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, verticesData, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

            gl.uniform4f(colorLoc, 0.0, 1.0, 0.5, 1.0); // Cyan-ish green
            gl.uniform1f(pointSizeLoc, 4.0 * (window.devicePixelRatio || 1));

            gl.drawArrays(gl.POINTS, 0, verticesData.length / 3);
        }

        requestAnimationFrame(render);
    }

    render();
}

init();
