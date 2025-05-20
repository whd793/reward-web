import net from 'net';

const testConnection = (host, port) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.setTimeout(5000);

    socket.on('connect', () => {
      console.log(`✅ Connection to ${host}:${port} successful`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.log(`❌ Connection to ${host}:${port} timed out`);
      socket.destroy();
      reject(new Error('Timeout'));
    });

    socket.on('error', err => {
      console.log(`❌ Connection to ${host}:${port} failed:`, err.message);
      reject(err);
    });

    socket.connect(port, host);
  });
};

// Test connections
async function testServices() {
  console.log('Testing microservice connections...\n');

  try {
    await testConnection('localhost', 3001);
    console.log('Auth service is reachable');
  } catch (error) {
    console.log('Auth service is not reachable');
  }

  try {
    await testConnection('localhost', 3002);
    console.log('Event service is reachable');
  } catch (error) {
    console.log('Event service is not reachable');
  }
}

testServices();
