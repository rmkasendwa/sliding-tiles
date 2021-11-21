"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.config = void 0;
exports.config = require('dotenv').config();
exports.isProduction = process.env.NODE_ENV === 'production';
