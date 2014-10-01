function Map(canvas) {
	this.canvas = canvas;
	
	this.ctx = this.canvas.getContext("2d");
	
	this.feetPerGrid = 5;
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
}
