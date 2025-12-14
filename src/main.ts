import { Application } from './app/application.ts';
import { getConfig } from './config.ts';

function main(): void {
  const config = getConfig();

  const server = new Application(config); 
  server.startListening();
}
 
main();
