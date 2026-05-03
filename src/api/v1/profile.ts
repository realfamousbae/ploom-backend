/**
 * @module src/api/v1/profile
 * 
 * @description This module defines the API endpoint for retrieving a user's profile 
 * information based on their authentication token. It includes the `getProfile` function, 
 * which handles the logic for validating the token, querying the database for the user's 
 * information, and returning the appropriate response to the client. The function ensures 
 * that sensitive information such as the user's password is not included in the response. 
 * 
 * It also handles various error scenarios, such as missing or invalid tokens and user not 
 * found cases, by returning appropriate HTTP status codes and error messages.
 */

import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code } from '../../types/types.ts';

/**
 * Retrieves the profile information for a user based on their authentication token.
 * 
 * This function checks the Authorization header for a Bearer token, extracts the user ID from the token,
 * and then queries the database for the user's information. If the user is found, their profile information
 * is returned in the response, excluding the password. If the token is missing, invalid, or if the user
 * is not found, appropriate error messages are returned with corresponding HTTP status codes. In case of any
 * unexpected errors during the database query, a generic internal server error message is returned.
 * 
 * @param request - The incoming HTTP request containing the Authorization header with the user's token.
 * @param response - The HTTP response object used to send the profile information back to the client.
 * @param db - An instance of the `ApiDatabase` class used to interact with the database for retrieving 
 * user information.
 * 
 * @returns A JSON response containing the user's profile information or an error message.
 */
export function getProfile(request: Request, response: Response, db: ApiDatabase): any {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(Code.Unauthorized)
      .json({ message: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  const userId = parseInt(token, 10);

  if (isNaN(userId)) {
    return response.status(Code.Unauthorized)
      .json({ message: 'Invalid token format.' });
  }

  try {
    if (db.isUserExists({ user_id: userId })) {
      const dbOption = db.selectUser({ user_id: userId });

      const { password, ...userWithoutPassword } = dbOption;
      return response.status(Code.OK)
        .json(userWithoutPassword);
    }

    return response.status(Code.NotFound)
      .json({ message: 'User with provided data not found.' });
  } catch (error) {
    return response.status(Code.InternalServerError)
      .json({ message: 'Internal server error.' });
  }
}
