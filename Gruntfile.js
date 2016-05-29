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
            kassy: {
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

    grunt.registerTask('wall', ['run:kassy', 'watch:all']);
    grunt.registerTask('wcore', ['run:kassy', 'watch:core']);
    grunt.registerTask('wtest', ['run:kassy', 'watch:test']);
    grunt.registerTask('test', ['run:kassy', 'mochacli:spec']);
    grunt.registerTask('nyan', ['run:kassy', 'mochacli:nyan']);
    grunt.registerTask('default', ['run:kassy', 'watch:core']);
};
