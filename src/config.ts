/**
 * @module src/config
 * 
 * @description This module is responsible for loading the configuration of the application 
 * from a TOML file and environment variables. If the configuration file does not exist, 
 * it creates a default one and throws an error to prompt the user to fill it in.
 * 
 * The configuration includes server settings, database settings, API keys, and paths for data storage.
 */
import { EmptyConfigFileError } from './types/errors.ts';
import { joinWithCwd } from './types/types.ts';

import { parse } from 'toml';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { isAbsolute, join } from 'path';

/**
 * The name of the configuration file. It is expected to be in the current working directory.
 * If it does not exist at startup, it will be created with default values, and the user will 
 * be prompted to fill it in.
 */
const tomlFileName = 'config.toml';

/**
 * Interfaces representing the structure of the configuration. These interfaces define the expected
 * properties for the server, database, API, and paths sections of the configuration. The main Config 
 * interface combines all these sections into a single structure that can be used throughout the 
 * application.
 */
interface Server {
  readonly hostname: string;
  readonly port: number;
}

/**
 * The Database interface defines the properties related to the database configuration, including 
 * the file path and the schema file path. The file path is resolved relative to the data directory 
 * if it is not an absolute path.
 */
interface Database {
  readonly file: string;
  readonly schema: string;
}

/**
 * The API interface defines the properties related to the API configuration, which currently 
 * includes only the API key. The API key is required for the application to function correctly, 
 * and if it is not provided, an error will be thrown prompting the user to set it either in the 
 * environment variable or in the configuration file.
 */
interface API {
  readonly key: string;
}

/**
 * The Paths interface defines the properties related to various paths used in the application, 
 * such as the data directory, profile images, uploaded images, and generated images. The paths 
 * for profile images, uploaded images, and generated images are constructed by joining the data 
 * directory with specific subdirectories. This allows for a flexible configuration where the 
 * base data directory can be set, and the application will automatically determine the full 
 * paths for the various resources based on that.
 */
interface Paths {
  readonly dataDir: string;
  readonly profileImages: string;
  readonly uploadedImages: string;
  readonly generatedImages: string;
}

/**
 * The Config interface combines all the individual configuration sections (server, database, API, 
 * and paths) into a single structure that can be easily accessed throughout the application. 
 * This interface defines the overall shape of the configuration object that will be returned by 
 * the getConfig function, ensuring that all necessary configuration properties are present and 
 * correctly typed.
 */
export interface Config {
  readonly server: Server;
  readonly database: Database;
  readonly api: API;
  readonly paths: Paths;
}

/**
 * The TomlConfig interface represents the structure of the configuration as it is read 
 * from the TOML file. Since the configuration file may not contain all the properties 
 * (especially if it is newly created), all properties in this interface are optional and 
 * can be partial. This allows for flexibility in the configuration file, where users can 
 * choose to specify only certain sections or properties, and the application will fill 
 * in the defaults for any missing values.
 */
interface TomlConfig {
  server?: Partial<Server>;
  database?: Partial<Database>;
  api?: Partial<API>;
}

/**
 * Resolves a path relative to the data directory. If the provided value is an absolute path, 
 * it returns it as is. Otherwise, it joins the value with the data directory to 
 * create a full path. This function is used to ensure that paths specified in the 
 * configuration file are correctly resolved based on the data directory, allowing for 
 * flexibility in how paths are defined in the configuration.
 * 
 * @param dataDir - The base data directory to which the value will be resolved if 
 * it is not an absolute path.
 * @param value - The path to resolve.
 * 
 * @returns The resolved path.
 */
function resolveUnderDataDir(dataDir: string, value: string): string {
  return isAbsolute(value) ? value : join(dataDir, value);
}

/**
 * Retrieves the application configuration, either from the TOML file or from environment variables.
 * 
 * The function first checks if the configuration file exists. If it does, it reads and parses 
 * the file to get the configuration values. If the file does not exist and the required
 * environment variable for the API key is not set, it creates a default configuration 
 * file with placeholder values and throws an error to prompt the user to fill in the 
 * necessary information.
 * 
 * The function then constructs the final configuration object by combining values from the 
 * environment variables (which take precedence) and the TOML file, providing default values 
 * where necessary. It also resolves paths based on the data directory.  
 * 
 * @returns The application configuration.
 */
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
