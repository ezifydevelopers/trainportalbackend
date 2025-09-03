const app = require('./app');
const http = require('http');
const WebSocketHandler = require('./websocketHandler');
const ModuleCompletionService = require('./services/moduleCompletionService');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(server);

// Initialize module completion service
const moduleCompletionService = new ModuleCompletionService();

// Make services available to other modules
global.wsHandler = wsHandler;
global.moduleCompletionService = moduleCompletionService;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time chat`);
  console.log(`Module completion monitoring started`);
}); 