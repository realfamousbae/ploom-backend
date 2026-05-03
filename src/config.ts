import { EmptyConfigFileError } from './types/errors.ts';
import { joinWithCwd } from './types/types.ts';

import { parse } from 'toml';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { isAbsolute, join } from 'path';

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

interface Paths {
  readonly dataDir: string;
  readonly profileImages: string;
  readonly uploadedImages: string;
  readonly generatedImages: string;
}

export interface Config {
  readonly server: Server;
  readonly database: Database;
  readonly api: API;
  readonly paths: Paths;
}

interface TomlConfig {
  server?: Partial<Server>;
  database?: Partial<Database>;
  api?: Partial<API>;
}

function resolveUnderDataDir(dataDir: string, value: string): string {
  return isAbsolute(value) ? value : join(dataDir, value);
}

export function getConfig(): Config | never {
  const tomlPath = joinWithCwd(tomlFileName);
  let tomlConfig: TomlConfig = {};

  if (existsSync(tomlPath)) {
    tomlConfig = parse(readFileSync(tomlPath, 'utf-8')) as TomlConfig;
  } else if (!process.env.FAL_API_KEY) {
    writeFileSync(
      tomlPath,
      `[server]
hostname="localhost"
port=3000

[database]
file="db/main.sqlite"
schema="db/schema.sql"

[api]
key="INSERT_API_KEY_HERE"`
    );

    throw new EmptyConfigFileError(
      'Since the configuration file was not found '
      + 'at startup, it was created from scratch. Now you need to open the file '
      + `${tomlPath} and manually enter the data for the server to work correctly.`
    );
  }

  const dataDir = process.env.DATA_DIR ?? './';

  const portFromEnv = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : undefined;
  const hostname = process.env.HOST ?? tomlConfig.server?.hostname ?? '0.0.0.0';
  const port = portFromEnv ?? tomlConfig.server?.port ?? 3000;

  const dbFileRaw = process.env.DB_FILE ?? tomlConfig.database?.file ?? 'db/main.sqlite';
  const schemaRaw = tomlConfig.database?.schema ?? 'db/schema.sql';

  const apiKey = process.env.FAL_API_KEY ?? tomlConfig.api?.key ?? '';
  if (!apiKey || apiKey === 'INSERT_API_KEY_HERE') {
    throw new EmptyConfigFileError(
      'FAL API key is not configured. Set FAL_API_KEY environment variable '
      + `or provide it via api.key in ${tomlPath}.`
    );
  }

  return {
    server: { hostname, port },
    database: {
      file: resolveUnderDataDir(dataDir, dbFileRaw),
      schema: joinWithCwd(schemaRaw),
    },
    api: { key: apiKey },
    paths: {
      dataDir,
      profileImages: join(dataDir, 'public', 'profile_images'),
      uploadedImages: join(dataDir, 'public', 'uploaded_images'),
      generatedImages: join(dataDir, 'public', 'generated_images'),
    },
  };
}
