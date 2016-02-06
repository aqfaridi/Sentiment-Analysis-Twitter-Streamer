exports.index = function(request, response){
	response.render("index",{title:"Twitter Streamer"}); // rendering index.ejs template
}

exports.browse = function(request, response){
	response.render("browse",{title:"Browser"}); // rendering browse.ejs template
}

exports.git = function(request, response){
	response.render("github",{title:"Github"}); // rendering browse.ejs template
}
