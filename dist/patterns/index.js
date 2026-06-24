"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPatterns = void 0;
exports.getPatternsByCategory = getPatternsByCategory;
exports.getEnabledPatterns = getEnabledPatterns;
const pii_js_1 = require("./pii.js");
const credentials_js_1 = require("./credentials.js");
const infrastructure_js_1 = require("./infrastructure.js");
exports.allPatterns = [
    ...pii_js_1.piiPatterns,
    ...credentials_js_1.credentialPatterns,
    ...infrastructure_js_1.infrastructurePatterns,
];
function getPatternsByCategory(category) {
    return exports.allPatterns.filter(p => p.category === category);
}
function getEnabledPatterns(categories) {
    return exports.allPatterns.filter(p => categories.includes(p.category));
}
