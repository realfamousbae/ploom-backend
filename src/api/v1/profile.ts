import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code } from '../../types/types.ts';

export function getProfile(request: Request, response: Response, db: ApiDatabase): any {
  // FIXME: It was only for debug purposes to check if headers are correctly parsed.
  // console.log(`[GET /api/v1/profile] Headers:`, request.headers); 

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

      // Exclude password from returned user data
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
