const STAGE_WIDE = 10;
const STAGE_HEIGHT = 20;
const DEFAULT_FALL_INTERVAL = 350; // ms

// point config
const COMP_POINT = 10
const BONUS_RATE = 2.5
const BONUS_RATE_PLUS = 1

// key codes
const ENTER			= 13;
const SPACE			= 32;
const ARROW_LEFT	= 37;
const ARROW_RIGHT	= 39;
const ARROW_DOWN	= 40;
const A				= 65;
const S				= 83;
const D				= 68;
const H				= 72;
const J				= 74;
const L				= 76;
const P				= 80;


const colors = [
	'cyan', 'yellow', 'purple',
	'green', 'red', 'blue', 'orange',
];

var stage, block, gameMaster;
var fallInterval = DEFAULT_FALL_INTERVAL;

const fallTimerCtrl = new class {
	constructor() {
		this._timerID = null;
		this._interval = DEFAULT_FALL_INTERVAL;
	}
	get isOn() {
		return !(this._timerID === null);
	}
	on() {
		if(this.isOn) { 
			console.error('timer duplicates')
			return;	
		}
		this._timerID = setInterval(() => {
			block.fall();
		}, this._interval);	
	}
	off() {
		clearInterval(this._timerID);
		this._timerID = null;
	}
	changeSpeed(ms) {
		this.off();
		this._interval = ms;
		this.on();
	}
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function blockKeyHandler(e) {
	console.log('block.keyHandler')
	if([ARROW_LEFT, A, H].includes(e.which))
		block.moveL();
	else if([ARROW_RIGHT, D, L].includes(e.which))
		block.moveR();
	else if(e.which === SPACE)
		block.lotate();
	else if([ARROW_DOWN, S, J].includes(e.which)) {
		if(fallTimerCtrl.isOn) {
			fallTimerCtrl.off();
			block.fall();
			fallTimerCtrl.on();
		}
	}
}


class Cell {
	constructor(r, c) {
		this._active = false; // is not empty
		this._isBlk = false; // is a cell a block contains
		this._color = undefined;
		this._pos = { r, c };
	}

	get active()	{ return this._active; }
	get isBlk()		{ return this._isBlk; } 
	get color()		{ return this._color; }

	// change to a block's cell
	activate(col) {
		this._active = true;
		this._isBlk = true;
		this._color = col;
	}

	// change a block's cell to a just cell
	inactivate() {
		this._isBlk = false;
	}
	
	// change to a non cell
	del() {
		this._active = false;
		this._isBlk = false;
		this._color = undefined;
	}

	changeCol(col) {
		this._color = col;
	}

	extend(cell) {
		this._active = cell._active;
		this._isBlk = cell._isblk;
		this._color = cell._color;
	}

}

class Stage {
	constructor() {
		this._stage;
		this._size = { w: STAGE_WIDE, h: STAGE_HEIGHT };
		this._hoge;
		this.init();	
	}

	get stage() { return this._stage; }
	get size() { return this._size; }
	get hoge() { return this._hoge; }

	init() {
		this._stage = [];
		for(var r = 0; r < this.size.h + 4; r++) {
			this._stage.push([]);
			for(var c = 0; c < this.size.w; c++) {
				this._stage[r].push(new Cell(r, c));
			} 
		}
		this.render();
	}
	
	// handle stage-size like 0... STAGE_WIZE-1
	getCell(r, c) {	
		// console.log(r, c)
		return this._stage[r+4][c]; }


	get cellsOfBlock() {
		var retval = [];

		for(var r of this._stage) {
			for(var c of r) {
				if(c.isBlk)	{
					retval.push(c);
				}
				if(retval.length === 4) break;
			}
			if(retval.length === 4) break;
		}
		return retval;
	}

	render() {
		var color = colors[rand(0, colors.length-1)];
		for(var r = 0; r < this.size.h; r++) {
			for(var c = 0; c < this.size.w; c++) {
				var cell  = this.getCell(r, c);
				var $cell = $(`[data-row="${r}"][data-column="${c}"]`);
				$cell.attr('data-color', cell.color || 'null');
					
			}
		}
	}

	chkComp() {
		var compLine = [];	
		for(var r = this._size.h - 1; r >= 0; r--) {
			var flagCompTheLine = true;
			for(var c = 0; c < this._size.w; c++) {
				var cell = this.getCell(r, c);
				if(!cell.active) {
					flagCompTheLine = false;
					break;
				}
			}	
			if(flagCompTheLine) compLine.push(r);
		}
		return compLine;
	}

	// when block lands on, emit this
	chkGameOver() {
		// explore hidden head of this
		for(var r = 0; r < 4; r++) {
			for(var c = 0; c < this.size.w; c++) {
				var cell = this.getCell(r, c);
				var cell = this._stage[r][c];
				if(cell.active) {
					console.log('factor of gameover', r, c)
					return true;
				}
			}
		}
		return false;
	}

	// shift below specified line and up
	shiftLines(lineNum) {
		for(var r = lineNum; r >= 1; r--) {
			for(var c = 0; c < this._size.w; c++) {
				var srcCell = this.getCell(r, c);
				var destCell = this.getCell(r+1, c);
				destCell.extend(srcCell);
			}
		}	
		this.delLine(0);
	}

	delLine(lineNum) {
		for(var c = 0; c < this._size.w; c++) {
			var cell = this.getCell(lineNum, c);
			console.log('del cell < stage', c, lineNum);
			console.log(cell)
			cell.del();
		}
	}

	killBlock() {
		for(var c of this.cellsOfBlock)
			c.inactivate();
	}
	
	// change position of an active-block
	apply(blkInfo) {
		console.log('stage.apply()');

		// delete all cells of active-block
		for(var c of this.cellsOfBlock) c.del();

		// draw active-block 
		for(var r = 0; r < blkInfo.pattern.length; r++) {
			for(var c = 0; c < blkInfo.pattern[r].length; c++) {
				var pos = { 
					r: blkInfo.pos.r + r,
					c: blkInfo.pos.c + c
				}
				if(pos.c < 0 || this._size.w-1 < pos.c) continue;
				if(this._size.h-1 < pos.r) continue;

				if(blkInfo.pattern[r][c]) {
					// console.log('block', r, c)
					var cell = this.getCell(pos.r, pos.c);
					cell.activate(blkInfo.color);
					// console.log(cell.active)
				}
			}
		}	
		this.render();
		console.dir(this.stat());	
	}

	// DEBUG
	stat() {
		var retval = [];
		for(var r = 0; r < this.size.h + 4; r++) {
			retval.push([]);
			for(var c = 0; c < this.size.w; c++) {
				var cell = this._stage[r][c];
				if(r < 4 && !cell.active)
					retval[r].push(4);
				else
					retval[r].push(cell.active ? 1 : 0);
			}	
		}
		return retval;
	}
}

class Block {
	constructor() {
		this._type;
		this._pattern;
		this._pos = { r: null, c: null };
		this._color;
		this._aroundCells;
		this._stats = {
			moveR:	null,
			moveL:	null,
			fall:	null,
			rotate: null,
		}
		this._statistics = []	
	}

	get statistics() {
		return this._statistics;
	}

	init() {
		console.log('block.init()')

		this._type = rand(0, 4);
		var pattern = BLOCK_PATTERNS[this._type];
		pattern = this.lotate(pattern, rand(1,4));
		this._pattern = this.reverse(pattern, rand(1,2));

		this._pos = { r: -4, c: Math.floor(STAGE_WIDE / 2) - 2 };
		this._color = colors[rand(0, colors.length-1)];

		this.applyStage();
		this.chkPossibleMovings();

		$(document).on('keydown', blockKeyHandler);
		fallTimerCtrl.on();

		if(this._statistics[this._type])
			this._statistics[this._type]++
		else
			this._statistics[this._type] = 1
	}

	routine() {
		this.chkPossibleMovings();
		this.fall();
	}

	kill() {
		console.log('block.kill()');
		$(document).off('keydown', blockKeyHandler);
		stage.killBlock();
		fallTimerCtrl.off();
	}

	changeFallSpeed(ms) {
		console.log(`block.changeFallSpeed(${ms})`);
		fallTimerCtrl.changeSpeed(ms);
	}

	halt() {
		console.log('block.halt()');
		fallTimerCtrl.off();
	}

	resume() {
		console.log('block.resume()');
		fallTimerCtrl.on();
	}
	
	lotate(pattern, times=1) {
		var execFlag;
		if(pattern === undefined) {
			if(!this._stats.lotate) return;
			console.log('block.lotate()');
			pattern = this._pattern;
			execFlag = true;
		}
				
		var lot = function(pat) {
			var lotated = [[], [], [], []];
			for(var i = 0; i < 4; i++) {
				for(var j = 3; j >= 0; j--) {
					lotated[i].push(pat[j][i]);
				}
			}
			return lotated;
		}
		var result = pattern;
		for(var i = 0; i < times; i++) {
			result = lot(result);
		}
		
		// if no arguments, set this._pattern
		if(execFlag) {
			this._pattern = result;
			this.applyStage();
			this.chkPossibleMovings();
		}
		
		return result;
	}

	reverse(pattern=this._pattern, times=1) {
		var rev = function(pat) {
			var reversed = [[], [], [], []];
			for(var i = 3; i >= 0; i--) {
				for(var j = 3; j >=0; j--) {
					reversed[3-i].push(pat[i][j]);
				}
			}
			return reversed;
		}
		var result = pattern;
		for(var i = 0; i < times; i++) {
			result = rev(result);
		}
		return result;
	}

	activeCellsPos() {
		var retval = []
		for(var r in this._pattern) {
			for(var c in this._pattern[r]) {
				if(this._pattern[r][c]) {
					r = Number(r);
					c = Number(c);
					retval.push({ r, c });	
				}
			}
		}
		return retval;
	}

	applyStage() {	
		console.log('block.applyStage()');
		stage.apply({
			pattern: this._pattern,
			pos: this._pos,
			color: this._color,
			// stat: this._stats, //debug
			// around: this._aroundCells, //debug
		});
	}

	moveR() {
		if(!this._stats.moveR) return;
		console.log('block.moveR()');

		this._pos.c++;	

		this.applyStage();
		this.chkPossibleMovings();
	}

	moveL() {
		if(!this._stats.moveL) return;
		console.log('block.moveL()');

		this._pos.c--;

		this.applyStage();
		this.chkPossibleMovings();
	}

	fall() {
		if(this._stats.fall) {
			console.log('block.fall()');

			this._pos.r++;

			this.applyStage();
			this.chkPossibleMovings();
		}
		else { // land on
			this.kill();	
			if(stage.chkGameOver())
				gameMaster.gameOver();
			else {
				var compLines = stage.chkComp();	
				console.log('=============')
				console.log(compLines)
				if(compLines.length > 0)	gameMaster.complete(compLines); 
				this.init();	
			}
		}
	}

	retrieveAroundCells() {
		var retval = [[], [], [], [], [], []];
		for(var r = -1; r < 5; r++) {
			for(var c = -1; c < 5; c++) {
				var pos = {
					r: this._pos.r + r,
					c: this._pos.c + c
				}
				var _r = r + 1; // fix for array
				var _c = c + 1;
				if(pos.c < 0 || STAGE_WIDE-1 < pos.c) // side wall
					retval[_r][_c] = 3;
				else if(pos.r < 0) // hidden head of stage
					retval[_r][_c] = 4;
				else if(pos.r > STAGE_HEIGHT-1)
					retval[_r][_c] = 5;
				else {
					var cell = stage.getCell(pos.r , pos.c);
					if(cell.isBlk)			retval[_r][_c] = 1; // same cell
					else if(cell.active)	retval[_r][_c] = 2; // other cell
					else					retval[_r][_c] = 0; // no cells
				}
			}
		}
		this._aroundCells = retval;
	}
	
	// retrieve stats from stage-class
	chkPossibleMovings() {
		console.log('Investigating block\' stats...');

		var activeCellsPos = this.activeCellsPos();	
		var retval = { moveR: true, moveL: true, fall: true, lotate: true };
		// update this._aroundCells
		this.retrieveAroundCells();
		
		// check about moving right/left 
		for(var p of activeCellsPos) {
			var r = p.r + 1; // fix for this._aroundCells
			var c = p.c + 1;
			var ac = { // around cells
				right	: this._aroundCells[r][c+1],
				left	: this._aroundCells[r][c-1],
				up		: this._aroundCells[r-1][c],
				down	: this._aroundCells[r+1][c]
			};
			if(![0, 1, 4].includes(ac.right))		retval.moveR = false;
			if(![0, 1, 4].includes(ac.left))		retval.moveL = false;
			if(![0, 1, 4].includes(ac.down))		retval.fall = false;
		}

		// check about lotation
		var lotated = this.lotate(this._pattern);
		for(var r = 0; r < lotated.length; r++) {
			for(var c = 0; c < lotated[r].length; c++) {
				if(lotated[r][c] && ![0, 1, 4].includes(this._aroundCells[r+1][c+1]))
					retval.lotate = false;
					
			}
		}
		
		// console.dir(retval);
		// console.dir(this._aroundCells);
		this._stats = retval;
	}
}

const GameMasterVue = {
	el: '#app',
	data: {
		isPlaying: false,
		isPausing: false,
		isGameover: false,
		points: [],
		nowPoint: 0,
		ranking: [],
		msgs: {
			toStart: 'Push "Enter" to Start the Game',
			toPause: 'Push "P" to Pause',
			toUnpause: 'Push "P" to Turn Back',
			toRetry: 'Oops! GAMEOVER! Push "Enter" to Retry the Game'
		}
	},
	computed: {
		announce: function() {
			if(!this.isPlaying) {
				if(this.isGameover)	return this.msgs.toRetry;
				else				return this.msgs.toStart;
			}
			else {
				if(this.isPausing)	return this.msgs.toUnpause;
				else				return this.msgs.toPause;
			}
		}	
	},
	watch: {
		points: {
			// immediate: true,
			deep: true,
			handler: function(val) {
				var pts = [...this.points]; // by value
				pts.sort((n, m) => m - n);	// to be ascending order
				if(pts.length >= 5)
					this.ranking = pts.slice(0, 5);
				else
					this.ranking = pts;
			}
		}
	},
	methods: {
		gameStart: function() {
			console.log('gameStart');
			this.isPlaying = true;
			this.isGameover = false;
			this.nowPoint = 0;
			stage.init();
			block.init();
		},
		calcPoint: function(num) { // num: number of completed lines
			var point = COMP_POINT;
			var bonusRate = BONUS_RATE;
			var bonusRatePlus = BONUS_RATE_PLUS;
			for(var i = 0; i < num; i++) {
				point *= bonusRate;
				bonusRate += bonusRatePlus;
				bonusRatePlus += 0.5;
			}
			return point;
		},
		complete: function(lineNums) {	
			console.log('complete', lineNums)
			var delCnt = 0	
			for(var r of lineNums) {
				stage.delLine(r + delCnt);
				stage.shiftLines(r-1 + delCnt);
				delCnt++;
			}
				
			this.nowPoint += this.calcPoint(lineNums.length);
		},
		gameOver: function() {	
			if(this.isGameover) return;
			console.log('gameover')
			this.isPlaying = false;	
			this.isGameover = true;
			this.points.push(this.nowPoint);
		},
		pauseTgl: function() {
			if(!this.isPlaying || this.isGameover) return;
			if(this.isPausing) {
				this.isPausing = false;
				block.resume();
			}	
			else {
				this.isPausing = true;
				block.halt();
			}
		}
	}
}
var app;

$(function() {
	console.log('ready');

	stage		= new Stage();
	block		= new Block();
	gameMaster	= new Vue(GameMasterVue);

	$(document).on('keydown', (e) => {
		if(e.which === ENTER && !gameMaster.isPlaying)
			gameMaster.gameStart();
		else if(e.which === P)
			gameMaster.pauseTgl();
	});
});
