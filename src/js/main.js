/**
Vendors
*/
var $ = require("jquery"),
    difflib = require('difflib'),
    _utils = require("./_utilities.js"),
    _levels = require("./_levels.js").allLevels,
    Firebase = require("firebase");

/**
Application variables
*/
var $start = $(".level__start"),
    $retry = $(".retry"),
    original, count, counter,
    $target = $(".results__capture"),
    $forceStop = $(".recognise__stop"),
    LEVEL, SCORE;

/**
Speech recognition protocols
webkit required for Chrome
*/
var SpeechRecognition;

try {
    SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
} catch (err) {
    /**
    Catch devices that do not support the SpeechRecognition API
    Redirect them back to the homepage.
    */
    alert("Your device does not support SpeechRecognition");
    window.location = "/";
}

/**
Create recognition engine and configure
*/
var recognition = new SpeechRecognition();
// recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

/**
Application functions
*/
var init = function() {
    /**
    Establish intitial state of the application
    by loading the level
    */
    LEVEL = location.search.split("level=")[1] || 1;

    // Access this level's config
    var thisLevel = _levels[LEVEL];

    // Render to page the loaded attributes
    $(".recognise__text").text(thisLevel.source);
    $(".level__title").text(thisLevel.title);

    // Set the source string to be matched against
    original = thisLevel.source
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .toLowerCase();

    // Set level styling
    $("main").addClass("--level-" + LEVEL);

};

var startCountdown = function() {
    /**
    Initiate countdown
    */
    // Alter application state to state-countdown
    _utils.changeState("countdown");

    // After the 3 second countdown (done in CSS animation),
    // trigger speech recognition
    setTimeout(beginRecognition, 4000);
};

var beginRecognition = function() {
    /**
    Request permissions and then listen for speech
    */
    // Alter application state to state-recognise
    _utils.changeState("recognise");

    // setInterval to increment actual time
    count = 0;
    counter = setInterval(function(){
        count++;
    }, 10);

    // Trigger speech recognition
    recognition.start();
    // processSpeech();
};

var processSpeech = function(event) {
    /**
    Perform a text comparison
    */
    // Grab transcript from recognised speech
    var transcript = event.results[0][0].transcript;

    // Stop the timer
    clearInterval(counter);

    // Flush the recognition object
    recognition.abort();

    // Perform a diff comparison of the transcript to the source text
    var match = new difflib.SequenceMatcher(null, original, transcript);
    var accuracy = match.ratio();
    // var accuracy = 0.97231352345;

    // Enter results phase
    postRecognition(accuracy, count, transcript);

};

var postRecognition = function(accuracy, count, transcript) {
    /**
    Clean up after a successful recognition.
    Show the results page etc.
    */
    _utils.changeState("results");

    // Add the score to the results table
    var percentage = (Math.round(accuracy*10000) / 100) + "%";
    $(".results__accuracy_target").html(percentage);

    // Add the time to the results table
    var time = (count / 100) + "s";
    $(".results__time_target").html(time);

    // Calculate and render score
    // Score is 100000 (to give a nice round number) over count, reduced by cube of accuracy rating (0 - 1)
    SCORE = null;
    SCORE = (1000000 / count) * Math.pow(accuracy, 3);
    SCORE = Math.round(SCORE*100) / 100;
    $(".results__score_target").html(SCORE);

 
    // Write the transcript back to the DOM
    $target.text(transcript);
};

var recognitionError = function(err) {
    /**
    Something has gone horribly wrong
    */
    _utils.changeState("error");
    
    // Stop and reset the counter
    clearInterval(counter);

    // Log the error
    console.log(err.error || "No error given");
    $(".error__err").html(err.error || "Undetermined. Unable to capture audio");
};

var stopRecognition = function() {
    /**
    Force stop recognition
    */
    recognition.stop();
};

/**
Event listeners
*/
$start.on("click", startCountdown);
$retry.on("click", beginRecognition);
$forceStop.on("click", stopRecognition);

// All recognition listen handlers
recognition.onresult = processSpeech;
recognition.onnomatch = recognitionError;
recognition.onerror = recognitionError;

// Load initial state
init();

/**
Leaderboard
*/
// Leaderboard variables
var $leaderboards = $(".leaderboard__list"),
    maxItems = 5,
    scEl, sc,
    initialBuild = true;

// Create DB ref
var scores = new Firebase("https://diction-dev.firebaseio.com/scores/" + LEVEL);

var buildLeaderboards = function(snapshot) {
    var allRecords = [];

    // Annoyingly you can't reverse order of records on firebase. You have to do it manually
    // First stash them in an array...
    snapshot.forEach(function(score){
        allRecords.push(score);
    });

    // ... then reverse that array and build <li> for each record
    allRecords.reverse().forEach(function(score){
        sc = score.val();
        scEl = "<li data-score='" + sc.score + "'>" + sc.initial + "</li>";
        $leaderboards.append(scEl);
    });

};

var generateUID = function() {
    /**
    UID generator
    New records in Firebase are stored against this ID
    */
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

var addToLeaderboard = function() {
    /**
    Called when a user reaches the result page
    and selects "Add to Leaderboard"
    */

    // Pop an alert to get the user's name
    var username = prompt("Enter a 3 letter initial for the leaderboard", "ME!");
    // Grab the first 3 characters
    username = username.toUpperCase().slice(0, 3);

    // Gen a UID for the score and send it to Firebase
    scores.child(generateUID()).set({
        initial: username,
        score: SCORE,
    });

    // Refresh the page. It's too painful to update leaderboards live
    window.location = window.location;
};

$(".results__add").on("click", addToLeaderboard);
scores.orderByChild("score").on("value", buildLeaderboards);
