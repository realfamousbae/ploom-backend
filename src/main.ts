/**
 * @module src/main
 * 
 * @description This is the entry point of the application. It initializes the server and starts 
 * listening for incoming requests. The server configuration is loaded from the 
 * config file, and the application is created using the Application class.
 * 
 * Finally, the server starts listening for incoming requests.
 * 
 * Note: The Application class and getConfig function are defined in separate files,
 * and their implementations are not shown here. The Application class is responsible
 * for handling the server logic, while the getConfig function is responsible for
 * loading the server configuration.
 * 
 * @author realfamousbae (Aleksey)
 */

import { Application } from './app/application.ts';
import { getConfig } from './config.ts';
import { getLogger } from './utils/logger.ts';

const logger = getLogger('main');

/**
 * The main function initializes the server and starts listening for incoming requests. 
 * It first retrieves the server configuration using the getConfig function, then creates 
 * an instance of the Application class with the configuration, and finally starts the 
 * server to listen for incoming requests.
 */
function main(): void {
  logger.info('process boot', {
    node: process.version,
    pid: process.pid,
    cwd: process.cwd(),
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaughtException', { error });
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', { reason: reason instanceof Error ? reason : { reason } });
  });

  const config = getConfig();

  const server = new Application(config);
  server.startListening();
}

main();
