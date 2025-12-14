import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code, getTypedParamsAs, joinWithCwd } from '../../types/types.ts';

import type { User } from '../../models/database.ts';

export function registerNewUser(request: Request, response: Response, db: ApiDatabase): any {
  response.status(Code.BadRequest);

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
  if (db.isUserExists({ email: user.email })) { // 'OR' | Verification by email.
    return response.json({ message: 'User with provided registration data already exist.' });
  }

  db.insertUser(user);

  response.status(Code.OK)
    .json({ message: 'User successfully registered.' });
}
