/**
 * Provides helper functions for handling user and system modules.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var fs = require('fs'),
    path = require('path'),
    files = require.once('./../files.js'),
    config = require('./../config.js'),
    modulesDir = 'modules',
    descriptor = 'hubot.json',
    Robot = require.once('./hubot/robot.js'),
    coffeescriptLoaded = false;

var verifyModuleDescriptior = function (hj, disabled) {
    if (!hj.name || !hj.startup || !hj.version) {
        return false;
    }
    
    if (disabled === true && exports.disabledConfig 
        && exports.disabledConfig[hj.name] && exports.disabledConfig[hj.name] === true) {
        return false;
    }
    return true;
};

var generateHubotJson = function(folderPath, scriptLocation) {
    var indexOf = [].indexOf || function(item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item)
                    return i;
            }
            return -1;
        },
        hubotDocumentationSections = [
            'description',
            'dependencies',
            'configuration',
            'commands',
            'notes',
            'author',
            'authors',
            'examples',
            'tags',
            'urls'
        ],
        mod = path.join(folderPath, scriptLocation),
        body = fs.readFileSync(mod, 'utf-8'),
        scriptDocumentation = { name: path.basename(mod).replace(/\.(coffee|js)$/, '') },
        currentSection = null,
        ref = body.split("\n"),
        commands = [];
    
    for (var i = 0, len = ref.length; i < len; i++) {
        var line = ref[i];
        if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
            break;
        }
        var cleanedLine = line.replace(/^(#|\/\/)\s?/, "").trim();
        if (cleanedLine.length === 0 || cleanedLine.toLowerCase() === 'none') {
            continue;
        }
        
        var nextSection = cleanedLine.toLowerCase().replace(':', '');
        if (indexOf.call(hubotDocumentationSections, nextSection) >= 0) {
            currentSection = nextSection;
            scriptDocumentation[currentSection] = [];
        } else {
            if (currentSection) {
                scriptDocumentation[currentSection].push(cleanedLine.trim());
                if (currentSection === 'commands') {
                    commands.push(cleanedLine.trim());
                }
            }
        }
    }

    var help = [];
    for (var i = 0; i < scriptDocumentation.commands.length; i++) {
        var spl = scriptDocumentation.commands[i].match(/(?:[^-]|(?:--[^ ]))+/g);
        if (spl[0].startsWith('hubot ')) {
            spl[0] = '{{commandPrefix}}' + spl[0].substr(6);
        }
        for (var j = 0; j < spl.length; j++) {
            spl[j] = spl[j].trim();
        }
        if (spl.length === 1) {
            spl.push('Does what the command says.');
        }
        help.push(spl);
    }
    
    if (help.length === 0) {
        help.push([scriptDocumentation.name, 'Does something. The unhelpful author didn\'t specify what.']);
    }

    return {
        name: scriptDocumentation.name,
        startup: scriptLocation,
        version: 1.0,
        dependencies: scriptDocumentation.dependencies,
        configuration: scriptDocumentation.configuration,
        notes: scriptDocumentation.notes,
        authors: scriptDocumentation.authors || scriptDocumentation.author,
        examples: scriptDocumentation.examples,
        tags: scriptDocumentation.tags,
        urls: scriptDocumentation.urls,
        help: help
    };
};

exports.verifyModule = function (location, disabled) {
    var stat = fs.statSync(location);
    if (!stat.isDirectory()) {
        return;
    }
    
    var folderPath = path.resolve(location),
        p = path.join(folderPath, './' + descriptor);
    try {
        stat = fs.statSync(p);
    }
    catch (e) {
        stat = null;
    }

    var hj;
    if (stat == null) {
        var files = fs.readdirSync(folderPath);
        if (files.length !== 1) {
            return null;
        }

        hj = generateHubotJson(folderPath, files[0]);
        fs.writeFileSync(p, JSON.stringify(hj, null, 4), 'utf8');
    }
    else {
        hj = require.once(p);
    }

    if (!verifyModuleDescriptior(hj, disabled)) {
        return null;
    }
    
    if (!hj.folderPath) {
        hj.folderPath = folderPath;
    }
    return hj;
};

exports.listModules = function (disabled) {
    var data = files.filesInDirectory('./' + modulesDir),
        modules = {};
    
    for (var i = 0; i < data.length; i++) {
        try {
            var candidate = path.resolve(path.join(modulesDir, data[i])),
                output = exports.verifyModule(candidate, disabled);
            if (output) {
                modules[output.name] = output;
            }
            else {
                console.debug('Skipping "' + data[i] + '". It isn\'t a Hubot module.');
            }
        } catch (e) {
            console.debug('A failure occured while listing "' + data[i] + '". It doesn\'t appear to be a module.');
            console.critical(e);
            continue;
        }
    }
    return modules;
};

var createHelp = function (module) {
    return function (commandPrefix) {
        var h = [];
        for (var i = 0; i < module.help.length; i++) {
            var l = [];
            for (var j = 0; j < module.help[i].length; j++) {
                l.push(module.help[i][j].replace(/{{commandPrefix}}/g, commandPrefix));
            }
            h.push(l);
        }
        return h;
    };
};

exports.loadModule = function (module) {
    if (!coffeescriptLoaded && module.startup.endsWith('.coffee')) {
        require("coffee-script").register();
        coffeescriptLoaded = true;
    }
    
    try {
        var modulePath = module.folderPath,
            startPath = path.join(modulePath, module.startup),
            m = require.once(startPath);
        
        var cfg = config.loadModuleConfig(module, modulePath);
        return new Robot(m, module, cfg);
    }
    catch (e) {
        console.critical(e);
        throw 'Could not load module \'' + module.name + '\'. Does it have a syntax error?';
    }
};
