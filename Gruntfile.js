'use strict';

const path = require('path');
const fs = require('fs');

require('babel-register')(JSON.parse(fs.readFileSync('./.babelrc', 'ascii')));
require('babel-polyfill');

global.c_require = p => require(path.join(__dirname, p));
const Middleware = global.c_require('core/common/middleware.js');
global.currentPlatform = new Middleware();

const checkDirExists = dir => {
    try {
        const stats = fs.lstatSync(dir);
        if (!stats.isDirectory()) {
            throw new Error();
        }
        return true;
    }
    catch (e) {
        return false;
    }
};

module.exports = function (grunt) {

    // install the grunt integration if it does not exist
    if (!checkDirExists('./modules/grunt')) {
        const git = c_require('core/common/git.js');
        git.clone('https://github.com/concierge/grunt.git', './modules/grunt', err => {
            if (err) {
                throw new Error('Could not install required testing code.');
            }
        });
    }

    //  need redwrap for reddit tests
    if (!checkDirExists('./node_modules/redwrap')) {
        const npm = c_require('core/common/npm.js');
        npm.install('redwrap', __dirname);
    }

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
            src: ['test/acceptance/*.js', 'test/unit/**/*.js']
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
                files: ['core/**/*.js', 'core/**/*.coffee', 'test/**/*.js'],
                tasks: ['mochacli:spec']
            }
        },
        run: {
            options: {
                wait: false,
                ready: /.*System has started\. Hello World!.*/ig
            },
            concierge: {
                cmd: 'node',
                args: [
                    '--use_strict',
                    '--harmony',
                    'main.js',
                    'grunt',
                    '--debug',
                    'silly'
                ]
            }
        }
    });
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-run');

    grunt.registerTask('wall', ['run:concierge', 'watch:all']);
    grunt.registerTask('wcore', ['run:concierge', 'watch:core']);
    grunt.registerTask('wtest', ['run:concierge', 'watch:test']);
    grunt.registerTask('test', ['run:concierge', 'mochaTest']);
    grunt.registerTask('default', ['run:concierge', 'mochaTest']);
};
