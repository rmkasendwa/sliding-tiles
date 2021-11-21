"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.rootDir = void 0;
const path_1 = require("path");
const logger_1 = require("./logger");
const { version } = require('../../package.json');
exports.rootDir = (0, path_1.join)(__dirname, '..');
exports.config = {
    version,
    rootDir: exports.rootDir,
    logger: logger_1.loggerConfig,
    // additional shared configuration
};
