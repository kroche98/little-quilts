/*eslint-env es6*/

/*--------------------- Little Quilt Definitions ----------------------*/

function Quilt(width=0, height=0, pattern=[]) {
	this.width = width;
	this.height = height;
	this.pattern = pattern;
}

function Piece(x, y, design, orientation) {
	this.x = x;
	this.y = y;
	this.design = design;
	this.orientation = orientation;
}

const a = new Quilt(1, 1, [new Piece(0, 0, 'a', 0)]);
const b = new Quilt(1, 1, [new Piece(0, 0, 'b', 0)]);

const turn = quilt => new Quilt(quilt.height, quilt.width, quilt.pattern.map(piece => new Piece(quilt.height-piece.y-1, piece.x, piece.design, (piece.orientation+1)%4)));
const sew = (quilt1, quilt2) => quilt1.height===quilt2.height ? new Quilt(quilt1.width+quilt2.width, quilt1.height, quilt1.pattern.concat(quilt2.pattern.map(piece => new Piece(quilt1.width+piece.x, piece.y, piece.design, piece.orientation)))) : new Quilt();

const unturn = quilt => turn(turn(turn(quilt)));
const pinwheel = quilt => sew(unturn(sew(quilt, turn(quilt))), turn(sew(quilt, turn(quilt))));
const pile = (quilt1, quilt2) => turn(sew(unturn(quilt1), unturn(quilt2)));
const tile = (quilt, m, n) => n==1 ? (m==1 ? quilt : sew(tile(quilt, m-1, n), quilt)) : pile(tile(quilt, m, n-1), tile(quilt, m, 1));

/*---------------------------------------------------------------------*/


/*------------------ Graphics Definitions and Setup -------------------*/

const PIECE_DIM = 64; // dimensions, in pixels, of one piece
const QUILT_THUMB_HEIGHT = 128;

let savedQuilts = [];
let currentQuilt = new Quilt();

var imgs = {a: new Image(), b: new Image()};
imgs.a.src = "a.png";
imgs.b.src = "b.png";

window.onload = function() {
    // we start with the two primitives as the saved quilts
    saveQuilt(a);
    saveQuilt(b);
    // and a as the starting quilt
    setCurrentQuilt(a);    
};

/*---------------------------------------------------------------------*/


/*------------------------ Graphics Functions -------------------------*/

// draw currentQuilt on the main canvas
function updateMainCanvas() {
    let mainCanvas = document.getElementById("quiltCanvas");
    mainCanvas.width = PIECE_DIM * currentQuilt.width;
    mainCanvas.height = PIECE_DIM * currentQuilt.height;
    drawQuiltOnCanvas(currentQuilt, mainCanvas.getContext("2d"));
}

// add the current quilt to the list of saved quilts
function saveQuilt(quilt) {
    // add the quilt to the list of saved quilts
    let quiltId = savedQuilts.push(quilt) - 1;
    
    // insert a new div for it into the document tree
    let savedQuiltsDiv = document.getElementById("savedQuilts");
    
    var quiltDiv = document.createElement('div');
    quiltDiv.className = "dropdown";
    quiltDiv.style.padding = "4px";
    quiltDiv.setAttribute('data-quiltId', quiltId);
    savedQuiltsDiv.appendChild(quiltDiv);
    
    var quiltCanvas = document.createElement('canvas');
    quiltCanvas.style.border = "1px solid";
    quiltCanvas.onclick = function() { setCurrentQuilt(savedQuilts[quiltId]); };
    quiltDiv.appendChild(quiltCanvas);

    var dropdownDiv = document.createElement('div');
    dropdownDiv.className = "dropdown-content";
    quiltDiv.appendChild(dropdownDiv);

    var popupInfo = document.createElement('div');
    popupInfo.className = "desc";
    popupInfo.innerHTML = `Quilt ${quiltId}: ${quilt.width} x ${quilt.height}`;
    dropdownDiv.appendChild(popupInfo);
    
    var popupCanvas = document.createElement('canvas');
    popupCanvas.style = "border:1px solid";
    dropdownDiv.appendChild(popupCanvas);
    
    // and draw the quilt on the canvases we just created
    popupCanvas.width = PIECE_DIM * quilt.width;
    popupCanvas.height = PIECE_DIM * quilt.height;
    let popupctx = popupCanvas.getContext("2d");
    drawQuiltOnCanvas(quilt, popupctx);
    
    let scaleFactor = QUILT_THUMB_HEIGHT / (quilt.height * PIECE_DIM);
    quiltCanvas.width = quilt.width * PIECE_DIM * scaleFactor;
    quiltCanvas.height = QUILT_THUMB_HEIGHT;
    let quiltctx = quiltCanvas.getContext("2d");
    quiltctx.scale(scaleFactor, scaleFactor);
    quiltctx.drawImage(popupCanvas, 0, 0);
}

// Draw image, rotated by angle degrees, with upper-left corner at (x,y)
// Adapted from code on StackOverflow
function drawRotatedImage(ctx, image, x, y, angle) {
    const TO_RADIANS = Math.PI/180;
    ctx.save();
    ctx.translate(x+image.width/2, y+image.width/2);
    ctx.rotate(angle * TO_RADIANS);
    ctx.drawImage(image, -(image.width/2), -(image.height/2));
    ctx.restore();
}

// draws quilt on the HTML5 canvas context specified by ctx
function drawQuiltOnCanvas(quilt, ctx) {
    quilt.pattern.forEach(function(piece) { drawRotatedImage(ctx, imgs[piece.design], PIECE_DIM*piece.x, PIECE_DIM*piece.y, 90*piece.orientation) }); 
}

// change the current quilt to quilt
function setCurrentQuilt(quilt) {
    currentQuilt = quilt;
    updateMainCanvas();
}

/*---------------------------------------------------------------------*/


/*--------------------- Quilt Operation Wrappers ----------------------*/

function turnQuilt() {
    setCurrentQuilt(turn(currentQuilt));
}

function sewQuilt() {
    var rightQuilt = savedQuilts[prompt("Enter the number of the quilt to be sewn to the right of current quilt.", "")];
    if (rightQuilt == null) alert("Invalid quilt specified.");
    else {
        if (currentQuilt.height != rightQuilt.height) alert("Sew can only be applied to quilts of the same height.");
        else setCurrentQuilt(sew(currentQuilt, rightQuilt));
    }
}

function unturnQuilt() {
    setCurrentQuilt(unturn(currentQuilt));
}

function pinwheelQuilt() {
    if (currentQuilt.height != currentQuilt.width) alert("Pinwheel can only be applied to a square quilt.");
    else setCurrentQuilt(pinwheel(currentQuilt));
}

function pileQuilt() {
    var bottomQuilt = savedQuilts[prompt("Enter the number of the quilt to be sewn to the bottom of current quilt.", "")];
    if (bottomQuilt == null) alert("Invalid quilt specified.");
    else {
        if (currentQuilt.width != bottomQuilt.width) alert("Pile can only be applied to quilts of the same width.");
        else setCurrentQuilt(pile(currentQuilt, bottomQuilt));
    }
}

function tileQuilt() {
    var m = prompt("Enter horizontal dimension.");
    var n = prompt("Enter vertical dimension.");
    if (m < 1 || n < 1) alert("Dimensions must be positive.");
    else {
        m = Math.floor(m); // just in case the user enters a decimal
        n = Math.floor(n);
        setCurrentQuilt(tile(currentQuilt, m, n));
    }
}

/*---------------------------------------------------------------------*/
