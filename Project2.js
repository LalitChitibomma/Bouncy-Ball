
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

var displacement_y = 2.;
var velocity_y = 0.;

var bLButtonDown = false;
var vDown = [0., 0., 0.];
var mRotation = mat4();

var inc_t = 0.1;
var isPause_t = false;

var inc_r = 2.0;
var isPause_r = false;

window.onload = function init()
{
    initGL();

    pyramid();

    cube();

    rectangle();

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
        if (isPause_t == true) 
        {
            inc_t = 0.1;
            isPause_t = false;
        }
        else
        {
            inc_t = 0.0;
            velocity_y = 0.
            isPause_t = true;
        }
    };

    document.onkeydown = OnKeyDown;

    document.onmousedown = OnMouseDown;
    document.onmousemove = OnMouseMove;
    document.onmouseup = OnMouseUp;

    render();
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

var buffers = [];
function rectangle()
{
    r = 1.7;
    R = 0.1;
    var l = 0.6;

    var xRes = 40;
    var yRes = 40;

    for (i = 0; i <= xRes; i++) {
        for (j = 0; j <= yRes; j++) {
            phi = Math.PI * (i * 2. / xRes - 1.);
            psi = l * (j * 2. / yRes - 1.);
            
            points.push(vec3((r + psi*Math.cos(phi/2)) * Math.cos(phi), (r + psi*Math.cos(phi/2)) * Math.sin(phi), psi * Math.sin(phi/2) ));  

            UVs.push(phi / Math.PI * 5., psi / Math.PI);

            normals.push(normalize(vec3( r * (Math.cos(phi)*Math.sin(phi/2)) + (psi/2) * ((Math.sin(phi)*Math.cos(phi))-Math.sin(phi)),
                                         r * (Math.sin(phi)*Math.sin(phi/2)) + (psi/2) * ((Math.sin(phi)*Math.sin(phi))-Math.cos(phi)),
                                        -r * Math.cos(phi/2) + (psi/2)*(-Math.cos(phi)-1) )));
        }
    }

    for (i = 0; i < xRes; i++) {
        for (j = 0; j < yRes; j++) {
            indices.push([i * (yRes+1) + j, (i + 1) * (yRes+1) + j, (i + 1) * (yRes+1) + j + 1]);
            indices.push([i * (yRes + 1) + j, (i + 1) * (yRes + 1) + j + 1, i * (yRes + 1) + j + 1]);
        }
    }

    nFaces = indices.length;

    //Create buffer to store the vertex coordinates
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    buffers.push(vBuffer);

    //Create buffer to store the normals
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    buffers.push(nBuffer);

    //Create buffer to store the texture coordinates
    var tcBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tcBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(UVs), gl.STATIC_DRAW);
    buffers.push(tcBuffer);

    //Create buffer to store the triangle elements
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);
    buffers.push(tBuffer);
}

var points3 = [];
var normals3 = [];
var UVs3 = [];
var indices3 = [];
var buffers3 = [];

function pyramid() {
    points3.push(
        vec3(0, 0, (Math.sqrt(2)/2) - 0.35),
        vec3(-0.5, -0.5, -0.35),
        vec3(-0.5, 0.5, -0.35),
        vec3(0.5, 0.5, -0.35),
        vec3(0.5, -0.5, -0.35),
        vec3(0, 0, (Math.sqrt(2)/2) - 0.35));
    
    //Inaccurate normals just for testing.
    normals3.push(
        normalize(vec3(0, 0, (Math.sqrt(2)/2) - 0.35)),
        normalize(vec3(-0.5, -0.5, -0.35)),
        normalize(vec3(-0.5, 0.5, -0.35)),
        normalize(vec3(0.5, 0.5, -0.35)),
        normalize(vec3(0.5, -0.5, -0.35)),
        normalize(vec3(0, 0, (Math.sqrt(2)/2) - 0.35)));

    UVs3.push(
	vec2(0.5, 1.),
	vec2(0., 1.),
	vec2(1., 1.),
	vec2(1., 0.),
	vec2(0., 0.),
    vec2(0.5, 0.)
    );

    // Two Triangle Meshes, Six Faces
    indices3.push(
        5, 2, 1,
        0, 1, 4,
        0, 4, 3,
        0, 3, 2,
        1, 2, 3, 1, 3, 4
    );

    var vBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer3);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points3), gl.STATIC_DRAW);
    buffers3.push(vBuffer3);

    var nBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer3);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals3), gl.STATIC_DRAW);
    buffers3.push(nBuffer3);

    var tcBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tcBuffer3);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(UVs3), gl.STATIC_DRAW);
    buffers3.push(tcBuffer3);

    var tBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tBuffer3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices3)), gl.STATIC_DRAW);
    buffers3.push(tBuffer3);
}

