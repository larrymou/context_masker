"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextMasker = createContextMasker;
const masker_js_1 = require("./masker.js");
const restorer_js_1 = require("./restorer.js");
const store_js_1 = require("./session/store.js");
function createContextMasker(config) {
    const store = new store_js_1.SessionStore(config?.sessionTTL ?? 300000);
    const masker = new masker_js_1.Masker(config);
    const restorer = new restorer_js_1.Restorer(store);
    return {
        mask: (text) => {
            const result = masker.mask(text);
            // Sync mappings to shared store
            for (const [placeholder, original] of result.mappings) {
                store.set(placeholder, original);
            }
            return result;
        },
        restore: (text) => restorer.restore(text),
        clear: () => {
            masker.clear();
            store.clear();
        },
    };
}
