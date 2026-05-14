/**
 * @module src/app/application
 * 
 * @description This module defines the `Application` class, which encapsulates the setup and 
 * configuration of the Express server for the Ploom backend application.
 * 
 * The `Application` class is responsible for initializing the Express app, configuring middleware, 
 * defining API routes, and starting the server to listen for incoming requests.
 */

import express from 'express';
import multer from 'multer';

import type { Express, Request, Response, } from 'express';
import type { Multer, StorageEngine } from 'multer';

import { mkdirSync } from 'fs';
import { dirname } from 'path';

import { authorizeUser } from '../api/v1/authorize-user.ts';
import { generateFromMultipleImages } from '../api/v1/generate-from-multiple.ts';
import { generateFromSingleImage } from '../api/v1/generate-from-single.ts';
import { getProfile } from '../api/v1/profile.ts';
import { registerNewUser } from '../api/v1/register-new-user.ts';
import { type Config } from '../config.ts';
import { ApiDatabase } from '../models/database.ts';
import { getImageStorage } from '../models/images.ts';
import { handleMiddlewareErrors, logIncomingRequest } from '../types/errors.ts';
import { apiPaths, checkPort } from '../types/types.ts';
import { currentLogLevel, getLogger } from '../utils/logger.ts';

const appLogger = getLogger('application');

/**
 * The `Application` class encapsulates the Express application setup, 
 * including route definitions, middleware configuration, and server initialization. 
 * It manages the application's configuration, database connection, image storage setup,
 * and request handling logic.
 * 
 * The class ensures that necessary runtime directories exist, sets up the database, 
 * and defines API endpoints for user authorization, image generation, profile retrieval, 
 * and user registration. It also includes logging of incoming requests and error handling middleware.
 * 
 * To start the server, create an instance of the `Application` class with the appropriate 
 * configuration and call the `startListening` method.
 */
export class Application {
  /**
   * The Express application instance that handles routing and middleware.
   * The configuration object containing server, database, API, and path settings.
   * The database instance for managing user and generation data.
   */
  private readonly app: Express;
  /**
   * The Multer storage engine configured for handling image uploads, which determines where and 
   * how images are stored based on the request path.
   * 
   * The port number on which the server will listen for incoming requests.
   * The Multer instance used for handling multipart/form-data, particularly for image uploads.
   */
  private readonly config: Config;
  /**
   * The `ApiDatabase` instance that provides methods for interacting with the database, 
   * such as checking tables, selecting and inserting users, and managing generations. 
   * It is initialized with the application's configuration.
   */
  private readonly db: ApiDatabase;
  /**
   * The storage engine for handling image uploads.
   */
  private readonly imageStorage: StorageEngine;
  /**
   * The port number on which the server will listen for incoming requests.
   */
  private readonly port: number;
  /**
   * The Multer instance used for handling multipart/form-data, particularly for image uploads.
   */
  private readonly upload: Multer;

  /**
   * Ensures that the necessary runtime directories for the database file, profile images, 
   * uploaded images, and generated images exist. If any of these directories do not exist, 
   * they are created using `mkdirSync` with the `recursive` option set to `true`. 
   * 
   * This method is called during the initialization of the `Application` class to guarantee that 
   * the required directory structure is in place before the server starts handling requests.
   * 
   * **This method is crucial for preventing runtime errors related to missing directories when the application
   * attempts to read from or write to the filesystem for database operations or image handling.** 
   * 
   * @param config - The configuration object containing paths for the database file and image storage directories.
   * 
   * @throws Will throw an error if there is an issue creating the directories, such as insufficient permissions.
   */
  private static ensureRuntimeDirectories(config: Config): void {
    const directories = [
      dirname(config.database.file),
      config.paths.profileImages,
      config.paths.uploadedImages,
      config.paths.generatedImages,
    ];

    for (const dir of directories) {
      mkdirSync(dir, { recursive: true });
      appLogger.debug('ensured runtime directory', { dir });
    }
    appLogger.info('runtime directories ready', { count: directories.length });
  }

  /**
   * Handles the root route, returning a JSON response with available API paths.
   * This method serves as a simple informational endpoint that guides users to the available API routes. 
   * It is registered as a GET handler for the root path ('/') in the `startListening` method.
   * 
   * @param _request - The incoming request object (not used in this handler).
   * @param response - The response object used to send the JSON response back to the client.
   */
  private handleRoot(_request: Request, response: Response): void {
    appLogger.debug('serving root info endpoint');
    response.json({
      message: 'Use POST-method on next api paths.',
      paths: apiPaths
    });
  }

  /**
   * Initializes a new instance of the `Application` class.
   * This constructor sets up the Express application, initializes the database connection, 
   * configures image storage, and prepares the server to listen on the specified port. 
   * It also ensures that necessary runtime directories exist and configures middleware for 
   * logging and error handling.
   * 
   * **This constructor is essential for setting up the application's core components and ensuring 
   * that the environment is ready for handling incoming requests.**  
   * 
   * @param config - The configuration object containing paths for the database file and image 
   * storage directories.
   * 
   * @throws Will throw an error if there is an issue initializing the database, setting up image storage,
   * or if the specified port is invalid. It may also throw errors related to filesystem operations when ensuring 
   * runtime directories exist.
   */
  public constructor(config: Config) {
    appLogger.info('initializing application', {
      logLevel: currentLogLevel,
      hostname: config.server.hostname,
      port: config.server.port,
      dataDir: config.paths.dataDir,
    });

    this.app = express();

    this.config = config;
    Application.ensureRuntimeDirectories(this.config);

    this.db = new ApiDatabase(this.config);
    this.imageStorage = getImageStorage(this.config);
    this.port = checkPort(this.config.server.port);
    this.upload = multer({ storage: this.imageStorage });

    this.db.checkTables();

    this.app.use(logIncomingRequest);
    this.app.use(handleMiddlewareErrors);

    appLogger.info('application initialized');
  }

  /**
   * Starts the Express server and begins listening for incoming requests on the configured port and hostname. 
   * This method defines the API routes and their corresponding handlers, which include user authorization, 
   * image generation from single or multiple images, user registration, and profile retrieval.
   */
  public startListening(): void {
    this.app.get('/', this.handleRoot);
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
        generateFromMultipleImages(request, response, this.db);
      }
    );
    this.app.post(
      '/api/v1/generate-from-single',
      this.upload.single('image'),
      (request: Request, response: Response) => {
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
    this.app.get(
      '/api/v1/profile',
      (request: Request, response: Response) => {
        getProfile(request, response, this.db);
      }
    );

    appLogger.info('registered routes', { paths: apiPaths });

    const hostname = this.config.server.hostname;
    this.app.listen(this.port, hostname, () => {
      appLogger.info('server listening', {
        url: `http://${hostname}:${this.port}/`,
      });
    });
  }
}
