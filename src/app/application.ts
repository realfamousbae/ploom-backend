import express from 'express';
import multer from 'multer';

import type { Express, Request, Response, } from 'express';
import type { Multer, StorageEngine } from 'multer';

import { authorizeUser } from '../api/v1/authorize-user.ts';
import { generateFromMultipleImages } from '../api/v1/generate-from-multiple.ts';
import { generateFromSingleImage } from '../api/v1/generate-from-single.ts';
import { getProfile } from '../api/v1/profile.ts';
import { registerNewUser } from '../api/v1/register-new-user.ts';
import { type Config } from '../config.ts';
import { ApiDatabase } from '../models/database.ts';
import { getImageStorage } from '../models/images.ts';
import { handleMiddlewareErrors, isLoggingEnabled, logIncomingRequest } from '../types/errors.ts';
import { apiPaths, checkPort } from '../types/types.ts';

export class Application {
  private readonly app: Express;
  private readonly config: Config;
  private readonly db: ApiDatabase;
  private readonly imageStorage: StorageEngine;
  private readonly port: number;
  private readonly upload: Multer;

  /**
   * @deprecated
   * 
   * Made only for debug builds when api is runnig at localhost.
   */
  private getServerUri(): string {
    return `http://localhost:${this.port}/`;
  }

  private handleRoot(_request: Request, response: Response): void {
    response.json({ 
      message: 'Use POST-method on next api paths.',
      paths: apiPaths
    });
  }

  public constructor(config: Config) {
    this.app = express();

    this.config = config;
    this.db = new ApiDatabase(this.config); 
    this.imageStorage = getImageStorage();
    this.port = checkPort(this.config.server.port);
    this.upload = multer({ storage: this.imageStorage });

    this.db.checkTables();

    // Log each incoming request (method + path + client IP).
    // This helps to visibly trace incoming traffic during development.
    if (isLoggingEnabled()) {
      this.app.use(logIncomingRequest);
    }

    // Middleware for handling errors thrown by `Multer` during file uploading.
    this.app.use(handleMiddlewareErrors);
  }

  public startListening(): void {
    // Root route with GET-request:
    this.app.get('/', this.handleRoot);
    // Methods with POST-request:
    this.app.post(
      '/api/v1/authorize-user',
      (request: Request, response: Response) => {
        authorizeUser(request, response, this.db);
      }
    );
    this.app.post(
      '/api/v1/generate-from-multiple', 
      this.upload.array('images', 5), 
      (request: Request, response: Response) => {
        console.log(`[POST /api/v1/generate-from-multiple] Files count:`, request.files?.length);
        generateFromMultipleImages(request, response, this.db);
      }
    );
    this.app.post(
      '/api/v1/generate-from-single', 
      this.upload.single('image'), 
      (request: Request, response: Response) => {
        console.log(`[POST /api/v1/generate-from-single] File:`, request.file?.filename);
        generateFromSingleImage(request, response, this.db);
      }
    );
    this.app.post(
      '/api/v1/register-new-user',
      this.upload.single('profile_image'),
      (request: Request, response: Response) => {
        registerNewUser(request, response, this.db);
      }
    );
    // Profile route (GET)
    this.app.get(
      '/api/v1/profile',
      (request: Request, response: Response) => {
        getProfile(request, response, this.db);
      }
    );

    this.app.listen(this.port, () => console.log(`Server started on ${this.getServerUri()}.`));
  }
}
