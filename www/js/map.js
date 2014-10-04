var GRID_FEET = 5;

function Map(canvas) {
	this.canvas = canvas;
	
	this.objects = [];
	
	this.ctx = this.canvas.getContext("2d");
	
	this.feetPerGrid = 5;
}

Map.prototype.pxToGrid = function(px, useFloat) {
	var grid = {};
	for (var coord in px) {
		var newVal = px[coord] / (this.feetPerGrid * this.footScale);
		if (!useFloat) {
			newVal = Math.floor(newVal);
		}
		grid[coord] = newVal;
	}
	return grid;
}

Map.prototype.addObject = function(obj) {
	this.objects.push(obj);
}

Map.prototype.getObjectAtPixels = function(pos) {
	return this.getObjectAtGrid(this.pxToGrid(pos));
}

Map.prototype.getObjectAtGrid = function(pos) {
	for (var i = 0; i < this.objects.length; ++i) {
		var obj = this.objects[i];
		if (pos.x == Math.round(obj.x) && pos.y == Math.round(obj.y)) {
			return obj;
		}
	}
	return undefined;
}

Map.prototype.recalc = function(footScale, rows, cols) {
	this.footScale = footScale;
	this.rows = rows;
	this.cols = cols;
	
	this.gridSize = this.feetPerGrid * this.footScale;
	
	this.width = this.cols * this.gridSize;
	this.height = this.rows * this.gridSize;
	
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	
	this.redraw();
}

Map.prototype.redraw = function() {
	this.clear();
	for (var i = 1; i < this.cols; ++i) {
		var x = i * this.gridSize - 0.5;
		this.ctx.beginPath();
		this.ctx.moveTo(x, 0);
		this.ctx.lineTo(x, this.height);
		this.ctx.stroke();
	}
	for (var j = 1; j < this.rows; ++j) {
		var y = j * this.gridSize - 0.5;
		this.ctx.beginPath();
		this.ctx.moveTo(0, y);
		this.ctx.lineTo(this.width, y);
		this.ctx.stroke();
	}
	
	for (var i = 0; i < this.objects.length; ++i) {
		this.objects[i].draw(this.ctx, this.footScale);
	}
}

Map.prototype.clear = function() {
	var width = this.canvas.width;
	var height = this.canvas.height;
	
	this.ctx.clearRect(0, 0, width, height);
}

function Drawable(x, y, color, size) {
	this.x = x;
	this.y = y;
	this.color = color;
	this.feet = size ? size : 3;
}

Drawable.prototype.draw = function(ctx, scale, ghost) {
	var obj = ghost ? ghost : this;
	var xpx = (obj.x + 0.5) * GRID_FEET * scale;
	var ypx = (obj.y + 0.5) * GRID_FEET * scale;
	var radius = this.feet * scale / 2;
	
	ctx.fillStyle = this.color ? this.color : 'rgb(0,0,0)';
	ctx.beginPath();
	ctx.arc(xpx, ypx, radius, 0, 2 * Math.PI, true);
	ctx.fill();
	
	if (!ghost && this.ghost) {
		var oldAlpha = ctx.globalAlpha;
		ctx.globalAlpha = 0.5;
		this.draw(ctx, scale, this.ghost);
		ctx.globalAlpha = oldAlpha;
	}
}

Drawable.prototype.snapToGhost = function() {
	this.x = Math.round(this.ghost.x);
	this.y = Math.round(this.ghost.y);
	this.ghost = undefined;
}
