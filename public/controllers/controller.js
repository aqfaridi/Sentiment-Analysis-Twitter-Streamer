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