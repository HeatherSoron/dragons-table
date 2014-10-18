angular.module("DragonsTable", [])
	.controller("MainCtrl", ['$scope', function($scope) {
		log("Angular main controller initialized");
		init();
		
		$scope.subpages = ['networking', 'map'];
		$scope.shownSubpages = [];
		$scope.show = function(item) {
			return $scope.shownSubpages.indexOf(item) !== -1;
		};
	}])
	.controller("MapCtrl", ['$scope', function($scope) {
		log("Initializing map controller");
		app.mapInit();
		log("Map initialized");
	}])
;
