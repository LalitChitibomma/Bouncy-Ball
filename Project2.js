var canvas;
var gl;
var program;

var points = [];
var indices = [];
var UVs = [];
var normals = [];
var nFaces;

var axis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var theta = [0, 0, 0];

// Height
var displacement_y = 1.3;
var velocity_y = 0.;

var bLButtonDown = false;
var vDown = [0., 0., 0.];
var mRotation = mat4();

var inc_t = 0.01;
var isPause_t = false;

var inc_r = 2.0;
var isPause_r = false;

let animationStarted = false;
let squashTimer = 0;

window.onload = function init()
{
    initGL();

    sphere(0.75);

    initTexture();

    //event listeners for buttons

    document.getElementById("xButton").onclick = function () {
        axis = xAxis;
    };
    document.getElementById("yButton").onclick = function () {
        axis = yAxis;
    };
    document.getElementById("zButton").onclick = function () {
        axis = zAxis;
    };

    document.getElementById("pButton").onclick = function () {
        if ((isPause_t == true))
        {
            inc_t = 0.01;
            isPause_t = false;
        }
        else
        {
            inc_t = 0.;
            isPause_t = true;
        }
    };

    document.onkeydown = OnKeyDown;

    document.onmousedown = OnMouseDown;
    document.onmousemove = OnMouseMove;
    document.onmouseup = OnMouseUp;

    
    requestAnimationFrame(render);

    setTimeout(() => {
        animationStarted = true;
    }, 5000);
    
    
  
}

function initGL()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

// Bouncing Sphere Buffer
var buffers = [];

function sphere(radius = 1.0, subdivU = 40, subdivV = 40) {
    points = [];
    normals = [];
    UVs = [];
    indices = [];

    for (let i = 0; i <= subdivU; ++i) {
        let theta = i * Math.PI / subdivU;
        for (let j = 0; j <= subdivV; ++j) {
            let phi = j * 2 * Math.PI / subdivV;

            let x = radius * Math.sin(theta) * Math.cos(phi);
            let y = radius * Math.sin(theta) * Math.sin(phi);
            let z = radius * Math.cos(theta);

            points.push(vec3(x, y, z));
            normals.push(normalize(vec3(x, y, z)));
            UVs.push(vec2(j / subdivV, i / subdivU));
        }
    }

    for (let i = 0; i < subdivU; ++i) {
        for (let j = 0; j < subdivV; ++j) {
            let first = i * (subdivV + 1) + j;
            let second = first + subdivV + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    nFaces = indices.length / 3;

    // Vertex Buffer
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    buffers.push(vBuffer);

    // Normal Buffer
    let nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    buffers.push(nBuffer);

    // Texture Coordinate Buffer
    let tcBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tcBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(UVs), gl.STATIC_DRAW);
    buffers.push(tcBuffer);

    // Triangle Buffer
    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);
    buffers.push(tBuffer);
}

var bumpTexture;
var heightTexture;

