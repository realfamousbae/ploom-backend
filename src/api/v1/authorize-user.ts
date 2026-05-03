/**
 * @module src/api/v1/authorize-user
 * 
 * @description This module defines the `authorizeUser` function, which is responsible for handling 
 * user authorization requests. It checks the provided email and password against the 
 * database and returns an appropriate response based on the result.
 * 
 * The function uses the `ApiDatabase` class to interact with the database and the 
 * `isLoggingEnabled` function to determine if logging is enabled for incoming requests.
 * It also handles potential errors, such as missing properties in the request, and returns 
 * appropriate HTTP status codes and messages in the response.
 */

import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { isLoggingEnabled, MissingPropertyError } from '../../types/errors.ts';
import { Code, getTypedParamsAs } from '../../types/types.ts';

import type { User } from '../../models/database.ts';

/**
 * Authorizes a user based on their email and password.
 * 
 * This function handles the POST request to the `/api/v1/authorize-user` endpoint. 
 * It checks if the provided email and password match an existing user in the database. 
 * If the credentials are correct, it returns a success message along with a token 
 * (user ID) and user information (excluding the password). If the credentials are 
 * incorrect or if the user does not exist, it returns an appropriate error message.
 * 
 * @param request - The incoming HTTP request containing user credentials.
 * @param response - The HTTP response object used to send the authorization result back to the client.
 * @param db - An instance of the `ApiDatabase` class used to interact with the database for user verification.
 * 
 * @returns A JSON response indicating the result of the authorization attempt, including a token if successful, 
 * or an error message if not.
 */
export function authorizeUser(request: Request, response: Response, db: ApiDatabase): any {
  if (isLoggingEnabled()) {
    console.log(`[POST /api/v1/authorize-user] Request body:`, request.body);
  }

  try {
    const userData = getTypedParamsAs<User>(request.query, 'email', 'password');

    if (db.isUserExists({ email: userData.email })) {
      const dbOption = db.selectUser({ email: userData.email });

      const dataIsCorrect =
        dbOption.email === userData.email
        &&
        dbOption.password === userData.password;

      if (dataIsCorrect) {
        const { password, ...userWithoutPassword } = dbOption;
        return response.status(Code.OK).json({
          message: 'User successfully authorized. All data is correct.',
          token: dbOption.user_id,
          user: userWithoutPassword
        });
      } else {
        return response.status(Code.Unauthorized).json({ message: 'Authorization failed. Email or password is incorrect.' });
      }
    }

    return response.status(Code.NotFound).json({ message: 'User with provided email does not exist.' });
  } catch (error) {
    if (error instanceof MissingPropertyError) {
      return response.status(Code.BadRequest).json({ message: error.message });
    }

    console.error(`[POST /api/v1/authorize-user] Internal error:`, error);
    return response.status(Code.InternalServerError).json({ message: 'Internal server error.' });
  }
}
