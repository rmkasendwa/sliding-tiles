$(function() {
	var Board = {
		tiles: [],
		fragment: $('<ul class="tile-board">'),
		reset: function() {
			this.fragment.empty();
			this.tiles = [];
			var tileToCreate = (this.grid.dimensions[0] * this.grid.dimensions[1]) - 1;
			for (var i = 0; i < tileToCreate; i++) {
				this.tiles.push(new Tile(this));
				this.tiles[i].slot = [(i % this.grid.dimensions[0]), Math.floor(i / this.grid.dimensions[0])];
			}
			this.grid.emptySlot = [this.grid.dimensions[0] - 1, this.grid.dimensions[1] - 1];
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
			this.image.src = "img/robot.jpg";
			this.reset();
			$(window).on('resize', function() {
				Board.caliberate();
			}).on('mousedown', function() {
				var hintTimeout = setTimeout(function() {
					Board.hint();
				}, 500);
				$(window).on('blur mouseup', function() {
					clearTimeout(hintTimeout);
					Board.caliberate();
					$(window).off('blur mouseup');
				})
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
		},
		randomizeTiles: function() {
			for (var i = 0, j = this.grid.dimensions[0] * this.grid.dimensions[1] * 100; i < j; i++) {
				var movableSlots = [
					[this.grid.emptySlot[0] - 1, this.grid.emptySlot[1]],
					[this.grid.emptySlot[0], this.grid.emptySlot[1] - 1],
					[this.grid.emptySlot[0] + 1, this.grid.emptySlot[1]],
					[this.grid.emptySlot[0], this.grid.emptySlot[1] + 1]
				];
				movableSlots = movableSlots.map(function(slot) {
					return slot.join('1');
				});
				var movableTiles = this.tiles.filter(function(tile) {
					return movableSlots.indexOf(tile.slot.join('1')) !== -1;
				});
				var index = Math.floor(Math.random() * movableTiles.length);
				var emptySlot = this.grid.emptySlot;
				this.grid.emptySlot = movableTiles[index].slot;
				movableTiles[index].slot = emptySlot;
			}
			this.caliberate();
		},
		hint: function() {
			var tileDimensions = this.getTileDimensions();
			this.tiles.forEach(function(tile, index) {
				tile.moveTo({
					"left": Board.winningTileConfig[index][0] * tileDimensions.width,
					"top": Board.winningTileConfig[index][1] * tileDimensions.height,
					"z-index": Board.winningTileConfig[index][0] + (Board.winningTileConfig[index][1]) * Board.grid.dimensions[0]
				});
			});
		},
		caliberate: function() {
			this.fragment.width(Math.floor(window.innerWidth / this.grid.dimensions[0]) * this.grid.dimensions[0]);
			this.fragment.height(Math.floor(window.innerHeight / this.grid.dimensions[1]) * this.grid.dimensions[1]);
			this.fragment.css({
				'top': (window.innerHeight - this.fragment.height()) / 2,
				'left': (window.innerWidth - this.fragment.width()) / 2
			})
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
			}
		},
		moveTileToEmptySlot: function(tile, callback) {
			var tileDimensions = this.getTileDimensions(),
				emptySlot = this.grid.emptySlot;
			this.grid.emptySlot = tile.slot;
			tile.slot = emptySlot;
			tile.moveTo({
				"left": tile.slot[0] * tileDimensions.width,
				"top": tile.slot[1] * tileDimensions.height,
				"z-index": tile.slot[0] + (tile.slot[1]) * this.grid.dimensions[0]
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
				callback();
			}, 3000);
		},
		checkTileConfig: function() {
			var tileConfig = this.tiles.map(function(tile) {
				return tile.slot;
			});
			for (var i = 0, j = this.winningTileConfig.length; i < j; i++) {
				if (tileConfig[i][0] !== this.winningTileConfig[i][0] || tileConfig[i][1] !== this.winningTileConfig[i][1]) return;
			}
			if (this.grid.dimensions[0] < this.grid.dimensions[1]) {
				this.grid.dimensions[0]++;
			} else {
				this.grid.dimensions[1]++;
			}
			this.level++;
			this.overlayMessage("You win!", function() {
				Board.reset();
			});
		}
	};

	function Tile(board) {
		var tile = this;
		this.fragment = $('<li class="tile">');
		board.fragment.append(this.fragment.on('click', function() {
			Board.moveTile(tile);
		}));
	}
	Tile.prototype = {
		constructor: Tile,
		moveTo: function(coordinates) {
			this.fragment.css(coordinates)
		},
		caliberate: function(config) {
			this.moveTo({
				"left": this.slot[0] * config.dimensions.width,
				"top": this.slot[1] * config.dimensions.height
			});
			this.fragment.css(Object.assign({
				"background-image": config.background.image,
				"background-size": config.background.size,
				"background-position": (-config.position.x) + "px " + (-config.position.y) + "px",
				"z-index": this.slot[0] + (this.slot[1]) * Board.grid.dimensions[0]
			}, config.dimensions));
		}
	}
	Board.init();
});
