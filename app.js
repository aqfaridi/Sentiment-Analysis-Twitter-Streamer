var express = require("express");
var fs = require("fs");
var https = require("https");
var http = require("http");
var url = require("url");
var bodyParser = require('body-parser');
var routes = require('./routes'); // require routes folder to modularize routes  

var app = express();

app.set('view engine','ejs'); // use embeddedjs
app.use(express.static(__dirname+'/public'));//use static files
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



var config = JSON.parse(fs.readFileSync("config.json"));
var host = config.host;
var port = config.port;


var mongo = require("mongodb");
var dbHost = "127.0.0.1"
var dbPort = "27017"
var db = new mongo.Db("db_name",new mongo.Server(dbHost,dbPort,{}));
db.open(function(error){
	console.log("we are connected!" + dbHost + ":" + dbPort);
	
}); // open connection to mongo server 

function getRepos(username, callback) {

	var options = {
		host: 'api.github.com',
		path: '/users/' + username + '/repos',
		method: 'GET',
		headers: {
			"User-Agent" : "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:37.0) Gecko/20100101 Firefox/37.0"
		}
	};

	var request = https.request(options, function(response) {
		var body = '';
		response.on("data", function(chunk){
			body += chunk.toString('utf8');
		});
		response.on("end", function(){
			var repos = [];
			var json = JSON.parse(body);
			json.forEach(function(repo) {
				repos.push({
					name: repo.name,
					description: repo.description,
					html_url: repo.html_url
				});
			});

			callback(repos);
		});
	});
	request.end();
}


function getWeb(Host,Path, callback) {
	console.log(Host+ " "+Path);
	var options = {
		host: Host,
		path: Path,
		method: 'GET',
		headers: {
			"Content-Type" : "text/html; charset=UTF-8",
			"User-Agent" : "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:37.0) Gecko/20100101 Firefox/37.0"
		},

  		timeout: 10000,
  		followRedirect: false,
  		maxRedirects: 10
	};

	var request = https.request(options, function(response) {
		var body = '';
    	// Detect a redirect
    	if (response.statusCode > 300 && response.statusCode < 400 && response.headers.location) {
        // The location for some (most) redirects will only contain the path,  not the hostname;
        // detect this and add the host to the path.
	       	if (url.parse(response.headers.location).hostname) {
	       		h = url.parse(response.headers.location).hostname;
	       		p = url.parse(response.headers.location).path;
	       		getWeb(h,p, function(body){
					console.log(body);
					callback(body);
				});
	              // Hostname included; make request to response.headers.location
	        } else {
	        	p = response.headers.location;
	        	getWeb(Host,p, function(body){
					console.log(body);
					callback(body);
				});
	              // Hostname not included; get host from requested URL (url.parse()) and prepend to location. 
	        }
        
       }
       else{
			response.on("data", function(chunk){
				body += chunk.toString('utf8');
			});
			
			response.on("end", function(){
				callback(body);
			});
		}
	});
	request.end();
}


app.get("/github/:user", function(request, response){
	username = request.params.user;
	getRepos(username, function(repos){
		console.log(repos);
		console.log("aqfaridi has " + repos.length + " repos");
		response.json(repos);
	});
});


	


app.get("/hello", function(request, response){
	response.send("Hello!");
});

app.post("/fetch", function(request, response){
    addr = request.body.url;//"http://www.google.co.in";
	console.log(addr);
	getWeb(url.parse(addr).hostname,url.parse(addr).path, function(body){
		response.send(body);
	});
});


app.get("/", routes.index);
app.get("/browser", routes.browse);
app.get("/github", routes.git);

app.listen(port, host,function(){
	console.log("Listening on "+host+":"+port);
});