var points2 = [];
var normals2 = [];
var UVs2 = [];
var indices2 = [];
var buffers2 = [];

function cube() {
    points2.push(
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5));
    
    //Inaccurate normals just for testing.
    normals2.push (
        normalize(vec3(-0.5, -0.5, 0.5)),
        normalize(vec3(-0.5, 0.5, 0.5)),
        normalize(vec3(0.5, 0.5, 0.5)),
        normalize(vec3(0.5, -0.5, 0.5)),
        normalize(vec3(-0.5, -0.5, -0.5)),
        normalize(vec3(-0.5, 0.5, -0.5)),
        normalize(vec3(0.5, 0.5, -0.5)),
        normalize(vec3(0.5, -0.5, -0.5)));

    UVs2.push(
	vec2(0., 0.),
	vec2(1., 0.),
	vec2(1., 1.),
	vec2(0., 1.),
	vec2(1., 1.),
	vec2(0., 1.),
	vec2(0., 0.),
	vec2(1., 0.)
    );

    // Two Triangle Meshes
    indices2.push(
        1, 0, 3, 1, 3, 2,
        2, 3, 7, 2, 7, 6,
        3, 0, 4, 3, 4, 7,
        6, 5, 1, 6, 1, 2,
        4, 5, 6, 4, 6, 7,
        5, 4, 0, 5, 0, 1
    );

    var vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points2), gl.STATIC_DRAW);
    buffers2.push(vBuffer2);

    var nBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals2), gl.STATIC_DRAW);
    buffers2.push(nBuffer2);

    var tcBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tcBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(UVs2), gl.STATIC_DRAW);
    buffers2.push(tcBuffer2);

    var tBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tBuffer2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices2)), gl.STATIC_DRAW);
    buffers2.push(tBuffer2);
}

var squareTexture;
var triangleTexture;

function initTexture() {
    squareTexture = gl.createTexture();
    var squareImage = new Image();

    squareImage.onload = function () { handleTextureLoaded(squareImage, squareTexture); }
    squareImage.src = "Material/marble10.png";

    triangleTexture = gl.createTexture();
    var triangleImage = new Image();

    triangleImage.onload = function () { handleTextureLoaded(triangleImage, triangleTexture); }
    triangleImage.src = "Material/Slime.png";
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


function render()
{
    velocity_y = 0.9999 * velocity_y - inc_t;
    displacement_y = displacement_y + velocity_y * 0.03;
    if (displacement_y < -2.) {
        displacement_y = -2.;
        velocity_y = -velocity_y;
    }
    gl.uniform1f(gl.getUniformLocation(program, "displacement_y"), displacement_y);

    theta[axis] += inc_r;
    gl.uniform3fv(gl.getUniformLocation(program, "theta"), theta);

    gl.uniformMatrix4fv(gl.getUniformLocation(program,"mRotation"), gl.FALSE, flatten(mRotation));

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, triangleTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    //Link data to vertex shader input
    var vPosition = gl.getAttribLocation(program, "vPosition");
    var vNormal = gl.getAttribLocation(program, "vNormal");
    var vUV = gl.getAttribLocation(program, "vUV");

    //Draw Pyramid
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers3[0]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers3[1]);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers3[2]);
    gl.vertexAttribPointer(vUV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vUV);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers3[3]);

    gl.uniform1i(gl.getUniformLocation(program, "useTexture"), true);
    gl.uniform1i(gl.getUniformLocation(program, "isPyramid"), true);
    gl.drawElements(gl.TRIANGLES, 6 * 3, gl.UNSIGNED_SHORT, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, squareTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    // //Draw Cube
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers2[0]);
    // gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vPosition);

    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers2[1]);
    // gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vNormal);

    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers2[2]);
    // gl.vertexAttribPointer(vUV, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vUV);

    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers2[3]);

    // gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
    // gl.drawElements(gl.TRIANGLES, 12 * 3, gl.UNSIGNED_SHORT, 0);

    //Draw Torus
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
    gl.uniform1i(gl.getUniformLocation(program, "isPyramid"), false);
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
