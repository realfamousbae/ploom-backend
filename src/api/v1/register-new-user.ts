/**
 * @module src/api/v1/register-new-user
 * 
 * @description This module defines the `registerNewUser` function, which handles 
 * the registration of new users in the system. It processes incoming HTTP requests, 
 * validates user data, interacts with the database to store user information, and 
 * returns appropriate responses based on the success or failure of the registration 
 * process.
 */

import type { Request, Response } from 'express';

import { resolve } from 'path';

import { ApiDatabase } from '../../models/database.ts';
import { MissingPropertyError } from '../../types/errors.ts';
import { Code, getTypedParamsAs } from '../../types/types.ts';
import { getLogger } from '../../utils/logger.ts';

import type { User } from '../../models/database.ts';

const logger = getLogger('register');

/**
 * Registers a new user in the system.
 * 
 * This function handles the registration of a new user by extracting the necessary information 
 * from the incoming HTTP request, validating the data, and storing the user information in the 
 * database. It also checks for the existence of a user with the same email to prevent 
 * duplicate registrations. If the registration is successful, it returns a JSON response with 
 * a success message and a token (user ID). If there are any errors during the process, it 
 * returns an appropriate error message and status code.
 * 
 * @param request - The incoming HTTP request containing user registration data.
 * @param response - The HTTP response object used to send the registration result back to the client.
 * @param db - An instance of the `ApiDatabase` class used to interact with the database for storing 
 * user information.
 * 
 * @returns A JSON response indicating the result of the user registration attempt.
 */
export function registerNewUser(request: Request, response: Response, db: ApiDatabase): any {
  logger.info('register attempt', {
    query: request.query,
    hasProfileImage: Boolean(request.file),
    profileImageName: request.file?.originalname,
    profileImageSize: request.file?.size,
  });

  try {
    let user = getTypedParamsAs<User>(
      request.query,
      'name',
      'surname',
      'email',
      'password'
    );

    // FIXME: And what will be if file is not exists?
    // May be later new api path will be provided for
    // uploading only profile photo.
    //
    // Upd: Fixed, but still need to think about it.
    if (request.file) {
      user.profile_image_path = resolve(request.file.path);
      logger.debug('attached profile image', { path: user.profile_image_path });
    }

    if (db.isUserExists({ email: user.email })) {
      logger.warn('register conflict: email already exists', { email: user.email });
      return response.status(Code.Conflict).json({ message: 'User with provided email already exists.' });
    }

    db.insertUser(user);
    const dbOption = db.selectUser({ email: user.email });

    logger.info('register success', { userId: dbOption.user_id, email: user.email });
    return response.status(Code.OK)
      .json({
        message: 'User successfully registered.',
        token: dbOption.user_id
      });
  } catch (error) {
    if (error instanceof MissingPropertyError) {
      logger.warn('register bad request', { message: error.message });
      return response.status(Code.BadRequest).json({ message: error.message });
    }

    logger.error('register internal error', { error });
    return response.status(Code.InternalServerError).json({ message: 'Internal server error.' });
  }
}
