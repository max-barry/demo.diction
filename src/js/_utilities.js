var $ = require("jquery");

module.exports.changeState = function(newState) {
    $("main")
        .removeClass (function (index, css) {
            return (css.match (/(^|\s)state-\S+/g) || []).join(' ');
        })
        .addClass("state-" + newState);
};
