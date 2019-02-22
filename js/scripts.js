$(function() {
	var board = $('.tile-board');
	var tiles = $('.tile').on('click', function() {
		whereCanIGo($(this));
	});

	function whereCanIGo(tileElement) {
		var positionsOfAllTiles = tiles.filter(function() {
				return this !== tileElement[0];
			}).map(function() {
				return {
					left: parseInt($(this).css('left')),
					top: parseInt($(this).css('top'))
				}
			}).toArray(),
			whereIam = {
				left: parseInt(tileElement.css('left')),
				top: parseInt(tileElement.css('top'))
			};
		var coordinatesICanGoTo = {
			top: Object.assign({}, {
				left: whereIam.left,
				top: whereIam.top - tileElement.height()
			}),
			right: Object.assign({}, {
				left: whereIam.left + tileElement.width(),
				top: whereIam.top
			}),
			down: Object.assign({}, {
				left: whereIam.left,
				top: whereIam.top + tileElement.height()
			}),
			left: Object.assign({}, {
				left: whereIam.left - tileElement.width(),
				top: whereIam.top
			})
		};
		var youCanGoTo = Object.keys(coordinatesICanGoTo).filter(function(key) {
				return coordinatesICanGoTo[key].left >= 0 && coordinatesICanGoTo[key].top >= 0 && coordinatesICanGoTo[key].left < board.width() && coordinatesICanGoTo[key].top < board.height();
			})
			.filter(function(key) {
				return _.find(positionsOfAllTiles, coordinatesICanGoTo[key]) === undefined;
			}).map(function(key) {
				return coordinatesICanGoTo[key];
			})[0];
		if (youCanGoTo) {
			tileElement.css(youCanGoTo);
		}
	}
});
