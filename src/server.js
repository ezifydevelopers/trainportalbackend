const app = require('./app');
const http = require('http');
const WebSocketHandler = require('./websocketHandler');
const ModuleCompletionService = require('./services/moduleCompletionService');
const prisma = require('./prismaClient');

const PORT = process.env.PORT || 7001;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(server);

// Initialize module completion service
const moduleCompletionService = new ModuleCompletionService();

// Make services available to other modules
global.wsHandler = wsHandler;
global.moduleCompletionService = moduleCompletionService;

// Test database connection before starting server
async function startServer() {
  try {
    await prisma.$connect();
    
    // Test a simple query to ensure database is working
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const moduleCount = await prisma.trainingModule.count();
    // Start the server
    server.listen(PORT, () => {
    });
    
    // Keep the server running
    server.on('close', () => {
    });
    
  } catch (error) {
    process.exit(1);
  }
}

// Start the server
startServer();

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
  }
});

// Add process error handling
process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
}); 