"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerConfig = void 0;
const common_1 = require("@tsed/common");
const env_1 = require("../env");
if (env_1.isProduction) {
    common_1.$log.appenders.set('stdout', {
        type: 'stdout',
        levels: ['info', 'debug'],
        layout: {
            type: 'json',
        },
    });
    common_1.$log.appenders.set('stderr', {
        levels: ['trace', 'fatal', 'error', 'warn'],
        type: 'stderr',
        layout: {
            type: 'json',
        },
    });
}
exports.loggerConfig = {
    disableRoutesSummary: env_1.isProduction,
};
