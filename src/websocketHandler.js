const WebSocket = require('ws');

class WebSocketHandler {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket
    this.chatRooms = new Map(); // chatRoomId -> Set of userIds
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const url = new URL(request.url, 'http://localhost');
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        ws.close(1008, 'User ID required');
        return;
      }
      // Store client connection
      this.clients.set(parseInt(userId), ws);
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        data: { userId: parseInt(userId) }
      }));

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(parseInt(userId), message);
        } catch (error) {
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(parseInt(userId));
        
        // Remove user from all chat rooms
        this.chatRooms.forEach((users, chatRoomId) => {
          users.delete(parseInt(userId));
        });
        
        // Broadcast user offline status
        this.broadcastToAll({
          type: 'USER_OFFLINE',
          data: { userId: parseInt(userId) }
        });
      });

      // Handle errors
      ws.on('error', (error) => {
      });
    });
  }

  handleMessage(userId, message) {
    switch (message.type) {
      case 'NEW_MESSAGE':
        this.handleNewMessage(userId, message.data);
        break;
      case 'TYPING':
        this.handleTypingIndicator(userId, message.data);
        break;
      case 'JOIN_CHAT_ROOM':
        this.handleJoinChatRoom(userId, message.data.chatRoomId);
        break;
      case 'LEAVE_CHAT_ROOM':
        this.handleLeaveChatRoom(userId, message.data.chatRoomId);
        break;
      case 'USER_ONLINE':
        this.handleUserOnline(userId);
        break;
      case 'MODULE_COMPLETION':
        this.handleModuleCompletion(userId, message.data);
        break;
      default:
    }
  }

  handleNewMessage(userId, messageData) {
    // Broadcast message to all users in the chat room
    const chatRoomId = messageData.chatRoomId;
    const usersInRoom = this.chatRooms.get(chatRoomId) || new Set();
    
    console.log(`Broadcasting message to chat room ${chatRoomId}, users in room:`, Array.from(usersInRoom));
    
    usersInRoom.forEach(roomUserId => {
      if (roomUserId !== userId) { // Don't send back to sender
        const client = this.clients.get(roomUserId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'NEW_MESSAGE',
            data: messageData
          }));
        } else {
        }
      }
    });
    
    // If no users in room, log for debugging
    if (usersInRoom.size === 0) {
    }
  }

  handleTypingIndicator(userId, data) {
    const chatRoomId = data.chatRoomId;
    const usersInRoom = this.chatRooms.get(chatRoomId) || new Set();
    
    usersInRoom.forEach(roomUserId => {
      if (roomUserId !== userId) { // Don't send back to sender
        const client = this.clients.get(roomUserId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'TYPING',
            data: {
              userId: userId,
              isTyping: data.isTyping,
              chatRoomId: chatRoomId
            }
          }));
        }
      }
    });
  }

  handleJoinChatRoom(userId, chatRoomId) {
    if (!this.chatRooms.has(chatRoomId)) {
      this.chatRooms.set(chatRoomId, new Set());
    }
    this.chatRooms.get(chatRoomId).add(userId);
    console.log(`Users in chat room ${chatRoomId}:`, Array.from(this.chatRooms.get(chatRoomId)));
  }

  handleLeaveChatRoom(userId, chatRoomId) {
    const usersInRoom = this.chatRooms.get(chatRoomId);
    if (usersInRoom) {
      usersInRoom.delete(userId);
      if (usersInRoom.size === 0) {
        this.chatRooms.delete(chatRoomId);
      }
    }
    if (usersInRoom) {
      console.log(`Remaining users in chat room ${chatRoomId}:`, Array.from(usersInRoom));
    }
  }

  handleUserOnline(userId) {
    // Broadcast user online status to all other users
    this.broadcastToAll({
      type: 'USER_ONLINE',
      data: { userId: userId }
    }, userId);
  }

  handleModuleCompletion(userId, data) {
    // Broadcast module completion to all users
    this.broadcastToAll({
      type: 'MODULE_COMPLETION',
      data: data
    });
  }

  broadcastToAll(message, excludeUserId = null) {
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastToChatRoom(chatRoomId, message, excludeUserId = null) {
    const usersInRoom = this.chatRooms.get(chatRoomId) || new Set();
    
    console.log(`📤 Broadcasting to chat room ${chatRoomId}:`, {
      usersInRoom: Array.from(usersInRoom),
      excludeUserId: excludeUserId,
      messageType: message.type
    });
    
    usersInRoom.forEach(userId => {
      if (userId !== excludeUserId) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        } else {
        }
      } else {
        console.log(`⏭️ Skipping user ${userId} (excluded)`);
      }
    });
  }

  // Method to be called from other parts of the application
  broadcastMessage(chatRoomId, message) {
    this.broadcastToChatRoom(chatRoomId, {
      type: 'NEW_MESSAGE',
      data: message
    }, message.senderId); // Exclude the sender to prevent duplication
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.clients.size;
  }

  // Get users in a specific chat room
  getUsersInChatRoom(chatRoomId) {
    return Array.from(this.chatRooms.get(chatRoomId) || []);
  }
}

module.exports = WebSocketHandler;
