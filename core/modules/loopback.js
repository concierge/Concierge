/**
 * A special API wrapper for allowing loopback/pipe events to occur.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

class LoopbackApi {
    constructor(platform, baseApi, loopMaxDepth, pipeEvents) {
        this._platform = platform;
        this._baseApi = baseApi;
        this._copyApiMethods();
        this._loopMaxDepth = loopMaxDepth;
        this._pipeEvents = pipeEvents;
    }

    /**
     * Gets the loopback API/event for a received message.
     * @param {Platform} platform the platform that will be the basis of this loopback.
     * @param {IntegrationApi} api the api to use when sending messages.
     * @param {Object} event the event object.
     * @returns {Object} an object representing the api and event that should be used
     */
    static getLoopbackApi(platform, api, event) {
        if (api instanceof LoopbackApi) {
            return {
                api: api,
                event: event
            };
        }
        const currConfig = platform.config.getSystemConfig('loopback');
        const pipeEvents = [];
        if (currConfig.pipe !== false && event.body.contains('|')) {
            const newBodies = event.body.split(/\s*\|\s*/g);
            for (let n of newBodies) {
                const e = shim.createEvent(event.thread_id, event.sender_id, event.sender_name, n);
                e.event_source = event.event_source;
                pipeEvents.push(e);
            }
        }
        const loopDepth = currConfig.enabled ? currConfig.maxDepth || platform.loopDepth || 0 : 0;
        return {
            api: pipeEvents.length > 1 || loopDepth > 0 ? new LoopbackApi(platform, api, loopDepth, pipeEvents.slice(1)) : api,
            event: pipeEvents[0] || event
        };
    }

    _getClassKeys(obj) {
        const ret = new Set();
        const methods = obj => {
            if (obj !== Object.prototype) {
                const ps = Object.getOwnPropertyNames(obj);
                for (let p of ps) {
                    ret.add(p);
                }
                methods(Object.getPrototypeOf(obj));
            }
        };
        methods(obj.__proto__);
        return Array.from(ret);
    }

    _copyApiMethods() {
        for (let key of this._getClassKeys(this._baseApi).concat(Object.keys(this._baseApi))) {
            if (!this[key]) {
                this[key] = typeof (this._baseApi[key]) === 'function' ?
                    this._baseApi[key].bind(this._baseApi) :
                    this._baseApi[key];
            }
        }
    }

    _loopback(message, thread) {
        if (this._pipeEvents.length === 0 && this._loopMaxDepth <= 0) {
            return;
        }
        process.nextTick(() => {
            let api;
            const event = shim.createEvent(thread, this._pipeEvents[0].sender_id, this._pipeEvents[0].sender_name, message);
            if (this._pipeEvents.length > 0) {
                api = new LoopbackApi(this._platform, this._baseApi, this._loopMaxDepth, this._pipeEvents.slice(1));
                event.event_source = this._pipeEvents[0].event_source;
                event.body = `${this._pipeEvents[0].body} ${event.body}`;
                event.arguments = this._pipeEvents[0].arguments.concat(event.arguments);
                event.arguments_body = event.body.substr(event.arguments[0].length + 1);
            }
            else {
                api = new LoopbackApi(this._platform, this._baseApi, this._loopMaxDepth - 1, []);
                event.event_source = 'loopback';
            }
            platform.onMessage(api, event);
        });
    }

    sendMessage(message, thread) {
        this._loopback(message, thread);
        if (this._pipeEvents.length === 0) {
            return this._baseApi.sendMessage(message, thread);
        }
    }

    sendUrl(url, thread) {
        this._loopback(url, thread);
        if (this._pipeEvents.length === 0) {
            return this._baseApi.sendUrl(url, thread);
        }
    }

    buildLoopback(api, event) {
        return LoopbackApi.getLoopbackApi(api, event);
    }
}

module.exports = LoopbackApi;
