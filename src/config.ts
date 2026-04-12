import { EmptyConfigFileError } from './types/errors.ts';
import { joinWithCwd } from './types/types.ts';

import { parse } from 'toml';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const tomlFileName = 'config.toml';

interface Server {
  readonly hostname: string;
  readonly port: number;
}

interface Database {
  readonly file: string;
  readonly schema: string;
}

interface API {
  readonly key: string;
}

export interface Config {
  readonly server: Server;
  readonly database: Database;
  readonly api: API;
}

export function getConfig(): Config | never {
  const tomlPath = joinWithCwd(tomlFileName);

  if (existsSync(tomlPath)) {
    const tomlString = readFileSync(tomlPath, 'utf-8');
    return parse(tomlString) as Config;
  }

  writeFileSync(
    tomlPath, 
    `[server]
hostname="localhost"
port=3000

[database]
file="db/main.sqlite"
shema="db/schema.sql"

[api]
key="INSERT_API_KEY_HERE"`
  );
  
  throw new EmptyConfigFileError(
    'Since the configuration file was not found '
    + 'at startup, it was created from scratch. Now you need to open the file '
    + `${tomlPath} and manually enter the data for the server to work correctly.`
  );
}
