var express = require("express");
var fs = require("fs");
var https = require("https");
var http = require("http");
var url = require("url");
var bodyParser = require('body-parser');
var routes = require('./routes'); // require routes folder to modularize routes  
var auth = require('./auth');

var app = express();

app.set('view engine','ejs'); // use embeddedjs
app.use(express.static(__dirname+'/public'));//use static files
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



var config = JSON.parse(fs.readFileSync("config.json"));
var host = config.host;
var port = config.port;


var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var db_url = 'mongodb://localhost:27017/twitter';

var insertDocument = function(db,entry,callback) {
   db.collection('tweet').insertOne(entry, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the tweet collection.");
    callback(result);
  });
};

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

var server = require('http').Server(app);
var io = require('socket.io').listen(server);

server.listen(port, host,function(){
	console.log("Listening on "+host+":"+port);
});


function getTwitStr(word) {
MongoClient.connect(db_url, function(err, db) {
  assert.equal(null, err);
  console.log("we are connected!" + url);

	
	// OAuth1.0 - 3-legged server side flow (Twitter example) 
	CONSUMER_KEY = 'xdVYtzjINoIB6x8y1ePuGrTVk';
	CONSUMER_SECRET = 'yxPXV3TMSHPiVA0Q8EmLGdfTcYZWewqzo5Csmh9eCL3gnvqL5p';
	TOKEN = '328140155-6lnDwykZDykTPY6hxZtTMswbYAQ35ywotYQ7kAZV';
	TOKEN_SECRET = 'aQwPtQ4gIikHwDF1cinoYMOijAvvOHCAV5CyEKgMTqzRq';

	method = "POST";
	Url = 'https://stream.twitter.com/1.1/statuses/filter.json';
	parameters = "track=twitter";

	oauth_consumer_key = CONSUMER_KEY;
	oauth_nonce = auth.getNonce(32);
	oauth_signature_method = "HMAC-SHA1";
	oauth_timestamp = auth.getTimestamp();
	oauth_token = TOKEN;
	oauth_version = "1.0";

	var oauthParameters = {
      "oauth_timestamp":        oauth_timestamp,
      "oauth_nonce":            oauth_nonce,
      "oauth_version":          oauth_version,
      "oauth_signature_method": oauth_signature_method,
      "oauth_consumer_key":     oauth_consumer_key,
      "oauth_token":            oauth_token,
      "track":                  word
	};



	oauth_signature = auth.getSignature(method, Url, auth.normaliseRequestParams(oauthParameters), CONSUMER_SECRET,TOKEN_SECRET,oauth_signature_method);

	authparams = 'OAuth '+auth.encodeData("oauth_consumer_key")+'=\"'+auth.encodeData(oauth_consumer_key)+'\", '
	                     +auth.encodeData("oauth_nonce")+'=\"'+auth.encodeData(oauth_nonce)+'\", '
	                     +auth.encodeData("oauth_signature")+'=\"'+auth.encodeData(oauth_signature)+'\", '
	                     +auth.encodeData("oauth_signature_method")+'=\"'+auth.encodeData(oauth_signature_method)+'\", '
	                     +auth.encodeData("oauth_timestamp")+'=\"'+auth.encodeData(oauth_timestamp)+'\", '
	                     +auth.encodeData("oauth_token")+'=\"'+auth.encodeData(oauth_token)+'\", '
	                     +auth.encodeData("oauth_version")+'=\"'+auth.encodeData(oauth_version)+'\"';
	
	var options = {
		host: 'stream.twitter.com',
		path: '/1.1/statuses/filter.json?track='+word,
		method: 'POST',
		headers: {
			"User-Agent" : "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:37.0) Gecko/20100101 Firefox/37.0",
			"Authorization" : authparams
		}
	};

	var request = https.request(options, function(response) {
		body = "";
		response.on("data", function(chunk){
            body += chunk.toString('utf8');

            var index, json;

    		while((index = body.indexOf('\r\n')) > -1) {
                json = body.slice(0, index);
                console.log(json);
                body = body.slice(index + 2);
                if(json.length > 0) {
                    try {
                    	var twt = JSON.parse(json);
                    	/*
						var tweet = {
							"user" : {"screen_name": twt.user.screen_name},
							"text": txt.text
						};
						*/
						console.log(twt);
                        io.sockets.emit('tweet', twt);
                        insertDocument(db,twt,function() {
						    //db.close();
						});
                       
                    } catch(e) {
                        io.sockets.emit('error', e);
                    }
                }
            }



		});



		response.on("end", function(){
			console.log("Disconnected");
		});
	});
	request.end();
}); //MongoClient Connect

}


app.get("/:key", function(request, response){
	keyword = request.params.key;
	getTwitStr(keyword);
});