function initTexture() {
    bumpTexture = gl.createTexture();
    var bumpImage = new Image();
    bumpImage.onload = function () { handleTextureLoaded(bumpImage, bumpTexture); }
    bumpImage.src = "Material/bumpmap.jpg";

    // heightTexture = gl.createTexture();
    // var heightImage = new Image();
    // heightImage.onload = function () { handleTextureLoaded(heightImage, heightTexture); }
    // heightImage.src = "Material/height.bmp";
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

let deltaTime = 0.03;
let time = 0.;

function render()
{
    if (animationStarted) {
        // v_f = v_i + at (a = -9.8, t = 0.01)
        if (!isPause_t)
        {
            velocity_y = 0.9999 * velocity_y + (-9.8 * inc_t);
            time += inc_t;
            displacement_y = displacement_y + velocity_y * deltaTime;
        }

        if (displacement_y < -1.5) {
            displacement_y = -1.5;
            velocity_y = -velocity_y;
        }
    }

    // console.log(time + ' vel ' + velocity_y + ', dis ' + displacement_y);

    gl.uniform1f(gl.getUniformLocation(program, "displacement_y"), displacement_y);
    gl.uniform1f(gl.getUniformLocation(program, "time"), time);

    theta[axis] += inc_r;
    gl.uniform3fv(gl.getUniformLocation(program, "theta"), theta);

    let stretchStrength = 6;
    let stretchMatrix = mat4();
    let skinnyFactor = velocity_y * (displacement_y/1.3)/stretchStrength;
    let wideFactor = velocity_y * -(displacement_y + 0.5)/stretchStrength;
    skinnyFactor = clamp(skinnyFactor, 0., 1.);
    wideFactor = clamp(wideFactor, 0., 1.);

    //note default stretch is 1.
    //impact handling
    if (displacement_y <= 0.5 && velocity_y > 0 ) {
        // Wide in X and Z, squash in Y
        stretchMatrix[0][0] = 1 + wideFactor; //  stretch X
        stretchMatrix[1][1] = 1 / (1 + wideFactor); // squash Y
        stretchMatrix[2][2] = 1 + wideFactor; // stretch Z
    }

    //ball raising
    if (displacement_y > -0.5 && velocity_y > 0){
         // Skinny in Y and Z, squash in X
         stretchMatrix[0][0] = 1 /(1 + skinnyFactor); //  squash X
         stretchMatrix[1][1] = 1 + skinnyFactor; // stretch Y
         stretchMatrix[2][2] = 1 + skinnyFactor; // stretch Z
    }

    console.log(displacement_y + ' skinnyFactor ' + skinnyFactor + ', wideFactor ' + wideFactor);

    // Combine stretch with rotation
    let modelTransform = mult(stretchMatrix, mRotation);

    gl.uniformMatrix4fv(gl.getUniformLocation(program,"mRotation"), gl.FALSE, flatten(modelTransform));

    


    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.3);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bumpTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uBumpMap"), 0);

    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, heightTexture);
    // gl.uniform1i(gl.getUniformLocation(program, "uHeightMap"), 0);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    var vNormal = gl.getAttribLocation(program, "vNormal");
    var vUV = gl.getAttribLocation(program, "vUV");

    // Bouncing Sphere
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[2]);
    gl.vertexAttribPointer(vUV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vUV);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[3]);

    gl.uniform1i(gl.getUniformLocation(program, "useTexture"), true);
    let stretchScale = [1.0, 1.0, 1.0]; // default no stretch

    if (displacement_y < -1.0) {
        stretchScale = [2.0, 0.5, 2.0]; // stretch x and z, squash y
    }

    gl.uniform3fv(gl.getUniformLocation(program, "stretchScale"), flatten(stretchScale));

    gl.drawElements(gl.TRIANGLES, nFaces * 3, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}


function OnKeyDown(event)
{
    if (event.keyCode == 37) {
        theta[1] -= 30.0;
    }

    if (event.keyCode == 39) {
        theta[1] += 30.0;
    }

    if (event.keyCode == 80) {
        if (isPause_r == true) 
        {
            inc_r = 2.0;
            isPause_r = false;
        }

        else
        {
            inc_r = 0.0;
            isPause_r = true;
        }
    }

    if (event.keyCode == 82) {
        theta = [0, 0, 0];
        mRotation = mat4();
    }
}

function OnMouseDown(event)
{
    var vVec = Intersect(event.clientX, event.clientY);
    vDown = vVec;
    bLButtonDown = true;
}

function OnMouseUp(event) {
    bLButtonDown = false;
}

function OnMouseMove(event)
{
    if (bLButtonDown) {
        vVec = Intersect(event.clientX, event.clientY);
        rot_axis = cross(vDown, vVec);
        sine = Math.sqrt(dot(rot_axis,rot_axis));
        angle = 180. / Math.acos(-1.) * Math.atan2(sine, dot(vDown, vVec));
        if (sine > 1.e-10)
            rot_axis = vec3(rot_axis[0] / sine, rot_axis[1] / sine, rot_axis[2] / sine);
        else
            rot_axis = vec3(1, 0, 0);
        mRotation = mult(rotate(angle, rot_axis), mRotation);
        vDown = vVec;
    }
}

function Intersect(x, y)
{
    var rect = canvas.getBoundingClientRect();

    // Calculate mouse position relative to the canvas
    x = x - rect.left;
    y = y - rect.top;

    var xc = 512 / 2; //Assuming canvas size 512x512
    var yc = 512 / 2;
    var R = 512 / 2;

    var vOut = vec3((x - xc) / R, (yc-y) / R, 0.);
    len = dot(vOut, vOut);
    if (len <= 1.)
        vOut[2] = Math.sqrt(1 - len);
    else
        vOut[2] = 0.;
    len = Math.sqrt(dot(vOut, vOut));
    vOut = vec3(vOut[0] / len, vOut[1] / len, vOut[2] / len);

    return vOut;
}
