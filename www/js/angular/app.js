angular.module("DragonsTable", [])
	.controller("MainCtrl", ['$scope', function($scope) {
		log("Angular main controller initialized");
		init();
	}])
	.controller("MapCtrl", ['$scope', function($scope) {
		log("Initializing map controller");
		app.mapInit();
		log("Map initialized");
	}])
;
