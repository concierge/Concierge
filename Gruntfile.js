'use strict';

const startConciergeTask = done => {
    // allow use of already running Concierge instance
    if (global.currentPlatform) {
        return done();
    }
    process.env.CLONE_TRY_UPSTREAM = '1';
    const concierge = require('./main.js');
    const promise = concierge({
        modules: './modules',
        locale: 'en',
        debug: 'silly',
        timestamp: false,
        loopback: false
    });
    promise.then(platform => {
        platform.removeAllListeners('shutdown');
        platform.once('started', done);
    });
};

module.exports = grunt => {
    grunt.option('stack', true);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            options: {
                require: ['chai'],
                reporter: 'spec',
                colors: true,
                growl: true,
                recursive: true,
                dely: true
            },
            src: ['test/acceptance/*.js', 'test/unit/**/*.js', 'modules/**/test/acceptance/*.js', 'modules/**/test/unit/**/*.js', '!modules/test/**/*.js']
        },
        watch: {
            test: {
                files: ['test/**/*.js'],
                tasks: ['mochacli:nyan']
            },
            core: {
                files: ['core/**/*.js', 'core/**/*.coffee'],
                tasks: ['mochacli:nyan']
            },
            all: {
                files: ['core/**/*.js', 'core/**/*.coffee', 'test/**/*.js', 'modules/**/*.js'],
                tasks: ['mochacli:spec']
            }
        }
    });
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('init', function() {
        const done = this.async();
        startConciergeTask(() => {
            global.c_require = p => require(require('path').join(__dirname, p));
            global.MockApi = require('./test/helpers/MockApi.js');
            done();
        });
    });

    grunt.registerTask('wall', ['init', 'watch:all']);
    grunt.registerTask('wcore', ['init', 'watch:core']);
    grunt.registerTask('wtest', ['init', 'watch:test']);
    grunt.registerTask('test', ['init', 'mochaTest']);
    grunt.registerTask('default', ['init', 'mochaTest']);
};
