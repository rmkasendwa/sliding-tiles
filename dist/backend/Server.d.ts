import '@tsed/platform-express';
import '@tsed/ajv';
import { PlatformApplication } from '@tsed/common';
import { Configuration } from '@tsed/di';
export declare class Server {
    app: PlatformApplication;
    settings: Configuration;
    $beforeRoutesInit(): void;
}
