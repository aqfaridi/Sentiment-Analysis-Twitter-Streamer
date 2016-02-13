/* 
 * NaiveBayesClassifier
 * NaiveBayesClassifier is a Multinomial Naive-Bayes Classifier that uses Laplace Smoothing.
 * Reference : http://nlp.stanford.edu/IR-book/html/htmledition/naive-bayes-text-classification-1.html
 * @author: Abdul Qadir Faridi (aqfaridi@gmail.com)
*/

/*
 * Given an input string, tokenize it into an array of word tokens.
 */
var tokenizer = function(text) {
	//remove punctuation from text & lowercase 
	var punctuation_regex = new RegExp(/[^\w\s]/g);
	var removed_punc_text = text.replace(punctuation_regex,' ').toLowerCase();

	return removed_punc_text.split(/\s+/);//split on multiple spaces
};

/* vocabulary and its size : hashmap holding all words of training set */
voc = {};
voc_size = 0;

/* Classes(hashmap) - positive,negative,neutral in case of tweets */
classes = {};

// Prior Probability : P(Cj) = Ncj / N

/*
	* Document frequency table : hash for each class cj storing Ncj
	* For each class, how many documents are mapped to it.
*/

doc_freq_cnt = {}; //Nc : number of docs belonging to c class : docCount(class)
total_docs = 0;  //N => total number of documents of training set

// LIKELIHOOD: P(t|c) = Tct / SUM[(for t' in voc) Tct']
word_freq_cnt = {}; //Tct :  Word frequency table in class
word_cnt = {}; //SUM[(for t' in voc) Tct'] : Word count table in Total

// Add a word to vocabulary and size.

var addWord_to_voc = function(word){
	if (!voc[word]){
		voc[word] = true;
		voc_size += 1;
	}
};

/*
 * Retrieve a class name.
 * If it does not exist, then initialize the necessary data structures for a new class
*/

var create_clas = function(clas) {

	if (!classes[clas]){
		//initialize
		doc_freq_cnt[clas] = 0;
		word_freq_cnt[clas] = {};
		word_cnt[clas] = 0;
		//add new class to list
		classes[clas] = true; //hashmap
	}

	return classes[clas]  ? clas : undefined; //return name of class
};

/*
 * Build a frequency hashmap where keys are `tokens`
 * and the values are frequency `token` in document.
*/
var freq_table = function(tokens){
	var freq_table = {};

	tokens.forEach(function (token){
		if (!freq_table[token]) 
			freq_table[token] = 1;
		else
			freq_table[token] += 1;
	});

	return freq_table;
};


// Train our naive-bayes classifier by telling it what `CLASS` some `TEXT` belongs to.
 
exports.train = function(text, clas) {

	clas = create_clas(clas); //get or create a category

	doc_freq_cnt[clas] += 1; //Nc , P(clas) : Nc/N update count of how many documents mapped to this class
	total_docs += 1; //N: update total number of documents of training set

	var tokens = tokenizer(text); //split text into tokens
	var token_freq_table = freq_table(tokens); //freq count for each token in the text or document

	Object.keys(token_freq_table).forEach(function(token) { //unique keys(since hashmap) for each token in token_freq_table
		
		addWord_to_voc(token); //add word to vocabulary

		var temp = token_freq_table[token]; //store in temp

		//update the frequency information for this word in this class
		if (!word_freq_cnt[clas][token])
			word_freq_cnt[clas][token] = temp; //set token first time appear in any document
		else
			word_freq_cnt[clas][token] += temp; //add to the count of next document of training set

		console.log('token: %s | class: `%s` | freq: %d',token,clas,word_freq_cnt[clas][token]);
		word_cnt[clas] += temp; //add to the count of all words mapped to this class
	});

};

// Calculate probability that a `token` belongs to a `class`

var cond_prob = function(token, clas) {
	// Recall => P(t|c) = Tct / SUM[(for t' in voc) Tct']

	//how many times this word has occurred in documents mapped to this class
	var Tct = word_freq_cnt[clas][token] || 0; //Tct

	//what is the count of all words that have ever been mapped to this class
	var Tct_dash = word_cnt[clas]; //SUM[(for t' in voc) Tct']

	//use laplace Add-1 Smoothing equation
	//=> ( P(t/c) = Tct + 1 ) / ( SUM[(for t' in voc) Tct'] + |VocabSize| )
	return (Tct + 1)/(Tct_dash + voc_size);
};

/**
 * Determine the class some `text` most likely belongs to.
 * Use Laplace (add-1) smoothing to adjust for words that do not appear in our vocabulary (i.e. unknown words).
 *
 * @param text - Raw text that needs to be tokenized and categorised or classified.
 * @return
 * category - Category of “maximum a posteriori” (i.e. most likely category), or 'unclassified'
 * probability - The probablity for the category MAP specified
 * categories - Hashmap of probabilities for each class
 */
exports.test = function (text) {
	max_prob = -Infinity;
	total_prob = 0;
	class_MAP = {}; //class of “maximum a posteriori” => most likely class
	class_probs = {}; //probabilities of all classes

	var tokens = tokenizer(text);
	var token_freq_table = freq_table(tokens);

	Object.keys(classes).forEach(function(clas) { //for each class, find the probability of the text belonging to it
		if (!classes[clas]) { return; } //ignore classes that have been neglected

		// 1. Find overall probability of this class
		//=> Prior P(Cj) = Nc/N

		//Put of all documents in training set, how many were mapped to this class
		var class_prob = doc_freq_cnt[clas] / total_docs;

		//take the log to avoid floating point underflow with large datasets - http://nlp.stanford.edu/IR-book/html/htmledition/naive-bayes-text-classification-1.html
		var log_class_prob = Math.log(class_prob); //start with P(Cj), we will add P(t|c) incrementally below

		// 2. Find probability of each word in this class
		// Recall => P(t|c) = Tct / SUM[(for t' in voc) Tct']
	
		Object.keys(token_freq_table).forEach(function(token) { //for each token in our token frequency table
			//determine the log of the probability of this token belonging to the current class
			//=> log( P(t|c) )
			var token_prob = cond_prob(token, clas);
			//and add it to our running probability that the text belongs to the current class
			log_class_prob += Math.log(token_prob) * token_freq_table[token];
			console.log('token: %s | class: `%s` | probability: %d', token, clas, token_prob);
		});

		// 3. Find the most likely class, thus far...

		class_prob = Math.exp(log_class_prob); //reverse the log and get an actual value
		total_prob += class_prob; //calculate totals as we go, we'll use this to normalize later

		if (log_class_prob > max_prob) { //find cMAP
			max_prob = log_class_prob;
			class_MAP = {
				category: clas,
				probability: class_prob
			};
		}

		class_probs[clas] = class_prob;
	});

	//normalise (out of 1) the probabilities, so that they are easier to relate to
	Object.keys(class_probs).forEach(function(clas){
		class_probs[clas] /= total_prob;
	});

	return {
		category: class_MAP.category || 'unclassified',
		probability: (class_MAP.probability /= total_prob) || -Infinity,
		categories: class_probs
	};
};