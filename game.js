var fs = require("fs")
var Snake = require("./snake.js")

function shuffle(arr){
	// JS implementation of the Durstenfeld shuffle by StackOverflow user Laurens Holst
	// http://stackoverflow.com/a/12646864/5749040

	for(var i = arr.length-1; i>0; i--){
		var j = Math.floor(Math.random()*(i+1))
		var temp = arr[i]
		arr[i] = arr[j]
		arr[j] = temp
	}
}

function mod(a,b){
	// Make % work for negative numbers
	return ( (a%b) + b) % b
}

function copy(obj){
	// Kludgy function to deep copy an array or object (so that any sub-arrays/objects will be copies, not references to the original)
	// This will break if the object holds any non-JSONible data (functions, undefined, and such), but that shouldn't be an issue for this project
	return JSON.parse(JSON.stringify(obj))
}

function empty_grid(size, f){
	if(!f){ f = "." }

	var new_grid = new Array(size)
	
	for(var i = 0; i < new_grid.length; i++){
		new_grid[i] = new Array(size).fill(f)
	}

	return new_grid
}

function snakes(bots, keep_log){
	function make_map(snake){
		var map = empty_grid(bots.length*10, "?")

		var view_span = snake.length

		for(var i = -view_span; i <= view_span; i++){
			for(var j = -view_span; j <= view_span; j++){
				cell_row = mod(snake.head.row+i, map.length)
				cell_col = mod(snake.head.col+j, map[cell_row].length)
				map[cell_row][cell_col] = grid[cell_row][cell_col]
			}
		}

		return map
	}

	function find_empty_cell(){
		row = Math.floor(Math.random()*GRID_SIZE)
		col = Math.floor(Math.random()*GRID_SIZE)

		while(grid[row][col] != "."){
			row = Math.floor(Math.random()*GRID_SIZE)
			col = Math.floor(Math.random()*GRID_SIZE)
		}

		return [row, col]
	}

	function kill_snake(snake){
		var runner = snake.head
		while(runner){
			grid[runner.row][runner.col] = snake.letter.toUpperCase()
			runner = runner.next
		}
		snake_index = snakes.indexOf(snake)
		if(snake_index > -1){
			snakes.splice(snake_index, 1)
		}
	}

	function move_to_cell(snake, row, col){
		var new_cell = grid[row][col]

		if(new_cell!="*" && new_cell!=".") {
			kill_snake(snake)
		} else {
			grid[snake.head.row][snake.head.col] = snake.letter
			snake.add_head(row, col)
			grid[snake.head.row][snake.head.col] = snake.letter.toUpperCase()

			if(new_cell==".") {
				grid[snake.tail.row][snake.tail.col] = "."
				snake.remove_tail()
			} else {
				APPLES--
				snake.score++
				scores[snake.name+" "+snake.letter] = snake.score
			}

			snakes[i].timeout = snakes[i].length
		}
	}

	function default_move(snake){
		// looks at snake.head and snake.head.next to determine what direction the snake is moving in, then moves that direction again

		row_diff = snake.head.row - snake.head.next.row
		col_diff = snake.head.col - snake.head.next.col

		next = [mod(snake.head.row + row_diff, GRID_SIZE), mod(snake.head.col + col_diff, GRID_SIZE)]

		return next
	}

	function find_new_cell(snake, deltas){
		if(!deltas){
			return default_move(snake)
		}

		next = [mod(snake.head.row + deltas[0], GRID_SIZE), mod(snake.head.col + deltas[1], GRID_SIZE)]

		if(next[0]==snake.head.next.row && next[1]==snake.head.next.col){
			return default_move(snake)
		} else {
			return next
		}
	}

	STARTING_LENGTH = 3
	GRID_SIZE = bots.length*10
	APPLES = Math.pow(GRID_SIZE,2)/4

	if(keep_log){
		log = []
	}

	var grid = empty_grid(GRID_SIZE, ".")
	
	var moves = {
		"n": [-1,0],
		"e": [0,1],
		"s": [1,0],
		"w": [0,-1],
	}

	shuffle(bots)

	// Make and place snakes

	var snakes = []
	var scores = {}

	for (var i = 0; i < bots.length; i++) {
		var new_snake = new Snake(bots[i].move, String.fromCharCode(97+i))
		new_snake.name = bots[i].name
		new_snake.timeout = 0
		new_snake.score = 0

		var start = i*10+4

		for (var j = 0; j < STARTING_LENGTH; j++) {
			new_snake.add_head(start, start+j)
			grid[start][start+j] = new_snake.letter
		};

		grid[new_snake.head.row][new_snake.head.col] = new_snake.letter.toUpperCase()

		snakes.push(new_snake)
		scores[new_snake.name+" "+new_snake.letter] = snakes[snakes.length-1].score
	};

	// Place starting apples

	for(var i = 0; i < APPLES; i++){
		var empty = find_empty_cell()
		grid[empty[0]][empty[1]] = "*"
	}

	if(keep_log){
		log.push({"grid": copy(grid), "scores": copy(scores)})
	}

	MAX_TURNS = 5000

	while(snakes && MAX_TURNS && APPLES){
		MAX_TURNS--

		for (var i = 0; i < snakes.length; i++) {
			if(snakes[i].timeout){ 
				snakes[i].timeout-- 
			} else {			
				var move = snakes[i].move(make_map(snakes[i])).toLowerCase()
				next = find_new_cell(snakes[i], moves[move])
				move_to_cell(snakes[i], next[0], next[1])

				if(keep_log){
					log.push({"grid": copy(grid), "scores": copy(scores)})
				}
			}
		};
	}

	if(keep_log){
		var output = "var log = " + JSON.stringify(log, null, "\t")
		fs.writeFile("log.js", output, function(err){
			if(err){ console.log("Error while saving", err)}
		})
	}

	return scores

}

