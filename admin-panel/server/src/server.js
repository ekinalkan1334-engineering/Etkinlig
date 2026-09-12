import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.port, () => {
  console.log(`etkinlig API → http://localhost:${env.port}/api`);
});
