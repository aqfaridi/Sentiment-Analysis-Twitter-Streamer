var crypto = require('crypto'),
	sha1 = require('./sha1'),
    URL = require('url');

var encodeData = exports.encodeData = function(toEncode){
 if( toEncode == null || toEncode == "" ) return ""
 else {
    var result= encodeURIComponent(toEncode);
    // Fix the mismatch between OAuth's  RFC3986's and Javascript's beliefs in what is right and wrong ;)
    return result.replace(/\!/g, "%21")
                 .replace(/\'/g, "%27")
                 .replace(/\(/g, "%28")
                 .replace(/\)/g, "%29")
                 .replace(/\*/g, "%2A");
 }
}

var decodeData = function(toDecode) {
  if( toDecode != null ) {
    toDecode = toDecode.replace(/\+/g, " ");
  }
  return decodeURIComponent( toDecode);
}


// Takes an object literal that represents the arguments, and returns an array
// of argument/value pairs.
var makeArrayOfArgumentsHash= function(argumentsHash) {
  var argument_pairs= [];
  for(var key in argumentsHash ) {
    if (argumentsHash.hasOwnProperty(key)) {
       var value= argumentsHash[key];
       if( Array.isArray(value) ) {
         for(var i=0;i<value.length;i++) {
           argument_pairs[argument_pairs.length]= [key, value[i]];
         }
       }
       else {
         argument_pairs[argument_pairs.length]= [key, value];
       }
    }
  }
  return argument_pairs;
}

// Sorts the encoded key value pairs by encoded name, then encoded value
var sortRequestParams= function(argument_pairs) {
  // Sort by name, then value.
  argument_pairs.sort(function(a,b) {
      if ( a[0]== b[0] )  {
        return a[1] < b[1] ? -1 : 1;
      }
      else return a[0] < b[0] ? -1 : 1;
  });

  return argument_pairs;
}

exports.normaliseRequestParams= function(args) {
  var argument_pairs= makeArrayOfArgumentsHash(args);
  // First encode them #3.4.1.3.2 .1
  for(var i=0;i<argument_pairs.length;i++) {
    argument_pairs[i][0]= encodeData( argument_pairs[i][0] );
    argument_pairs[i][1]= encodeData( argument_pairs[i][1] );
  }

  // Then sort them #3.4.1.3.2 .2
  argument_pairs= sortRequestParams( argument_pairs );

  // Then concatenate together #3.4.1.3.2 .3 & .4
  var args= "";
  for(var i=0;i<argument_pairs.length;i++) {
      args+= argument_pairs[i][0];
      args+= "="
      args+= argument_pairs[i][1];
      if( i < argument_pairs.length-1 ) args+= "&";
  }
  return args; //return parameters string
}

exports.getTimestamp = function() {
  return Math.floor( (new Date()).getTime() / 1000 );
}

NONCE_CHARS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
              'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
              'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
              'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
              '4','5','6','7','8','9'];

exports.getNonce = function(nonceSize) {
   var result = [];
   var chars = NONCE_CHARS;
   var char_pos;
   var nonce_chars_length= chars.length;

   for (var i = 0; i < nonceSize; i++) {
       char_pos= Math.floor(Math.random() * nonce_chars_length);
       result[i]=  chars[char_pos];
   }
   return result.join('');
}

var normalizeUrl = function(url) {
  var parsedUrl= URL.parse(url, true)
   var port ="";
   if( parsedUrl.port ) {
     if( (parsedUrl.protocol == "http:" && parsedUrl.port != "80" ) ||
         (parsedUrl.protocol == "https:" && parsedUrl.port != "443") ) {
           port= ":" + parsedUrl.port;
         }
   }

  if( !parsedUrl.pathname  || parsedUrl.pathname == "" ) parsedUrl.pathname ="/";

  return parsedUrl.protocol + "//" + parsedUrl.hostname + port + parsedUrl.pathname;
}

var createSignatureBase = function(method, url, parameters) {
  url= encodeData(normalizeUrl(url) );
  parameters= encodeData( parameters );
  return method.toUpperCase() + "&" + url + "&" + parameters;
}

var createSignature = function(signatureBase,signatureMethod,consumerSecret,tokenSecret) {
   if( tokenSecret === undefined ) var tokenSecret= "";
   else tokenSecret= encodeData( tokenSecret );
   // consumerSecret is already encoded
   var key= encodeData(consumerSecret) + "&" + tokenSecret;

   var hash= ""
   if( signatureMethod == "PLAINTEXT") {
     hash= key;
   }

   else if (signatureMethod == "RSA-SHA1") {
     key = privateKey || "";
     hash= crypto.createSign("RSA-SHA1").update(signatureBase).sign(key, 'base64');
   }
   else {

       if( crypto.Hmac ) {
       	 console.log(key);
         hash = crypto.createHmac("sha1", key).update(signatureBase).digest("base64");
       }
       else {
         hash= sha1.HMACSHA1(key, signatureBase);
       }
   }
   return hash;
}

exports.getSignature = function(method, url, parameters,consumerSecret,tokenSecret,signatureMethod) {
  var signatureBase = createSignatureBase(method, url, parameters);
  console.log(signatureBase);
  return createSignature( signatureBase,signatureMethod,consumerSecret,tokenSecret);
}