function play_many_games(bots, number_of_games){
	if(!number_of_games){ number_of_games = 100 }
	
	running_totals = {}

	for(var i = 0; i < bots.length; i++){
		running_totals[bots[i].name] = 0
	}

	for(var games = 0; games < 100; games++){
		var scores = snakes(bots)
		for(var bot in scores){
			running_totals[bot.slice(0,-2)] += scores[bot]
		}
	}

	return running_totals
}

// Bots go here
function random_snake(){
	return "NEWS"[Math.floor(Math.random()*4)] 
}

function greedy_snake(map){
	if(map[mod(this.head.row-1, map.length)][this.head.col]=="*"){
		return "n"
	} else if(map[mod(this.head.row+1, map.length)][this.head.col]=="*") {
		return "s"
	} else if(map[this.head.row][mod(this.head.col-1, map.length)]=="*") {
		return "w"
	} else if(map[this.head.row][mod(this.head.col+1, map.length)]=="*") {
		return "e"
	} else {
		return "?"
	}
}

function diagonal(){
	this.last_north = !this.last_north
	if(this.last_north){
		return "e"
	} else {
		return "n"
	}
}

function spiral(){
	// This could lead to excellence, or serious injury
	// https://www.youtube.com/watch?v=2aeOBZ7gVPY
	if(!this.dir_index){ this.dir_index = 1 }
	if(!this.side_length){ this.side_length = 3}
	if(!this.counter){ 
		this.counter = Math.ceil(this.side_length/this.length)
		this.side_length++
	} else {
		this.counter--
	}
	
	dirs = ["e", "n", "w", "s"]

	return dirs[this.side_length % 4]
}

function apple_turnover(){
	// Turns every time it eats an apple
	dirs = ["e", "s", "w", "n"]
	return dirs[this.score % 4]
}

var bots = [
	// {"name": "Westy", "move": function(){ return this.head.col - this.head.next.col == 1 ? "n" : "w" }},
	// {"name": "Northy", "move": function(){ return "n" }},
	// {"name": "Southy", "move": function(){ return "s" }},
	// {"name": "Easty", "move": function(){ return "e" }},
	{"name": "random_snake", "move": random_snake},
	{"name": "greedy_snake", "move": greedy_snake},
	{"name": "Diagonal", "move": diagonal},
	{"name": "The spiraling snake will make you go insane (everyone wants to see that groovy thing)", "move": spiral},
	// {"name": "Don't spend the rest of your life wondering", "move": spiral},
	// {"name": "Putting all reason aside you decide to exchange what you've got for something hypnotic and strange", "move": spiral},
	// {"name": "Now that you've tried it you're back to deny it, the spiraling snake is a fraud and a fake", "move": spiral},
	{"name": "apple_turnover", "move": apple_turnover}
]

snakes(bots, keep_log=true)

// console.log(play_many_games(bots))

/* Snake import test
var my_snake = new Snake()

my_snake.add_head(0,1)
my_snake.add_tail(1,1)
my_snake.add_tail(2,1)
my_snake.add_head(0,0)

console.log(my_snake.is_valid())
console.log(my_snake.print())

my_snake.remove_tail()
my_snake.remove_head()

console.log(my_snake.is_valid())
console.log(my_snake.print())
*/ 
