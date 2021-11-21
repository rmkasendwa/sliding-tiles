import '@tsed/platform-express'; // /!\ keep this import
import '@tsed/ajv';

import { PlatformApplication } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import methodOverride from 'method-override';

import { config, rootDir } from './config';

@Configuration({
  ...config,
  acceptMimes: ['application/json'],
  httpPort: process.env.PORT || 8083,
  httpsPort: false, // CHANGE
  mount: {
    '/rest': [`${rootDir}/controllers/**/*.ts`],
  },
  views: {
    root: `${rootDir}/views`,
    extensions: {
      ejs: 'ejs',
    },
  },
  exclude: ['**/*.spec.ts'],
})
export class Server {
  @Inject()
  app: PlatformApplication;

  @Configuration()
  settings: Configuration;

  $beforeRoutesInit(): void {
    this.app
      .use(cors())
      .use(cookieParser())
      .use(compress({}))
      .use(methodOverride())
      .use(bodyParser.json())
      .use(
        bodyParser.urlencoded({
          extended: true,
        })
      );
  }
}
