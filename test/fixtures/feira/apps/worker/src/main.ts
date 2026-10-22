import { Worker } from 'bullmq';
import { roteirizar } from './roteirizar';

new Worker('entregas', async (job) => roteirizar(job.data.cestaId), { connection: { host: 'redis' } });
