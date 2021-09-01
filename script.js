///for loading screen
var loading = true;

i = 0;
var loadingAnim = setInterval(function() {
  i = ++i % 4;
  $("#loading").html("Loading "+Array(i+1).join("."));
}, 800);

document.onreadystatechange = () => {
    if (document.readyState !== "complete") {
        document.querySelector("#root").style.visibility = "hidden";
        document.querySelector("#loader").style.visibility = "visible";
    } else {
        document.querySelector("#loader").style.display = "none";
        document.querySelector("#root").style.visibility = "visible";
        loading = false;
        clearInterval(loadingAnim);
    }
};

var loadingText = document.querySelector("#loader-text");


//objects
var gameArea = {
    canvas: document.getElementById("canvas"),
    ctx: this.canvas.getContext("2d"),
    height: canvas.height,
    width: canvas.width,
    background: loadImage("./assets/img/background.png"),
    groundImage: loadImage("./assets/img/ground.png"),

    update: function(){
        this.clear();        
        //draw background
        this.ctx.drawImage(this.background, -30, 0, this.width + 100, this.height);
        
    },

    clear: function(){
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    }, 

    drawGround: function(){
        this.ctx.drawImage(this.groundImage, -30, 750, this.width + 100, 50);
    },
    
    init: function(){
        this.background.width = this.width;
        this.background.heigh = this.height;
        this.ctx.font = "20px Pixeboy";
    }
}

var obstacles = {
    obs: [],
    next: 0, //index of next obstacle that bird hasn't passed yet
    width: 90,
    distance: 100,
    speedX: 3,
    topImage: loadImage("./assets/img/obs-top.png"),
    bottomImage: loadImage("./assets/img/obs-bottom.png"),
    spawning: false,

    update: function(){

        if(!this.spawning)
            return;

        for(i = 0; i < this.obs.length; i++){
            this.obs[i].update(this.speedX);
        }
        
        //spawn obstacles equal distance apart
        if(this.distance <= 0){ 
            this.obs.push(spawnObstacle());
            this.distance = 100;
            // console.log(this.obs);
        }

        this.distance--;

        //destroy obstacle if it exits screen
        if(this.obs[0].startX + this.width < 0){
            this.obs.shift();
            //update next obstacle index
            this.next--;
        }
    },

    draw: function(){
        for(i = 0; i < this.obs.length; i++){
            this.obs[i].draw(this.topImage, this.bottomImage, this.width);
        }
    },

    init: function(){
        this.obs = [];
        this.obs.push(spawnObstacle());
        this.distance = 100;
        this.next = 0;
        this.spawning = false;
        // ctx.font = "./"
        // console.log(o);
    },

    getNext: function(){
        return this.obs[this.next];
    },

    getFirstObs: function(){
        return this.obs[0];
    },

    log: function(){
        console.log(this.obs);
    }

}

var flappyBird = {
    image: loadImage("./assets/img/bird.png"),
    width: 50,
    height: 50,
    x: 150,
    y: 400,
    speedX: 0,
    speedY: 0,
    gravity: 0,
    gravitySpeed: 0,
    angle: 0,
    dead: false,
    flying: false,
    fell: false,

    draw: function() {
        ctx = gameArea.ctx;
        ctx.fillStyle = "#FF0000"; 
        //apply rotation
        ctx.save();
        ctx.translate(this.x, this.y);
        
        //bird is falling so it rotates clockwise
        //Y speed of approx 5 is overcome by gravity
        if(!this.fell && this.flying)
            this.angle += 0.01;

        ctx.rotate(this.angle);
        // ctx.fillRect(this.width /-2, this.height /-2, this.width, this.height);    
        ctx.drawImage(this.image, this.width /-2, this.height /-2, this.width + 6, this.height);    
        ctx.restore();
    },

    update: function() {
        
        if(this.fell)
            return;

        if(!this.dead)
            checkCollision();
        
        //bird hit ground
        if( this.y + this.width >= gameArea.height - 25){
            flappyBird.fell = true;
            endGame();
            return
        }

        this.gravitySpeed += this.gravity;
        this.x += this.speedX;

        //apply upwards force. Force diminishes over time
        if(this.speedY < 0){
            this.speedY *= 0.95  ;
        }

        this.y += this.speedY + this.gravitySpeed;        
    },

    init: function(){
        this.dead = false;
        this.fell = false;
        this.flying = false;
        this.gravity = 0;
        this.gravitySpeed = 0;
        this.x = 150;
        this.y = 400;
        this.angle = 0;
    },

    //bird moves upward with one flap
    flap: function(e){
        if(e.repeat || this.fell || this.dead)
            return;    
        
        playSound("./assets/sound/wing.mp3");
        flappyBird.speedY = -23;
        flappyBird.gravitySpeed = 8;
        flappyBird.angle = -0.3;
        
    },
}
//end of objects

