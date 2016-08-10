/**
* Translations service for Concierge.
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
    defaultLocale = 'en',
    currentLocale = global.__i18nLocale || defaultLocale,
    globalContext = '*',
    contextMap = {},

    _getCallerFileName = function (levels = 1) {
        const origPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        const err = new Error();
        const stack = err.stack;
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
    const translationFiles = files.filesInDirectory(translationsDir);
    for (let i = 0; i < translationFiles.length; i++) {
        const translationFile = path.join(translationsDir, translationFiles[i]);
        this.translations[translationFiles[i].substr(0, translationFiles[i].lastIndexOf('.'))] = require.once(translationFile);
    }
    this.hook = null;
};

TranslatorService.prototype.translate = function (strings, values) {
    if (this.hook) {
        const res = this.hook(strings, values);
        if (res) {
            return res;
        }
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
    console.debug(`Missing i18n value for key "${key}" in {current: "${currentLocale}", default:"${defaultLocale}"}.`);
    return _fallbackTranslate(strings, values);
};

TranslatorService.prototype.setHook = function(hookFunction) {
    this.hook = hookFunction;
};

contextMap[globalContext] = new TranslatorService('./core/translations/i18n/');

/**
 * Translates a given format string.
 * @param {Array<string>} strings input format string split at format values. These are
 * the sections outside of the `${x}` sections of the format string.
 * @param {Array<string>} values input format values. These are the values of strings
 * contained within `${x}` sections of the format string.
 * @returns {string} the translated string.
 */
module.exports = function(strings, ...values) {
    const contextFileName = _getCallerFileName(2);
    const contextMatches = contextFileName.match(/modules(\\|\/).*(?=\\|\/)/g);
    const context = !!contextMatches ? contextMatches[0].split(/\\|\//)[1] : globalContext;

    if (!contextMap.hasOwnProperty(context)) {
        const translationsDirectory = path.join(contextFileName.substr(0, contextFileName.indexOf(path.sep, global.__modulesPath.length + 1)), 'i18n/');
        contextMap[context] = new TranslatorService(translationsDirectory);
    }
    return contextMap[context].translate(strings, values);
};

/**
 * Translates a given format string with context.
 * @param {Array<string>} strings input format string split at format values. These are
 * the sections outside of the `${x}` sections of the format string.
 * @param {Array<string>} values input format values. These are the values of strings
 * contained within `${x}` sections of the format string.
 * @param {string} the context in which to translate.
 * @returns {string} the translated string.
 */
module.exports.translate = function(strings, values, context) {
    if (!contextMap.hasOwnProperty(context)) {
        const translationsDirectory = path.join(global.__modulesPath, context, 'i18n/');
        contextMap[context] = new TranslatorService(translationsDirectory);
    }
    return contextMap[context].translate(strings, values);
};

/**
 * Provides a means to override the translation.
 * @param {function()} func a function that will receive a tagged template literal.
 * @param {string} context the translation context. Either the module name or global context identifier.
 * This parameter is optional, if not provided will default to the current context.
 * @returns {undefined} does not currently return a value.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals
 */
module.exports.hook = function(func, context = null) {
    if (!context) {
        const contextFileName = _getCallerFileName(2);
        const contextMatches = contextFileName.match(/modules(\\|\/).*(?=\\|\/)/g);
        context = !!contextMatches ? contextMatches[0].split(/\\|\//)[1] : globalContext;
    }

    if (!contextMap.hasOwnProperty(context)) {
        throw new Error($$`Invalid translation context provided.`);
    }

    contextMap[context].setHook(func);
};

/**
 * Sets the current locale of the system.
 * @param {string} localeString the string to set the locale to. E.g. 'en' for english.
 * @returns {undefined} does not currently return a value.
 */
module.exports.setLocale = function (localeString) {
    if (localeString) {
        currentLocale = localeString;
    }
};

/**
 * Removes a translation context if that context exists.
 * Has no limitations, so has the ability to remove the global context as well...
 * @param {string} context the translation context. Either the module name or global context identifier.
 * @returns {undefined} does not currently return a value.
 */
module.exports.removeContextIfExists = function(context) {
    if (contextMap.hasOwnProperty(context)) {
        delete contextMap[context];
    }
};
