/**
Some general pan-site functions
*/

/**
I'm using HREFs on buttons, so attach listeners to change window.location
*/
var buttons = document.querySelectorAll('button[href]');
var gotoExternalUrl = function(evt) {
    window.location = evt.target.getAttribute("href");
};

for (var i = buttons.length - 1; i >= 0; i--) {
    buttons[i].addEventListener("click", gotoExternalUrl);
}
