import net from 'node:net';

const port = Number(process.argv[2] ?? 3002);
const server = net.createServer();

server.listen(port, '127.0.0.1');
server.on('listening', () => console.log(`Demo listener ready on 127.0.0.1:${port}`));
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

setTimeout(() => server.close(), 60_000).unref();
