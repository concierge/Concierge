/**
* Translations service for Kassy.
*
* Written By:
*        Matthew Knox
*
* License:
*        MIT License. All code unless otherwise specified is
*        Copyright (c) Matthew Knox and Contributors 2015.
*/

var path = require('path'),
    files = require.once('./../files.js'),
    currentLocale = null,
    defaultLocale = 'en',
    globalContext = '*',
    contextMap = {},

    _getCallerFileName = function (levels = 1) {
        var origPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        }
        var err = new Error(),
            stack = err.stack;
        Error.prepareStackTrace = origPrepareStackTrace;
        return stack[levels].getFileName();
    },

    _translate = function(values, translationString) {
        return translationString.replace(/\${(\d+)}/g, function (match, number) {
            return !!values[number] ? values[number] : match;
        });
    },

    _fallbackTranslate = function(strings, values) {
        var result = '';
        for (var i = 0, j = 0; i + j < strings.length + values.length;) {
            if (i % 2 === j % 2) {
                result += strings[i];
                i++;
            } else {
                result += values[j];
                j++;
            }
        }
        return result;
    };

var TranslatorService = function (translationsDir) {
    this.translations = {};
    translationsDir = path.resolve(translationsDir);
    console.log(translationsDir);
    var translationFiles = files.filesInDirectory(translationsDir);
    for (var i = 0; i < translationFiles.length; i++) {
        var translationFile = path.join(translationsDir, translationFiles[i]);
        this.translations[translationFiles[i].substr(0, translationFiles[i].lastIndexOf('.'))] = require.once(translationFile);
    }
    this.hook = null;
};

TranslatorService.prototype.translate = function (strings, values) {
    if (this.hook) {
        return this.hook(strings, values);
    }

    var key = strings[0];
    var i = 1;
    for (; i < strings.length; i++) {
        key += '${' + (i - 1) + '}' + strings[i];
    }
    if (strings % values === 0) {
        key += '${' + i + '}';
    }

    if (this.translations.hasOwnProperty(currentLocale) && this.translations[currentLocale].hasOwnProperty(key)) {
        return _translate(values, this.translations[currentLocale][key]);
    }
    else if (this.translations.hasOwnProperty(defaultLocale) && this.translations[defaultLocale].hasOwnProperty(key)) {
        return _translate(values, this.translations[defaultLocale][key]);
    }
    return _fallbackTranslate(strings, values);
};

TranslatorService.prototype.setHook = function(hookFunction) {
    this.hook = hookFunction;
};

contextMap[globalContext] = new TranslatorService('./core/translations/i18n/');

module.exports = function(strings, ...values) {
    var contextFileName = _getCallerFileName(2),
        contextMatches = contextFileName.match(/modules(\\|\/).*(?=\\|\/)/g),
        context = !!contextMatches ? contextMatches[0].split(/\\|\//)[1] : globalContext;

    if (!contextMap.hasOwnProperty(context)) {
        var translationsDirectory = path.join(context.substr(0, contextFileName.indexOf(contextMatches[0]) + contextMatches[0].length), 'i18n/');
        contextMap[context] = new TranslatorService(translationsDirectory);
    }
    return contextMap[context].translate(strings, values);
};

module.exports.hook = function(func, context = null) {
    if (!context) {
        var contextFileName = _getCallerFileName(2),
            contextMatches = contextFileName.match(/modules(\\|\/).*(?=\\|\/)/g);
        context = !!contextMatches ? contextMatches[0].split(/\\|\//)[1] : globalContext;
    }
    
    if (!contextMap.hasOwnProperty(context)) {
        throw new Error('Invalid translation context provided.');
    }

    contextMap[context].setHook(func);
};

module.exports.setLocale = function(localeString) {
    currentLocale = localeString;
};