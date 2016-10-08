module.exports = function(grunt) {
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
            src: ['test/acceptance/*.js', 'test/unit/*.js']
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
                    'main.js',
                    '--debug',
                    'grunt'
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
    grunt.registerTask('default', ['run:concierge', 'watch:core']);
};
