/* 
 * AFINNClassifier
 * Reference : http://www2.imm.dtu.dk/pubdb/views/publication_details.php?id=6010
 * @author: Abdul Qadir Faridi (aqfaridi@gmail.com)

  AFINN is a list of English words rated for valence with an integer
  between minus five (negative) and plus five (positive). The words have
  been manually labeled by Finn Årup Nielsen in 2009-2011. The file
  is tab-separated. There are two versions:

  AFINN-111: Newest version with 2477 words and phrases.

  AFINN-96: 1468 unique words and phrases on 1480 lines. Note that there
  are 1480 lines, as some words are listed twice. The word list in not
  entirely in alphabetic ordering.

  An evaluation of the word list is available in:

  Finn Årup Nielsen
  "A new ANEW: Evaluation of a word list for sentiment analysis in microblogs",
  Proceedings of the ESWC2011 Workshop on 'Making Sense of Microposts':
  Big things come in small packages 718 in CEUR Workshop Proceedings : 93-98. 2011 May.
  http://arxiv.org/abs/1103.2903

*/

var afinn = require('./public/data/afinn.json');


// Calculates the negative sentiment of text

function negativity(text){
  var minus = function(word, af_score){
    score -= af_score;
    words.push(word);
  };
    
  var punctuation_removed = text.replace(/[^a-zA-Z ]+/g, ' ').replace('/ {2,}/',' ');
  var tokens = punctuation_removed.toLowerCase().split(" ");
  var score = 0,words  = [];

  tokens.forEach(function(token) {
    if (afinn.hasOwnProperty(token)) {
      if (afinn[token] < 0){
        minus(token, afinn[token]);
      }
    }
  });

  return {
    score       : score,
    comparative : score / tokens.length,
    words       : words
  };
}

// Calculates the negative sentiment of text

function positivity(text){
  var plus = function(word, af_score){
    score += af_score;
    words.push(word);
  };
    
  var punctuation_removed = text.replace(/[^a-zA-Z ]+/g, ' ').replace('/ {2,}/',' ');
  var tokens = punctuation_removed.toLowerCase().split(" ");
  var score = 0,words  = [];

  tokens.forEach(function(token) {
    if (afinn.hasOwnProperty(token)) {
      if (afinn[token] > 0){
        plus(token, afinn[token]);
      }
    }
  });

  return {
    score       : score,
    comparative : score / tokens.length,
    words       : words
  };
}

// Calculates overall sentiment

exports.analyze = function(text) {

  var POS = positivity(text);
  var NEG = negativity(text);

  return {
    score       : POS.score - NEG.score,
    comparative : POS.comparative - NEG.comparative,
    positive    : POS,
    negative    : NEG
  };
}