var score = 0;
var isPlaying = false;
var isGameOver = false;
window.addEventListener("keydown", (e) => handle(e));
gameArea.canvas.addEventListener("click", e => handle(e));

document.getElementById("play").addEventListener("click", resetGame)  ;
gameArea.init();
init();
animate();


function animate(){

    gameArea.update(); 
    let ctx = gameArea.ctx;
    //update components with new positions
    if(isPlaying){
        flappyBird.update();
        obstacles.update();
        
    }else { //prompt to start game
        ctx.font = "30px Pixeboy";
        ctx.fillStyle = "black";
        ctx.fillText("Press Space to start", 100, 500);
        // ctx.strokeText("Press Space to start", 100, 500);
    }
    
    obstacles.draw();
    gameArea.drawGround();
    flappyBird.draw();

    //increase score each time bird passes obstacles
    // console.log("bird.x", flappyBird.x);
    if(flappyBird.x > obstacles.obs[0].startX + obstacles.obs[0].width)
        score++;
    //draw score
    ctx.fillStyle = "white";
    ctx.font = "100px Pixeboy";
    ctx.fillText(score, gameArea.width/2 - 20, 100);
    ctx.strokeText(score, gameArea.width/2 - 20, 100);

    requestAnimationFrame(animate);
}

function init(){
    score = 0;
    isGameOver = false;
    isPlaying = false;
    flappyBird.init();
    obstacles.init();
}

function startGame(){
    //apply gravity to bird
    flappyBird.gravity = 0.1;
    flappyBird.gravitySpeed = 11;
    flappyBird.flying = true;

    //start spawning obstacles
    obstacles.spawning = true;
}

function endGame() {
    if(isGameOver)
        return;

    isGameOver = true;
    flappyBird.dead = true;
    playSound("./assets/sound/hit.mp3");
    obstacles.spawning = false;

    let contentBox = document.getElementById("content-box");
    contentBox.style.display = 'block';
}

function resetGame () {
    init();
    document.getElementById('content-box').style.display = 'none';
}

//Stop spawning obstacles if bird collides with obstacle or ground.
//Make bird unable to flap and set falling to true
function checkCollision(){
    obs = obstacles.getFirstObs();

    if(//bird collides with obstacle
        ((flappyBird.x + flappyBird.width/2) >= obs.startX &&
        flappyBird.x - flappyBird.width/2 < (obs.startX + obstacles.width)) &&
        (flappyBird.y - flappyBird.height/2 < obs.startY ||
        flappyBird.y + flappyBird.height /2 > obs.endY)        
    ){
        endGame();
    }else if(flappyBird.x > obstacles.getNext().startX + obstacles.width){
        //bird passed obstacle without hitting
        playSound("./assets/sound/point.mp3");
        score++;
        obstacles.next++;
    }
}

//create new obstacle
function spawnObstacle(canvasWidth = gameArea.width, canvasHeight = gameArea.height){
    var y1 = Math.floor(Math.random() * (canvasHeight - 400)) + 100;
    var y2 = y1 + 180;
    var posX = canvasWidth ;

    return {
        startX: posX,
        startY: y1,
        endY: y2,
        bottom: canvasHeight,
        

        draw: function(topImg, bottomImg, width = 100, ctx = gameArea.ctx, ){
            y = this.startY - topImg.height;           
            ctx.drawImage(topImg, this.startX, y, width, topImg.height); 
            ctx.drawImage(bottomImg, this.startX, this.endY, width, bottomImg.height);
        },

        update: function(speed){
            this.startX -= speed;
        }
    }
}

//Flap bird. Start game if it hasn't been started already
function handle(e){
    if(!isPlaying){
        isPlaying = true;
        startGame();
    }
    if(e.key == " " || e.type == "click")
        flappyBird.flap(e);
}

function playSound(src){
    new Audio(src).play();
}

function loadImage(src){
    let img = document.createElement("img");
    img.src = src;
    return img;
}

function loadFont(fontname){
    ctx.font = "4px "+fontname;
    ctx.fillText("text", 0, 8);
}