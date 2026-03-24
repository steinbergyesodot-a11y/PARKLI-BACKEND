"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseWrapper = responseWrapper;
function responseWrapper(success, data = null, error = null) {
    return { success, data, error };
}
