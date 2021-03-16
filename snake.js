window.onload = function() {


    var difficulty = 0;
    var speed = 0;
    if (location.search) {
        var temp = location.search;
        var res = temp.split("&");
    
        //here are the settings values
        var difficultytext = res[0].toString().split('=').pop();
        var speedtext = res[1].toString().split('=').pop();
        

        if(speedtext == "Hard"){
            speed = 20;
        }
        else if(speedtext == "Medium"){
            speed = 15;
        }
        else if(speedtext == "Easy"){
            speed = 10;
        }

        if(difficultytext == "Hard"){
            difficulty = 4;
        }
        else if(difficultytext == "Medium"){
            difficulty = 3;
        }
        else if(difficultytext == "Easy"){
            difficulty = 2;
        }
    }


    
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");

    //highscore variable
    var highscore = 0;
    
    // Timing and frames per second
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;
    
    var initialized = false;
    
    // Images
    var images = [];
    var tileimage;
    
    // Image loading global variables
    var loadcount = 0;
    var loadtotal = 0;
    var preloaded = false;
    
    var flipped = false;
    
    // Load images
    function loadImages(imagefiles) {
        // Initialize variables
        loadcount = 0;
        loadtotal = imagefiles.length;
        preloaded = false;
        
        // Load the images
        var loadedimages = [];
        for (var i=0; i<imagefiles.length; i++) {
            // Create the image object
            var image = new Image();
            
            // Add onload event handler
            image.onload = function () {
                loadcount++;
                if (loadcount == loadtotal) {
                    // Done loading
                    preloaded = true;
                }
            };
            
            // Set the source url of the image
            image.src = imagefiles[i];
            
            // Save to the image array
            loadedimages[i] = image;
        }
        
        // Return an array of images
        return loadedimages;
    }
    
    // Level properties
    var Level = function (columns, rows, tilewidth, tileheight) {
        this.columns = columns;
        this.rows = rows;
        this.tilewidth = tilewidth;
        this.tileheight = tileheight;
        
        // Initialize tiles array
        this.tiles = [];
        for (var i=0; i<this.columns; i++) {
            this.tiles[i] = [];
            for (var j=0; j<this.rows; j++) {
                this.tiles[i][j] = 0;
            }
        }
    };
    
    // Generate a default level with walls
    Level.prototype.generate = function() {
        var tilecount = 0;
        for (var i=0; i<this.columns; i++) {
            for (var j=0; j<this.rows; j++) {
                if (i == 0 || i == this.columns-1 ||
                    j == 0 || j == this.rows-1) {
                    // Add walls at the edges of the level
                    this.tiles[i][j] = 0;
                } else {
                    // Add empty space
                    this.tiles[i][j] = 0;
                }
            }
        }

        //added option to randomize map

        while(tilecount < difficulty){

            var i = Math.floor(Math.random() * (this.columns +1));
            var j = Math.floor(Math.random() * (this.rows +1));

            if(this.tiles[i][j] == 0){
                this.tiles[i][j] = 1;
                tilecount++;
            }
            
            
            console.log("Tilecount = " + tilecount);
        }


    };
    
    
    // Snake
    var Snake = function() {
        this.init(0, 0, 1, 10, 1);
    }
    
    // Direction table: Up, Right, Down, Left
    Snake.prototype.directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    
    // Initialize the snake at a location
    Snake.prototype.init = function(x, y, direction, speed, numsegments) {
        this.x = x;
        this.y = y;
        this.direction = direction; // Up, Right, Down, Left
        this.speed = speed;         // Movement speed in blocks per second
        this.movedelay = 0;

        console.log(speed);
        
        // Reset the segments and add new ones
        this.segments = [];
        this.growsegments = 0;
        for (var i=0; i<numsegments; i++) {
            this.segments.push({x:this.x - i*this.directions[direction][0],
                                y:this.y - i*this.directions[direction][1]});
        }
    }
    
    // Increase the segment count
    Snake.prototype.grow = function() {
        this.growsegments++;
    };
    
    // Check we are allowed to move
    Snake.prototype.tryMove = function(dt) {
        this.movedelay += dt;
        var maxmovedelay = 1 / this.speed;
        if (this.movedelay > maxmovedelay) {
            return true;
        }
        return false;
    };
    
    // Get the position of the next move
    Snake.prototype.nextMove = function() {
        var nextx = this.x + this.directions[this.direction][0];
        var nexty = this.y + this.directions[this.direction][1];
        return {x:nextx, y:nexty};
    }
    
        // snake out of bounds move
        Snake.prototype.outOfBoundsMove = function(){
            //up
            if (snake.direction == 0) {
                var nextx = this.x + this.directions[this.direction][0];
                var nexty = this.y + 14;
                return {x:nextx, y:nexty};
            }
            else if (snake.direction == 1) {
                var nextx = this.x - 19;
                var nexty = this.y + this.directions[this.direction][1];
                return {x:nextx, y:nexty};
            }
            //bottom
            else if (snake.direction == 2) {
                var nextx = this.x + this.directions[this.direction][0];
                var nexty = this.y - 14;
                return {x:nextx, y:nexty};
            }
    
            //left
            else if (snake.direction == 3) {
                var nextx = this.x + 19 ;
                var nexty = this.y + this.directions[this.direction][1];
                return {x:nextx, y:nexty};
            }
        }
        // Move when snake is out of bounds 
        Snake.prototype.moveOutOfBounds = function() {
                    // Get the next move and modify the position
                    var nextmove = this.outOfBoundsMove();
                    this.x = nextmove.x;
                    this.y = nextmove.y;
                
                    // Get the position of the last segment
                    var lastseg = this.segments[this.segments.length-1];
                    var growx = lastseg.x;
                    var growy = lastseg.y;
                
                    // Move segments to the position of the previous segment
                    for (var i=this.segments.length-1; i>=1; i--) {
                        this.segments[i].x = this.segments[i-1].x;
                        this.segments[i].y = this.segments[i-1].y;
                    }
                    
                    // Grow a segment if needed
                    if (this.growsegments > 0) {
                        this.segments.push({x:growx, y:growy});
                        this.growsegments--;
                    }
                    
                    // Move the first segment
                    this.segments[0].x = this.x;
                    this.segments[0].y = this.y;
                    
                    // Reset movedelay
                    this.movedelay = 0;
                
        }
    // Move the snake in the direction
    Snake.prototype.move = function() {
        // Get the next move and modify the position
        var nextmove = this.nextMove();
        this.x = nextmove.x;
        this.y = nextmove.y;
    
        // Get the position of the last segment
        var lastseg = this.segments[this.segments.length-1];
        var growx = lastseg.x;
        var growy = lastseg.y;
    
        // Move segments to the position of the previous segment
        for (var i=this.segments.length-1; i>=1; i--) {
            this.segments[i].x = this.segments[i-1].x;
            this.segments[i].y = this.segments[i-1].y;
        }
        
        // Grow a segment if needed
        if (this.growsegments > 0) {
            this.segments.push({x:growx, y:growy});
            this.growsegments--;
        }
        
        // Move the first segment
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
        
        // Reset movedelay
        this.movedelay = 0;
    }

    // Create objects
    var snake = new Snake();
    var level = new Level(20, 15, 32, 32);
    
    // Variables
    var ispowerspawned = 0;
    var shroomisspawned = 0;
    var count=5;
    var powerup = 0;
    var shroomup = 0;
    var score = 0;              // Score
    var gameover = true;        // Game is over
    var gameovertime = 1;       // How long we have been game over
    var gameoverdelay = 0.5;    // Waiting time after game over
    
    // Initialize the game
    function init() {
        // Load images
        images = loadImages(["snake-graphics.png"]);
        tileimage = images[0];
        
        
        // Add keyboard events
        document.addEventListener("keydown", onKeyDown);
        
        // New game
        newGame();
        gameover = true;
    
        // Enter main loop
        main(0);
    }
    
    // Check if we can start a new game
    function tryNewGame() {
        if (gameovertime > gameoverdelay) {
            newGame();
            gameover = false;
        }
    }
    
    function newGame() {
        // Initialize the snake
        snake.init(10, 10, 1, speed, 4);
        
        // Generate the default level
        level.generate();
        
        // Add an apple
        addApple();
        
        // Initialize the score
        score = 0;
        
        // Initialize variables
        gameover = false;
    }
    
    // Add an apple to the level at an empty position
    function addApple() {
        // Loop until we have a valid apple
        var valid = false;
        while (!valid) {
            // Get a random position
            var ax = randRange(0, level.columns-1);
            var ay = randRange(0, level.rows-1);
            
            // Make sure the snake doesn't overlap the new apple
            var overlap = false;
            for (var i=0; i<snake.segments.length; i++) {
                // Get the position of the current snake segment
                var sx = snake.segments[i].x;
                var sy = snake.segments[i].y;
                
                // Check overlap
                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }
            
            // Tile must be empty
            if (!overlap && level.tiles[ax][ay] == 0) {
                // Add an apple at the tile position
                level.tiles[ax][ay] = 2;
                valid = true;
            }
        }
    }

    // Add an power up to the level at an empty position
    function addPowerUp() {
        // Loop until we have a valid apple
        var valid = false;
        while (!valid) {
            // Get a random position
            var ax = randRange(0, level.columns-1);
            var ay = randRange(0, level.rows-1);
            
            // Make sure the snake doesn't overlap the new apple
            var overlap = false;
            for (var i=0; i<snake.segments.length; i++) {
                // Get the position of the current snake segment
                var sx = snake.segments[i].x;
                var sy = snake.segments[i].y;

                // Check overlap
                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }
            
            // Tile must be empty
            if (!overlap && level.tiles[ax][ay] == 0) {
                // Add an apple at the tile position
                level.tiles[ax][ay] = 3;
                valid = true;
            }
        }
    }

    // Add a shroom to the level at an empty position
    function addShroom() {
        // Loop until we have a valid shroom
        var valid = false;
        while (!valid) {
            // Get a random position
            var ax = randRange(0, level.columns-1);
            var ay = randRange(0, level.rows-1);
            
            // Make sure the snake doesn't overlap the new shroom
            var overlap = false;
            for (var i=0; i<snake.segments.length; i++) {
                // Get the position of the current snake segment
                var sx = snake.segments[i].x;
                var sy = snake.segments[i].y;

                // Check overlap
                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }
            
            // Tile must be empty
            if (!overlap && level.tiles[ax][ay] == 0) {
                // Add an shroom at the tile position
                level.tiles[ax][ay] = 4;
                valid = true;
            }
        }
    }
    
    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);
        
        if (!initialized) {
            // Preloader
            
            // Clear the canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw a progress bar
            var loadpercentage = loadcount/loadtotal;
            context.strokeStyle = "#ff8080";
            context.lineWidth=3;
            context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width-37, 32);
            context.fillStyle = "#ff8080";
            context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage*(canvas.width-37), 32);
            
            // Draw the progress text
            var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
            context.fillStyle = "#000000";
            context.font = "16px Verdana";
            context.fillText(loadtext, 18, 0.5 + canvas.height - 63);
            
            if (preloaded) {
                initialized = true;
            }
        } else {
            // Update and render the game
            update(tframe);
            render();
        }
    }
    
    // Update the game state
    function update(tframe) {
        var dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        
        // Update the fps counter
        updateFps(dt);
        
        if (!gameover) {
            updateGame(dt);
        } else {
            gameovertime += dt;
        }
    }

    function addScore(){
        if(powerup == 1){
            score = score +2;
        }
        else{
            score++;
        }

    }
    
    function updateGame(dt) {
        // Move the snake
        if (snake.tryMove(dt)) {
            // Check snake collisions
            
            // Get the coordinates of the next move
            var nextmove = snake.nextMove();
            var nx = nextmove.x;
            var ny = nextmove.y;
            
            if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
                if (level.tiles[nx][ny] == 1) {
                    stone1 = new sound2("stone1.mp3");
                    stone1.play();
                    // Collision with a wall
                    gameover = true;
                }
                
                // Collisions with the snake itself
                for (var i=0; i<snake.segments.length; i++) {
                    var sx = snake.segments[i].x;
                    var sy = snake.segments[i].y;
                    
                    if (nx == sx && ny == sy) {
                        // Found a snake part
                        stone1 = new sound2("stone1.mp3");
                        stone1.play();
                        gameover = true;
                        break;
                    }
                }
                
                if (!gameover) {
                    // The snake is allowed to move

                    // Move the snake
                    snake.move();
                    
                    // Check collision with an apple
                    if (level.tiles[nx][ny] == 2) {
                        // Remove the apple
                        level.tiles[nx][ny] = 0;

                        //play sound effect 
                        bite1 = new sound("bite1.mp3");
                        bite1.play();
                        
                        // Add a new apple
                        addApple();
                        //Power up
                        var seed = Math.floor(Math.random() * 101);
                        var seedShroom = Math.floor(Math.random() * 101);
                        console.log(seed);
                        if(seed < 80 && powerup == 0 && ispowerspawned == 0){
                            addPowerUp();
                            ispowerspawned = 1;
                        }
                        if(seedShroom < 80 && shroomup == 0 && shroomisspawned == 0){
                            addShroom();
                            shroomisspawned = 1;
                        }
                        // Grow the snake
                        snake.grow();
                        
                        // Add a point to the score
                        addScore();
                        document.getElementById("score").innerHTML = "Score: " + score;
                    }
                    // Check collision with star
                    if(level.tiles[nx][ny]==3){
                        level.tiles[nx][ny] = 0;
                        ispowerspawned = 0;
                        mySound2 = new sound2("star.mp3");
                        mySound2.play();

                        //invertColors(false);
                        
                        powerup = 1;               
                        var count=500;

                        var counter=setInterval(timer, 10); //1000 will  run it every 1 second

                        function timer()
                        {
                            if(gameover){
                                count = 0;
                            }
                        count=count-1;
                        if (count <= 0)
                        {
                            clearInterval(counter);
                            //invertColors(true);
                            powerup = 0;
                            //counter ended, do something here
                            return;
                        }

                        //Do code for showing the number of seconds here
                        }
                    }
                    if(level.tiles[nx][ny]==4){
                        level.tiles[nx][ny] = 0;
                        shroomisspawned = 0;
                        mySound2 = new sound2("shroom.mp3");
                        mySound2.play();

                        invertColors(false);
                        
                        shroomup = 1;               
                        var count=500;

                        var counter=setInterval(timer, 10); //1000 will  run it every 1 second

                        function timer()
                        {
                            if(gameover){
                                count = 0;
                            }
                        count=count-1;
                        if (count <= 0)
                        {
                            clearInterval(counter);
                            invertColors(true);
                            shroomup = 0;
                            //counter ended, do something here
                            return;
                        }

                        //Do code for showing the number of seconds here
                        }
                    }                   

                }
            } else {
                // Out of bounds
                if (nx == -1) {
                    nx = 19;
                } else if (nx == 20) {
                    nx = 0;
                } else if (ny == 15) {
                    ny = 0;
                } else if (ny == -1) {
                    ny = 14;
                }
                if (level.tiles[nx][ny] == 1) {
                    // Collision with a wall
                    stone1 = new sound2("stone1.mp3");
                    stone1.play();
                    gameover = true;
                }
                // Collisions with the snake itself
                for (var i=0; i<snake.segments.length; i++) {
                    var sx = snake.segments[i].x;
                    var sy = snake.segments[i].y;
                    
                    if (nx == sx && ny == sy) {

                        // Found a snake part
                        gameover = true;
                        break;
                    }
                }
                if (!gameover) {
                    snake.moveOutOfBounds(); 
                    // Check collision with an apple
                    if (level.tiles[nx][ny] == 2) {
                        // Remove the apple
                        level.tiles[nx][ny] = 0;
                        
                        // Add a new apple
                        addApple();
                        //Power up
                        var seedPower = Math.floor(Math.random() * 101);
                        var seedShroom = Math.floor(Math.random() * 101);
                        console.log(seed);
                        if(seedPower < 80 && powerup == 0 && ispowerspawned == 0){
                            addPowerUp();
                            ispowerspawned = 1;
                        }
                        if(seedShroom < 80 && shroomup == 0 && shroomisspawned == 0){
                            addShroom();
                            shroomisspawned = 1;
                        }
                        // Grow the snake
                        snake.grow();
                        
                        // Add a point to the score
                        addScore();
                        document.getElementById("score").innerHTML = "Score: " + score;
                    }
                // Check collision with star
                    if(level.tiles[nx][ny]==3){
                        level.tiles[nx][ny] = 0;
                        ispowerspawned = 0;
                        mySound2 = new sound2("bite3.mp3");
                        mySound2.play();

                        //invertColors(false);
                        
                        powerup = 1;               
                        var count=500;

                        var counter=setInterval(timer, 10); //1000 will  run it every 1 second

                        function timer()
                        {
                            if(gameover){
                                count = 0;
                            }
                        count=count-1;
                        if (count <= 0)
                        {
                            clearInterval(counter);
                            //invertColors(true);
                            powerup = 0;
                            //counter ended, do something here
                            return;
                        }

                        //Do code for showing the number of seconds here
                        }
                    } 
                    if(level.tiles[nx][ny]==4){
                        level.tiles[nx][ny] = 0;
                        shroomisspawned = 0;
                        mySound2 = new sound2("bite3.mp3");
                        mySound2.play();

                        invertColors(false);
                        
                        shroomup = 1;               
                        var count=500;

                        var counter=setInterval(timer, 10); //1000 will  run it every 1 second

                        function timer()
                        {
                            if(gameover){
                                count = 0;
                            }
                        count=count-1;
                        if (count <= 0)
                        {
                            clearInterval(counter);
                            invertColors(true);
                            shroomup = 0;
                            //counter ended, do something here
                            return;
                        }

                        //Do code for showing the number of seconds here
                        }
                    }                    

                }
            }
            
            if (gameover) {
                gameovertime = 0;
            }
        }
    }
    
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);
            
            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }
        
        // Increase time and framecount
        fpstime += dt;
        framecount++;
    }
    
    // Render the game
    function render() {
        // Draw background
        context.fillStyle = "#577ddb";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        drawLevel();
        drawSnake();
            
        // Game over
        if (gameover) {
            ispowerspawned = 0;
            shroomisspawned = 0;
            shroomup = 0;
            powerup = 0;
            //var hs = document.getElementById("highscore").innerHTML;
            //high score stuff
            //
            if(highscore < score){
                document.getElementById("highscore").innerHTML = "Highscore: " + score;
                highscore = score;
            }

            
            document.getElementById("score").innerHTML = "Score: 0";
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Press any key to start! Or hold ESC to go to menu.", 0, canvas.height/2, canvas.width);
        }
    }
    
    // Draw the level tiles
    function drawLevel() {
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows; j++) {
                // Get the current tile and location
                var tile = level.tiles[i][j];
                var tilex = i*level.tilewidth;
                var tiley = j*level.tileheight;
                
                // Draw tiles based on their type
                if (tile == 0) {
                    // Empty space
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 1) {
                    // Stones
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    // draw stone 
                    var tx = 1;
                    var ty = 3;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 2) {
                    // Apple
                    
                    // Draw apple background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    
                    // Draw the apple image
                    var tx = 0;
                    var ty = 3;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
                else if (tile == 3){
                    // Star
                    
                    // Draw star background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    
                    // Draw the apple image
                    var tx = 0;
                    var ty = 2;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
                else if (tile == 4){
                    // shroom
                    
                    // Draw shroom background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    
                    // Draw the shroom image
                    var tx = 1;
                    var ty = 2;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
            }
        }
    }
    
    // Draw the snake
    function drawSnake() {
        var tx = null;
        var ty = null;
        // Loop over every snake segment
        for (var i=0; i<snake.segments.length; i++) {
            var segment = snake.segments[i];
            var segx = segment.x;
            var segy = segment.y;
            var tilex = segx*level.tilewidth;
            var tiley = segy*level.tileheight;
            
            
            //var tx = 3;
            //var ty = 0;
            
            if (i == 0) {
                // Head; Determine the correct image
                var nseg = snake.segments[i+1]; // Next segment
                
                if (segy < nseg.y) {
                    if (segy == 0 && nseg.y == 14) {  // top
                        
                        tx = 4; ty = 1;
                    }
                    else {
                        tx = 3; ty = 0;
                        
                    }
                } else if (segx > nseg.x) { // right
                    
                    if (segx == 19 && nseg.x == 0){
                        tx = 3; ty = 1;
                    }
                    else {
                      tx = 4; ty = 0;  
                    }
                   
                } else if (segy > nseg.y) { // down
                    if(nseg.y == 0 && segy == 14) {
                        tx = 3; ty = 0;
                    } 
                    else {
                        tx = 4; ty = 1;  
                    }
                } else if (segx < nseg.x) { // left 
                   if (segx == 0 && nseg.x == 19){
                        tx = 4; ty = 0;
                    } else {
                        tx = 3; ty = 1;
                    }
                    //Left   
                }
            } else if (i == snake.segments.length-1) {
                // Tail; Determine the correct image
                var pseg = snake.segments[i-1]; // Prev segment
                if (pseg.y < segy) {
                    if (pseg.y < segy && pseg.y == 0 && segy == 14) { // Up
                            tx = 4; ty = 3;                         
                    }else {
                        tx = 3; ty = 2;
                    }
                } else if (pseg.x > segx) {
                    if (pseg.x > segx && pseg.x == 19 && segx == 0) {  // Right
                        tx = 3; ty = 3;
                    } else { 
                    tx = 4; ty = 2;  
                    }
                } else if (pseg.y > segy) {
                    if (pseg.y > segy && segy == 0 && pseg.y == 14) {  // Down
                        tx = 3, ty = 2;
                    } else {
                        tx = 4; ty = 3;
                    }       
                } else if (pseg.x < segx) {
                    if (pseg.x < segx && pseg.x == 0 && segx == 19) { // left
                        tx = 4; ty = 2;      
                    } else {
                        tx = 3; ty = 3;
                    } 
                }
            } else {
                // Body; Determine the correct image
                var pseg = snake.segments[i-1]; // Previous segment
                var nseg = snake.segments[i+1]; // Next segment
                if (pseg.x < segx && nseg.x > segx || nseg.x < segx && pseg.x > segx) { // Horizontal Left-Right
                        tx = 1; ty = 0;
                } else if (pseg.x < segx && nseg.y > segy || nseg.x < segx && pseg.y > segy) { // Angle Left-Down
                    
                     if (pseg.x == 0 && segx == 19 || nseg.x == 0 && segx == 19) {
                        tx = 0; ty = 0;
                    } else if (segy == 0 && nseg.y == 14 || segy == 0 && pseg.y == 14){
                        tx = 2; ty = 2;
                    }
                    else {
                        tx = 2; ty = 0;
                    }
                } else if (pseg.y < segy && nseg.y > segy || nseg.y < segy && pseg.y > segy) { // Vertical Up-Down  
                    tx = 2; ty = 1;
                } else if (pseg.y < segy && nseg.x < segx || nseg.y < segy && pseg.x < segx) { // Angle Top-Left
                    if (pseg.x == 0 && segx == 19 || nseg.x == 0 && segx == 19) { 
                        tx = 0; ty = 1;
                    }  else if (segy == 14 && nseg.y == 0 || segy == 14 && pseg.y == 0){
                        tx = 2; ty = 0;
                    }  else  {
                        tx = 2; ty = 2;
                    }
                } else if (pseg.x > segx && nseg.y < segy || nseg.x > segx && pseg.y < segy) {  // Angle Right-Up
                      if (segx == 0 && pseg.x == 0 && nseg.x == 19 || pseg.x == 19 && segx == 0){ 
                            tx = 2; ty = 2;
                    } else if (segy == 14 && nseg.y == 0 || segy == 14 && pseg.y == 0){
                        tx = 0; ty = 0;
                    }  else {
                        tx = 0; ty = 1;  
                    }
                } else if (pseg.y > segy && nseg.x > segx || nseg.y > segy && pseg.x > segx) { // Angle Down-Right
                    if (segx == 0 && pseg.x == 0 && nseg.x == 19 || pseg.x == 19 && segx == 0) {  
                        tx = 2; ty = 0;
                    } else if (segy == 0 && nseg.y == 14 || segy == 0 && pseg.y == 14){
                        tx = 0; ty = 1;
                    }  else {
                        tx = 0; ty = 0;
                    }
                } else if (pseg.y > segy && nseg.y == 14 && segy == 0){
                    tx = 2; ty = 1;
                } else if (pseg.y < segy && nseg.y == 0 && segy == 14){
                    tx = 2; ty = 1;
                } else if (pseg.x < segx && nseg.x == 0 && segx == 19){
                    tx = 1; ty = 0;
                } else if (pseg.x > segx && nseg.x == 19 && segx == 0){
                    tx = 1; ty = 0;
                } else if (pseg.x == 0 && segx == 19) {
                    tx = 1; ty = 0;
                } else if (pseg.x == 19 && segx == 0) {
                    tx = 1; ty = 0;
                } else if (pseg.y == 14 && segy == 0) {
                    tx = 2; ty = 1;
                } else if (pseg.y == 0 && segy == 14) {
                    tx = 2; ty = 1;
                }
            }
            
            // Draw the image of the snake part
            context.drawImage(tileimage, tx*64, ty*64, 64, 64, tilex, tiley,
                              level.tilewidth, level.tileheight);
        }
    }
    
    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);

    }
    
    // Get a random int between low and high, inclusive
    function randRange(low, high) {
        return Math.floor(low + Math.random()*(high-low+1));
    }
    
    // Mouse event handlers
    function onMouseDown(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);
        
        if (gameover) {
            // Start a new game
            tryNewGame();
        } else {
            // Change the direction of the snake
            snake.direction = (snake.direction + 1) % snake.directions.length;
        }
    }
    
    // Keyboard event handler
    function onKeyDown(e) {
        if (gameover) {   
            if (e.keyCode == 27) {
                // Pressed esc
                console.log("pressed esc");
                window.location.href = "game.html";
            } else{
                tryNewGame();
            }         
            
        } else {
            if (e.keyCode == 37 || e.keyCode == 65) {
                // Left or A
                if (snake.direction != 1)  {
                    snake.direction = 3;
                }
            } else if (e.keyCode == 38 || e.keyCode == 87) {
                // Up or W
                if (snake.direction != 2)  {
                    snake.direction = 0;
                }
            } else if (e.keyCode == 39 || e.keyCode == 68) {
                // Right or D
                if (snake.direction != 3)  {
                    snake.direction = 1;
                }
            } else if (e.keyCode == 40 || e.keyCode == 83) {
                // Down or S
                if (snake.direction != 0)  {
                    snake.direction = 2;
                }
            }
            
        }
    }



    function invertColors(flipped) { 
        var canvas = document.getElementById("viewport"); 
        var context = canvas.getContext("2d");
        if(flipped){
            console.log("Flipped is true");
            context.setTransform(1,0,0,1,0,0);
        }
        else{
            console.log("Flipped is false");
            context.setTransform(1,0,0,-1,0,canvas.height);
        }


        // the css we are going to inject
        var css = 'html {-webkit-filter: invert(100%);' +
            '-moz-filter: invert(100%);' + 
            '-o-filter: invert(100%);' + 
            '-ms-filter: invert(100%);' 


        
        head = document.getElementsByTagName('head')[0],
        style = document.createElement('style');
        
        // a hack, so you can "invert back" clicking the bookmarklet again
        if (!window.counter) { window.counter = 1;} else  { window.counter ++;
        if (window.counter % 2 == 0) { var css ='html {-webkit-filter: invert(0%); -moz-filter:    invert(0%); -o-filter: invert(0%); -ms-filter: invert(0%);}'}
         };
        
        style.type = 'text/css';
        if (style.styleSheet){
        style.styleSheet.cssText = css;
        } else {
        style.appendChild(document.createTextNode(css));
        }
        
        //injecting the css to the head
        head.appendChild(style);
    };
    
    function sound(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function(){
            this.sound.play();
        }
        this.stop = function(){
            this.sound.pause();
        }    
    }

    function sound2(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function(){
            this.sound.play();
        }
        this.stop = function(){
            this.sound.pause();
        }    
    }

    function stoneSound(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function(){
            this.sound.play();
        }
        this.stop = function(){
            this.sound.pause();
        }    
    }    
    
    // Call init to start the game
    init();
};