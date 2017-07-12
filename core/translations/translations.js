/**
* Translations service for Concierge.
*
* Written By:
*        Matthew Knox
*
* License:
*        MIT License. All code unless otherwise specified is
*        Copyright (c) Matthew Knox and Contributors 2016.
*/

const EventEmitter = require('events'),
    path = require('path'),
    files = require('concierge/files'),
    defaultLocale = 'en',
    globalContext = '*',
    contextMap = {};

let currentLocale = global.__i18nLocale || defaultLocale;

class TranslatorService extends EventEmitter {
    constructor () {
        super();
        this.hook = null;
        this.translations = {};
    }

    async init (translationsDir) {
        translationsDir = path.resolve(translationsDir);
        const translationFiles = await files.filesInDirectory(translationsDir);
        return await Promise.all(translationFiles.map(async(translationFile) => {
            translationFile = path.join(translationsDir, translationFile);
            LOG.silly(`Loading translations file at "${translationFile}".`);
            const data = await files.readJson(translationFile);
            return this.translations[path.parse(translationFile).name] = data;
        }));
    }

    _fallbackTranslate(strings, values) {
        let result = '';
        for (let i = 0, j = 0; i + j < strings.length + values.length;) {
            if (i % 2 === j % 2) {
                result += strings[i];
                i++;
            } else {
                result += values[j];
                j++;
            }
        }
        return result;
    }

    _translate(values, translationString) {
        return translationString.replace(/\${(\d+)}/g, (match, number) => {
            return !!values[number] ? values[number] : match;
        });
    }

    translate(strings, values) {
        if (this.hook) {
            const res = this.hook(strings, values);
            if (res) {
                return res;
            }
        }

        let key = strings[0],
            i = 1,
            result;
        for (; i < strings.length; i++) {
            key += '${' + (i - 1) + '}' + strings[i];
        }
        if (strings % values === 0) {
            key += '${' + i + '}';
        }

        if (this.translations.hasOwnProperty(currentLocale) && this.translations[currentLocale].hasOwnProperty(key)) {
            result = this._translate(values, this.translations[currentLocale][key]);
        }
        else if (this.translations.hasOwnProperty(defaultLocale) && this.translations[defaultLocale].hasOwnProperty(key)) {
            result = this._translate(values, this.translations[defaultLocale][key]);
        }
        else {
            console.debug(`Missing i18n value for key "${key}" in {current: "${currentLocale}", default:"${defaultLocale}"}.`);
            result = this._fallbackTranslate(strings, values);
        }
        this.emit('translate', strings, values, result);
        return result;
    }

    setHook(hookFunction) {
        this.hook = hookFunction;
    }
}

/**
 * Translates a given format string.
 * @param {Array<string>} strings input format string split at format values. These are
 * the sections outside of the `${x}` sections of the format string.
 * @param {Array<string>} values input format values. These are the values of strings
 * contained within `${x}` sections of the format string.
 * @returns {string} the translated string.
 */
module.exports = (strings, ...values) => {
    const context = global.getBlame(1, 3) || globalContext;
    return module.exports.translate(strings, values, context);
};

/**
 * Translates a given format string with context.
 * @param {Array<string>} strings input format string split at format values. These are
 * the sections outside of the `${x}` sections of the format string.
 * @param {Array<string>} values input format values. These are the values of strings
 * contained within `${x}` sections of the format string.
 * @param {string} context the context in which to translate.
 * @returns {string} the translated string.
 */
module.exports.translate = (strings, values, context) => {
    if (!contextMap.hasOwnProperty(context)) {
        LOG.error(`!CONTEXT: '${context}'`);
        context = globalContext;
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
module.exports.hook = (func, context = null) => {
    if (!context) {
        context = global.getBlame(1, 3) || globalContext;
    }

    if (!contextMap.hasOwnProperty(context)) {
        throw new Error(global.$$`Invalid translation context provided.`);
    }

    contextMap[context].setHook(func);
};

/**
 * Sets the current locale of the system.
 * @param {string} localeString the string to set the locale to. E.g. 'en' for English.
 * @returns {undefined} does not currently return a value.
 */
module.exports.setLocale = (localeString) => {
    if (localeString) {
        currentLocale = localeString;
    }
};

/**
 * Gets the current locale of the system.
 * @returns {string} returns locale string. E.g. 'en' for English.
 */
module.exports.getLocale = () => currentLocale;

/**
 * Creates a new translation context for a module directory.
 * @param {string} directory the directory that contains the module for which the translation context
 * should be created.
 * @returns {undefined} does not currently return a value.
 */
module.exports.createContext = async(directory) => {
    const context = path.basename(directory);
    if (contextMap.hasOwnProperty(context)) {
        return;
    }
    contextMap[context] = new TranslatorService();
    return await contextMap[context].init(path.join(directory, 'i18n/'));
};

/**
 * Removes a translation context if that context exists.
 * Has no limitations, so has the ability to remove the global context as well...
 * @param {string} context the translation context. Either the module name or global context identifier.
 * @returns {undefined} does not currently return a value.
 */
module.exports.removeContext = context => {
    if (contextMap.hasOwnProperty(context)) {
        LOG.silly(`Removing translation context "${context}".`);
        delete contextMap[context];
    }
};

contextMap[globalContext] = new TranslatorService();
module.exports.init = contextMap[globalContext].init(global.rootPathJoin('core/translations/i18n/'));
