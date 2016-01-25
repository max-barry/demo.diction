module.exports = {
    surge: {
        options: {
            project: "<%= package.paths.build %>",
            domain: "mxbry-diction.surge.sh"
        }
    },
    cacheBust: {
        options: {
            deleteOriginals: true
        },
        files: [{
            src: [
                "<%= package.paths.build %>**/*.html",
            ]
        }]
    }
};
