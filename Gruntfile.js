module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochacli: {
            options: {
                require: ['chai'],
                files: ['test/acceptance/*.js', 'test/unit/*.js']
            },
            spec: {
                options: {
                    reporter: 'spec',
                    colors: true,
                    growl: true,
                    recursive: true,
                    dely: true
                }
            },
            nyan: {
                options: {
                    reporter: 'nyan',
                    colors: true,
                    growl: true,
                    recursive: true,
                    dely: true
                }
            }
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
    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-run');

    grunt.registerTask('wall', ['run:concierge', 'watch:all']);
    grunt.registerTask('wcore', ['run:concierge', 'watch:core']);
    grunt.registerTask('wtest', ['run:concierge', 'watch:test']);
    grunt.registerTask('test', ['run:concierge', 'mochacli:spec']);
    grunt.registerTask('nyan', ['run:concierge', 'mochacli:nyan']);
    grunt.registerTask('default', ['run:concierge', 'watch:core']);
};
