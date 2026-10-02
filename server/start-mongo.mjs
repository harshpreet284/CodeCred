import { MongoMemoryServer } from 'mongodb-memory-server';

async function run() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'codecred'
    }
  });
  console.log(`MongoMemoryServer started on ${mongod.getUri()}`);
  
  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit();
  });
}

run();
