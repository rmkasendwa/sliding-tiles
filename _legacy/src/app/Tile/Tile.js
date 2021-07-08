function Tile(board) {
	var tile = this;
	this.fragment = $('<li class="tile">');
	board.fragment.append(this.fragment.on('click', function() {
		Board.moveTile(tile);
	}));
	if (navigator && navigator.maxTouchPoints === 0) {
		this.fragment.on('mouseenter', function() {
			var eligibleTileFragment,
				directionHintTimeout = setTimeout(function() {
					Board.getEligibleTileForPosition(tile.slot, function(eligibleTile) {
						if (tile !== eligibleTile) {
							Board.fragment.addClass('complete');
							eligibleTileFragment = eligibleTile.fragment.addClass('move-hint');
							tile.fragment.addClass('slot-hint');
						}
					});
				}, 2000);
			tile.fragment.on('mouseout', function() {
				clearTimeout(directionHintTimeout);
				tile.fragment.removeClass('slot-hint').off('mouseout');
				Board.levelCompleted || Board.fragment.removeClass('complete');
				!eligibleTileFragment || eligibleTileFragment.removeClass('move-hint');
			});
		});
	}
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
