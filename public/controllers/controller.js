var app = angular.module("twitstr",[]);

app.controller('GitCtrl',function($scope,$http){ // every controller has its associated scope
		//coding for browser
		console.log("Hello from controller");
		rep1 = {
		"name": "1",
		"description":'2'
		};

		$scope.username = "";
		$scope.repos = [];


		ref = function(){
			$http.get('/github').success(function(response){
				$scope.username = "";
			});
		};

		$scope.getrepo = function(){
			$http.get('/github/'+$scope.username).success(function(response){
				console.log("I got the data"+response);
				$scope.repos = response;
				ref(); //refresh
			});
		};

	});

app.controller('TwtCtrl',function($scope,$http){ // every controller has its associated scope
		//coding for browser
		console.log("Hello from controller");
		rep1 = {
			"user":{
				"screen_name": "1"
			},			
			"text":'2'
		};

		$scope.keyword = "";
		//$scope.twits = [];


		ref = function(){
			$http.get('/').success(function(response){
				$scope.keyword = "";
			});
		};

		$scope.getTwit = function(){
			$http.get('/'+$scope.keyword).success(function(response){
				console.log("I got the data"+response);
				//$scope.twits = response;
				//ref(); //refresh
			});
		};
	});