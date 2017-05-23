'use strict';

module.exports = grunt => {
    const Concierge = require('./main.js'),
        fs = require('fs'),
        path = require('path');

    const moduleDirEmpty = () => {
        try {
            return fs.readdirSync('./modules').length <= 0;
        }
        catch (e) {
            return true;
        }
    };

    global.grunt$$ = (strings, ...values) => strings.map((v, i) => [v, values[i]]).reduce((a, b) => a.concat(b));
    global.c_require = p => require(path.join(__dirname, p));
    global.MockApi = require('./test/helpers/MockApi.js');

    const platform = Concierge({
        modules: './modules',
        firstRunInitialisation: moduleDirEmpty(),
        locale: 'en',
        debug: 'silly',
        timestamp: false,
        loopback: false
    });
    platform.removeAllListeners('shutdown');

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

    grunt.registerTask('wall', ['watch:all']);
    grunt.registerTask('wcore', ['watch:core']);
    grunt.registerTask('wtest', ['watch:test']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('default', ['mochaTest']);
};
