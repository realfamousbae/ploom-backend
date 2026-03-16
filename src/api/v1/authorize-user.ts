import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { MissingPropertyError } from '../../types/errors.ts';
import { Code, getTypedParamsAs } from '../../types/types.ts';

import type { User } from '../../models/database.ts';

export function authorizeUser(request: Request, response: Response, db: ApiDatabase): any {
  console.log(`[POST /api/v1/authorize-user] Query params:`, request.query);

  try {
    const userData = getTypedParamsAs<User>(request.query, 'email', 'password');

    if (db.isUserExists({ email: userData.email })) {
      const dbOption = db.selectUser({ email: userData.email });

      const dataIsCorrect =
        dbOption.email === userData.email
        &&
        dbOption.password === userData.password;

      if (dataIsCorrect) {
        // Exclude password from returned user data
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
