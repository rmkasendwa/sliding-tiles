"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const tslib_1 = require("tslib");
require("@tsed/platform-express"); // /!\ keep this import
require("@tsed/ajv");
const common_1 = require("@tsed/common");
const di_1 = require("@tsed/di");
const body_parser_1 = (0, tslib_1.__importDefault)(require("body-parser"));
const compression_1 = (0, tslib_1.__importDefault)(require("compression"));
const cookie_parser_1 = (0, tslib_1.__importDefault)(require("cookie-parser"));
const cors_1 = (0, tslib_1.__importDefault)(require("cors"));
const method_override_1 = (0, tslib_1.__importDefault)(require("method-override"));
const config_1 = require("./config");
let Server = class Server {
    app;
    settings;
    $beforeRoutesInit() {
        this.app
            .use((0, cors_1.default)())
            .use((0, cookie_parser_1.default)())
            .use((0, compression_1.default)({}))
            .use((0, method_override_1.default)())
            .use(body_parser_1.default.json())
            .use(body_parser_1.default.urlencoded({
            extended: true,
        }));
    }
};
(0, tslib_1.__decorate)([
    (0, di_1.Inject)(),
    (0, tslib_1.__metadata)("design:type", common_1.PlatformApplication)
], Server.prototype, "app", void 0);
(0, tslib_1.__decorate)([
    (0, di_1.Configuration)(),
    (0, tslib_1.__metadata)("design:type", Object)
], Server.prototype, "settings", void 0);
Server = (0, tslib_1.__decorate)([
    (0, di_1.Configuration)({
        ...config_1.config,
        acceptMimes: ['application/json'],
        httpPort: process.env.PORT || 8083,
        httpsPort: false,
        mount: {
            '/rest': [`${config_1.rootDir}/controllers/**/*.ts`],
        },
        views: {
            root: `${config_1.rootDir}/views`,
            extensions: {
                ejs: 'ejs',
            },
        },
        exclude: ['**/*.spec.ts'],
    })
], Server);
exports.Server = Server;
