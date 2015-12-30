/**
 * Logger class.
 * Contains actual log methods and logic for writers/formatters/levels managing
 */

import {shallowCopyObject} from './utils';

const REQUIRED_OPTIONS = ['levels', 'writers', 'formatters', 'methods'];

export default class Logger {
    /**
     * @param {String} [prefix]
     * @param {Object} options
     * @param {Object} options.levels
     * @param {Object} options.writers
     * @param {Object} options.formatters
     * @param {Array<String>} options.methods
     */
    constructor (prefix, options) {
        assertOptions(options);
        this._clones = [];
        this._prefix = prefix;
        this._opt = options;
        this._createMethods(this._opt.methods);
    }

    /**
     * Crates new logger with options of current logger.
     * New logger behaves like the old one.
     * Options are synchronised in direction parent->clone.
     * @param {String} [prefix]
     * @returns {Logger}
     */
    clone (prefix) {
        var clone = new Logger(prefix, shallowCopyObject(this._opt));
        this._clones.push(clone);
        return clone;
    }

    /**
     * For every writer formats aruments by corresponding formatter (if it's exist)
     * and calls 'write' method.
     * @param {String} method
     * @param {Array<*>} args
     */
    message (method, ...args) {
        this._forEachWriter((name, writer, formatter, levels) => {
            if (isMethodAllowed(method, levels)) {
                var formattedArgs = formatter
                        ? formatter.format(method, this._prefix, args)
                        : args;
                writer.write(method, this._prefix, formattedArgs);
            }
        });
    }

    /**
     * Sets log levels for specified writer (by name)
     * @param {String} name
     * @param {Array<String>} levels
     */
    setLevels (name, levels) {
        this._opt.levels[name] = levels;
        this._updateClones('setLevels', [name, levels]);
    }

    /**
     * Adds writer to logger
     * @param {String} name
     * @param {Writer} writer
     */
    addWriter (name, writer) {
        this._opt.writers[name] = writer;
        this._updateClones('addWriter', [name, writer]);
    }

    /**
     * Removes writer by name
     * @param {Object} name
     */
    removeWriter (name) {
        if (this._opt.writers[name]) {
            delete this._opt.writers[name];
        }
        this._updateClones('removeWriter', [name]);
    }

    /**
     * Adds formatter for specified writer (by name)
     * @param {String} name
     * @param {Writer} formatter
     */
    addFormatter (name, formatter) {
        this._opt.formatters[name] = formatter;
        this._updateClones('addFormatter', [name, formatter]);
    }

    /**
     * Removes formatter by name
     * @param {Object} name
     */
    removeFormatter (name) {
        if (this._opt.formatters[name]) {
            delete this._opt.formatters[name];
        }
        this._updateClones('removeFormatter', [name]);
    }

    /**
     * @param {Array<String>} methods
     */
    _createMethods (methods) {
        methods.forEach(method => {
            this[method] = this.message.bind(this, method);
        });
    }

    /**
     * @param {String} method
     */
    _forEachWriter (method) {
        Object.keys(this._opt.writers).forEach(name => {
            method(
                name,
                this._opt.writers[name],
                this._opt.formatters[name],
                this._opt.levels[name]
            );
        });
    }

    /**
     * Calls passed method for all cloned loggers
     * @param {} method
     * @param {} args
     */
    _updateClones (method, args) {
        this._clones.forEach(clone => {
            clone[method](...args);
        });
    }
}

/**
 * @param {String} method
 * @param {Array<String>} levels
 * @returns {Boolean}
 */
function isMethodAllowed(method, levels) {
    if (Array.isArray(levels)) {
        return levels.indexOf(method) !== -1;
    }
    return true;
}

/**
 * @param {Object} [options]
 * @throws {Error}
 */
function assertOptions(options) {
    if (!options) {
        throw new Error('You must specify "options" parameter for Logger');
    }
    REQUIRED_OPTIONS.forEach(optionName => {
        if (!options[optionName]) {
            throw new Error(
                'You must specify "options.' + optionName + '" parameter for Logger'
            );
        }
    });
}
