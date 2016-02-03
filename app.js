var express = require("express");
var fs = require("fs");

var app = express();

app.set('view engine','ejs'); // use embeddedjs
var routes = require('./routes'); // require routes folder to modularize routes  

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

app.get("/hello", function(request, response){
	response.send("Hello!");
});

app.get("/", routes.index);

app.listen(port, host,function(){
	console.log("Listening on "+host+":"+port);
});
