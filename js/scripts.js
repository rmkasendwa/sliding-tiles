$(function() {
	var Board = {
		tiles: [],
		fragment: $('<ul class="tile-board">'),
		isPointOnBoard: function(point) {
			return point.left >= 0 && point.top >= 0 && point.left < this.fragment.width() && point.top < this.fragment.height();
		},
		canTileGoTo: function(tile, positionToGo) {
			return _.find(this.getAllTilePositions([tile]), positionToGo) === undefined;
		},
		getAllTilePositions: function(exceptions) {
			exceptions || (exceptions = []);
			return this.tiles.filter(function(tile) {
				return exceptions.indexOf(tile) === -1;
			}).map(function(tile) {
				return {
					left: parseInt(tile.fragment.css('left')),
					top: parseInt(tile.fragment.css('top'))
				};
			});
		},
		init: function() {
			console.log("Initializing Board...");
			$('body').append(this.fragment);
			var tileToCreate = 8;
			for (var i = 1; i <= tileToCreate; i++) {
				this.tiles.push(new Tile(this, i));
			}
		}
	};

	function Tile(board, number) {
		var tile = this;
		this.fragment = $('<li class="tile">');
		this.fragment.addClass('tile-' + number);
		board.fragment.append(this.fragment.on('click', function() {
			tile.move();
		}));
		console.log("A new tile has been created");
	}
	Tile.prototype = {
		constructor: Tile,
		move: function() {
			var tile = this;
			var whereIam = {
				left: parseInt(this.fragment.css('left')),
				top: parseInt(this.fragment.css('top'))
			};
			var surrounding = {
				top: Object.assign({}, {
					left: whereIam.left,
					top: whereIam.top - this.fragment.height()
				}),
				right: Object.assign({}, {
					left: whereIam.left + this.fragment.width(),
					top: whereIam.top
				}),
				down: Object.assign({}, {
					left: whereIam.left,
					top: whereIam.top + this.fragment.height()
				}),
				left: Object.assign({}, {
					left: whereIam.left - this.fragment.width(),
					top: whereIam.top
				})
			};
			var position = Object.keys(surrounding).filter(function(key) {
					return Board.isPointOnBoard(surrounding[key]);
				})
				.filter(function(key) {
					return Board.canTileGoTo(tile, surrounding[key]);
				}).map(function(key) {
					return surrounding[key];
				})[0];
			!position || (this.fragment.css(position));
		}
	}
	Board.init();
});
