"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloWorldController = void 0;
const tslib_1 = require("tslib");
const di_1 = require("@tsed/di");
const schema_1 = require("@tsed/schema");
let HelloWorldController = class HelloWorldController {
    get() {
        return 'hello';
    }
};
(0, tslib_1.__decorate)([
    (0, schema_1.Get)('/'),
    (0, tslib_1.__metadata)("design:type", Function),
    (0, tslib_1.__metadata)("design:paramtypes", []),
    (0, tslib_1.__metadata)("design:returntype", void 0)
], HelloWorldController.prototype, "get", null);
HelloWorldController = (0, tslib_1.__decorate)([
    (0, di_1.Controller)('/hello-world')
], HelloWorldController);
exports.HelloWorldController = HelloWorldController;
