var Board = {
	config: {
		sound: {
			paths: {
				twoFrogsLong: "/sounds/2frogsLong.wav",
				cuteFrogMidLength: "/sounds/cutefrogmedium.wav",
				beautifulFrogsLong: "/sounds/beautifullvlong.wav",
			}
		}
	},
	tiles: [],
	fragment: $('<ul class="tile-board">'),
	reset: function() {
		this.fragment.empty();
		this.tiles = [];
		var tileToCreate = (this.grid.dimensions[0] * this.grid.dimensions[1]);
		for (var i = 0; i < tileToCreate; i++) {
			this.tiles.push(new Tile(this));
			this.tiles[i].slot = [(i % this.grid.dimensions[0]), Math.floor(i / this.grid.dimensions[0])];
		}
		this.grid.emptySlot = this.tiles[this.tiles.length - 1].slot;
		this.winningTileConfig = this.tiles.map(function(tile) {
			return tile.slot;
		});
		this.randomizeTiles();
		this.overlayMessage("Level " + this.level);
	},
	init: function() {
		$('body').append(this.fragment);
		this.level = 1;
		this.grid = {
			dimensions: [2, 2]
		};
		this.image = new Image();
		this.image.onload = function() {
			Board.caliberate();
		};
		this.image.src = "img/frog.svg";
		this.reset();
		$(window).on('resize', function() {
			Board.caliberate();
		});
		this.fragment.on('mousedown touchstart', function() {
			var boardCompleteTimeout,
				hintTimeout = setTimeout(function() {
					Board.hint();
					boardCompleteTimeout = setTimeout(function() {
						Board.fragment.addClass('complete');
					}, 200);
				}, 500);
			var hintEndCallback = function() {
				clearTimeout(hintTimeout);
				clearTimeout(boardCompleteTimeout);
				Board.fragment.removeClass('complete');
				Board.caliberate();
				$(window).off('blur mouseup touchend touchcancel', hintEndCallback);
			};
			$(window).on('blur mouseup touchend touchcancel', hintEndCallback)
		});
		const controlKeys = {
			CONTROL_UP: 38,
			CONTROL_RIGHT: 39,
			CONTROL_DOWN: 40,
			CONTROL_LEFT: 37
		};
		$(window).on('keyup', function(e) {
			switch (e.keyCode) {
				case controlKeys.CONTROL_UP:
					Board.moveTile([Board.grid.emptySlot[0], Board.grid.emptySlot[1] + 1]);
					break;
				case controlKeys.CONTROL_RIGHT:
					Board.moveTile([Board.grid.emptySlot[0] - 1, Board.grid.emptySlot[1]]);
					break;
				case controlKeys.CONTROL_DOWN:
					Board.moveTile([Board.grid.emptySlot[0], Board.grid.emptySlot[1] - 1]);
					break;
				case controlKeys.CONTROL_LEFT:
					Board.moveTile([Board.grid.emptySlot[0] + 1, Board.grid.emptySlot[1]]);
					break;
			}
		});
		this.initSounds();
	},
	randomizeTiles: function() {
		var randomizableTiles = this.tiles.slice(0, this.tiles.length - 1),
			randomizationMoves = (this.grid.dimensions[0] * this.grid.dimensions[1]) - 1;
		if (randomizationMoves > 3) {
			randomizationMoves *= 100;
		}
		for (var i = 0, j = randomizationMoves; i < j; i++) {
			var movableSlots = [
				[this.grid.emptySlot[0] - 1, this.grid.emptySlot[1]],
				[this.grid.emptySlot[0], this.grid.emptySlot[1] - 1],
				[this.grid.emptySlot[0] + 1, this.grid.emptySlot[1]],
				[this.grid.emptySlot[0], this.grid.emptySlot[1] + 1]
			];
			movableSlots = movableSlots.map(function(slot) {
				return slot.join('1');
			});
			var movableTiles = randomizableTiles.filter(function(tile) {
				return movableSlots.indexOf(tile.slot.join('1')) !== -1;
			});
			var index = Math.floor(Math.random() * movableTiles.length);
			var emptySlot = this.grid.emptySlot;
			this.grid.emptySlot = movableTiles[index].slot;
			movableTiles[index].slot = emptySlot;
		}
		this.tiles[this.tiles.length - 1].slot = this.grid.emptySlot;
		this.caliberate();
	},
	hint: function() {
		this.config.sound.hint.play();
		var tileDimensions = this.getTileDimensions();
		this.tiles.forEach(function(tile, index) {
			tile.moveTo({
				"left": Board.winningTileConfig[index][0] * tileDimensions.width,
				"top": Board.winningTileConfig[index][1] * tileDimensions.height,
				"z-index": Board.winningTileConfig[index][0] + (Board.winningTileConfig[index][1]) * Board.grid.dimensions[0]
			});
		});
	},
	getEligibleTileForPosition: function(position, callback) {
		if (!this.fragment.hasClass('complete')) {
			for (var i = 0, j = this.winningTileConfig.length; i < j; i++) {
				if (position[0] === this.winningTileConfig[i][0] && position[1] === this.winningTileConfig[i][1]) {
					callback(this.tiles[i]);
					break;
				}
			}
		}
	},
	caliberate: function() {
		var imageAspectRatio = this.getBoardImageAspectRatio(),
			boardWidth = window.innerWidth,
			boardHeight = window.innerHeight,
			imageSize = [imageAspectRatio * boardHeight, boardHeight];
		if (imageSize[0] > boardWidth) {
			imageSize = [boardWidth, boardWidth / (this.image.width || 1) * this.image.height];
			boardHeight = imageSize[1];
		} else {
			boardWidth = imageSize[0];
		}
		this.fragment.width(Math.floor(boardWidth / this.grid.dimensions[0]) * this.grid.dimensions[0]);
		this.fragment.height(Math.floor(boardHeight / this.grid.dimensions[1]) * this.grid.dimensions[1]);
		var boardDimensions = this.getBoardDimensions(),
			tileDimensions = this.getTileDimensions(),
			tileBackgroundImage = "url(" + this.image.src + ")",
			tileBackgroundSize = (this.getBoardImageAspectRatio() < this.getBoardAspectRatio()) ? (boardDimensions.width + "px" + " auto") : ("auto " + boardDimensions.height + "px");
		this.tiles.forEach(function(tile, index) {
			tile.caliberate({
				dimensions: tileDimensions,
				background: {
					image: tileBackgroundImage,
					size: tileBackgroundSize
				},
				position: {
					x: (index % Board.grid.dimensions[0]) * tileDimensions.width,
					y: Math.floor(index / Board.grid.dimensions[0]) * tileDimensions.height
				}
			});
		});
		this.tiles[this.tiles.length - 1].moveTo({
			"left": this.grid.emptySlot[0] * tileDimensions.width,
			"top": this.grid.emptySlot[1] * tileDimensions.height,
			"z-index": 0
		});
	},
	getTileDimensions: function() {
		return {
			width: this.fragment.width() / this.grid.dimensions[0],
			height: this.fragment.height() / this.grid.dimensions[1]
		}
	},
	getBoardDimensions: function() {
		return {
			width: this.fragment.width(),
			height: this.fragment.height()
		}
	},
	// AspectRatio > 1 = PORTRAIT | AspectRatio < 1 = LANDSCAPE | AspectRatio == 1 = SQUARE
	getBoardImageAspectRatio: function() {
		return this.image.width / (this.image.height || 1);
	},
	getBoardAspectRatio: function() {
		var boardDimensions = this.getBoardDimensions();
		return boardDimensions.width / boardDimensions.height;
	},
	moveTile: function(tile) {
		var tileSlot = (tile instanceof Tile) ? tile.slot : tile;
		if (Math.abs(tileSlot[0] - this.grid.emptySlot[0]) + Math.abs(tileSlot[1] - this.grid.emptySlot[1]) === 1) {
			tile = (tile instanceof Tile) ? tile : Board.tiles.filter(function(boardTile) {
				return boardTile.slot[0] === tile[0] && boardTile.slot[1] === tile[1];
			})[0];
			!tile || this.moveTileToEmptySlot(tile);
		} else {
			this.config.sound.wrongMove.play();
		}
	},
	moveTileToEmptySlot: function(tile, callback) {
		var tileDimensions = this.getTileDimensions(),
			emptySlot = this.grid.emptySlot;
		this.grid.emptySlot = tile.slot;
		var emptySlotTile = this.tiles[this.tiles.length - 1];
		emptySlotTile.slot = this.grid.emptySlot;
		tile.slot = emptySlot;
		this.config.sound.move.play();
		tile.moveTo({
			"left": tile.slot[0] * tileDimensions.width,
			"top": tile.slot[1] * tileDimensions.height,
			"z-index": tile.slot[0] + (tile.slot[1]) * this.grid.dimensions[0]
		});
		emptySlotTile.moveTo({
			"left": emptySlotTile.slot[0] * tileDimensions.width,
			"top": emptySlotTile.slot[1] * tileDimensions.height,
			"z-index": 0
		});
		clearTimeout(this.tileConfigCheckTimeout);
		this.tileConfigCheckTimeout = setTimeout(function() {
			delete Board.tileConfigCheckTimeout;
			Board.checkTileConfig();
		}, 300);
	},
	overlayMessage: function(message, callback) {
		var winnerScreen = $('<div class="winning-screen">'),
			winningContainer = $('<div class="winning-screen-container">');
		winnerScreen.html(winningContainer.html('<h1>' + message + '</h1>'));
		this.fragment.append(winnerScreen);
		setTimeout(function() {
			winnerScreen.remove();
			(typeof callback !== "function") || callback();
		}, 3000);
	},
	checkTileConfig: function() {
		var tileConfig = this.tiles.map(function(tile) {
			return tile.slot;
		});
		for (var i = 0, j = this.winningTileConfig.length; i < j; i++) {
			if (tileConfig[i][0] !== this.winningTileConfig[i][0] || tileConfig[i][1] !== this.winningTileConfig[i][1]) return;
		}
		if (this.grid.dimensions[0] === this.grid.dimensions[1]) {
			this.grid.dimensions[0]++;
		} else {
			this.grid.dimensions[1]++;
		}
		this.level++;
		this.levelCompleted = true;
		this.fragment.addClass('complete');
		this.pauseBackGroundSound();
		this.config.sound.win.play();
		this.overlayMessage("You win!", function() {
			delete Board.levelCompleted;
			Board.fragment.removeClass('complete');
			Board.reset();
		});
		this.playBackGroundSound();
	},
	initSounds: function(){
		const board = this;
		$(document).ready(function(){
			board.backGroundSounds();
			board.boardMovesSounds();
			board.config.sound.win = new Howl({
				src: ["/sounds/win.wav"],
				volume: 0.1
			});
		});
	},
	backGroundSounds: function() {
		this.config.sound.backgroundSound1 = new Howl({
			src: ["/sounds/flowing-canal.wav"],
			autoplay: true,
			loop: true,
			volume: 0.1
		});
		this.config.sound.backgroundSound2 = new Howl({
			src: ['/sounds/backgroundSound.mp3'],
			autoplay: true,
			loop: true,
			volume: 0.2
		});
		this.frogSounds(new Howl({
			src: [this.config.sound.paths.cuteFrogMidLength],
			volume: 0.1
		}), "cuteFrogMidLength");
		this.frogSounds(new Howl({
			src: [this.config.sound.paths.beautifulFrogsLong],
			volume: 0.1
		}), "beautifulFrogsLong");
	},
	frogSounds: function(sound, name) {
		const board = this;
		let delay = Math.ceil(Math.random() * 120000);
		console.log(`${name}: ${delay/10000}`)
		setTimeout(function() {
			sound.stop();
			sound.play();
			board.frogSounds(sound, name);
		}, delay)
	},
	boardMovesSounds: function() {
		this.config.sound.move = new Howl({
			src: ["/sounds/move.wav"],
			volume: 0.9
		});
		this.config.sound.wrongMove = new Howl({
			src: ["/sounds/wrong-move.mp3"],
			volume: 0.7
		});
		this.config.sound.hint = new Howl({
			src: ["/sounds/hint.wav"],
			volume: 0.7
		});
		this.config.sound.win = new Howl({
			src: ["/sounds/win.wav"],
			volume: 0.1
		});
	},
	pauseBackGroundSound: function() {
		this.config.sound.backgroundSound1.stop();
		this.config.sound.backgroundSound2.stop();
	},
	playBackGroundSound: function() {
		this.config.sound.backgroundSound1.play();
		this.config.sound.backgroundSound2.play();
	}
};
