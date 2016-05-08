module.exports = function(grunt) {
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      mochacli: {
          options: {
              require: ['chai'],
              files: 'test/'
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
              files: ['test/'],
              tasks: ['mochacli:nyan']
          },
          core: {
              files: ['core/'],
              tasks: ['mochacli:nyan']
          },
          all: {
              files: ['core/', 'test/'],
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
                  'grunt'
              ]
          }
      }
  });
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-run');

  grunt.registerTask('watch', ['run:kassy', 'watch:all']);
  grunt.registerTask('wcore', ['run:kassy', 'watch:core']);
  grunt.registerTask('wtest', ['run:kassy', 'watch:test']);
  grunt.registerTask('test', ['run:kassy', 'mochacli:spec']);
  grunt.registerTask('nyan', ['run:kassy', 'mochacli:nyan']);
  grunt.registerTask('default', ['run:kassy', 'watch:core']);
};
