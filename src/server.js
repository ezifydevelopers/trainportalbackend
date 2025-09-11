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
    console.log('🔄 Testing database connection...');
    await prisma.$connect();
    
    // Test a simple query to ensure database is working
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const moduleCount = await prisma.trainingModule.count();
    
    console.log('✅ Database connected successfully!');
    console.log(`📊 Database contains: ${userCount} users, ${companyCount} companies, ${moduleCount} modules`);
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💬 WebSocket server ready for real-time chat`);
      console.log(`📚 Module completion monitoring started`);
      console.log('🎉 Backend server is fully operational!');
    });
    
    // Keep the server running
    server.on('close', () => {
      console.log('Server closed');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your database configuration and try again.');
    process.exit(1);
  }
}

// Start the server
startServer();

server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Add process error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 