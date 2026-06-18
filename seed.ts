import 'dotenv/config';
import { initializeSeed } from './server/src/services/seedService.js';

initializeSeed()
  .then(() => {
    console.log('Seeding complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
