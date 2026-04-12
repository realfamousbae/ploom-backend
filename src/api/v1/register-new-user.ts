import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { MissingPropertyError } from '../../types/errors.ts';
import { Code, getTypedParamsAs, joinWithCwd } from '../../types/types.ts';

import type { User } from '../../models/database.ts';

export function registerNewUser(request: Request, response: Response, db: ApiDatabase): any {
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
    if (request.file) {
      user.profile_image_path = joinWithCwd('/public/profile_images', request.file.filename);
    }

    if (db.isUserExists({ email: user.email })) {
      return response.status(Code.Conflict).json({ message: 'User with provided email already exists.' });
    }

    db.insertUser(user);
    const dbOption = db.selectUser({ email: user.email });

    return response.status(Code.OK)
      .json({
        message: 'User successfully registered.',
        token: dbOption.user_id
      });

  } catch (error) {
    if (error instanceof MissingPropertyError) {
      return response.status(Code.BadRequest).json({ message: error.message });
    }

    return response.status(Code.InternalServerError).json({ message: 'Internal server error.' });
  }
}
