const prisma = require('../prismaClient');

// Get or create a direct chat room between two users
const getOrCreateDirectChat = async (req, res) => {
  try {
    console.log('=== CHAT DIRECT DEBUG ===');
    console.log('Request headers:', req.headers);
    console.log('Request user:', req.user);
    console.log('Participant ID:', req.params.participantId);
    
    const { participantId } = req.params;
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {
      console.log('No user ID found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if both users exist
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { company: true }
    });

    const participant = await prisma.user.findUnique({
      where: { id: parseInt(participantId) },
      include: { company: true }
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Allow chat between all users regardless of company
    // Users can now chat with trainees and managers from any company

    // Check if a direct chat room already exists
    // For cross-company chats, we'll use a special companyId or null
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: {
              in: [currentUserId, parseInt(participantId)]
            }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    // If no chat room exists, create one
    if (!chatRoom) {
      // For cross-company chats, use the current user's company as primary
      // or find a valid company ID if current user has no company
      let chatRoomCompanyId = currentUser.companyId;
      
      // If current user has no company, use the participant's company
      if (!chatRoomCompanyId) {
        chatRoomCompanyId = participant.companyId;
      }
      
      // If neither user has a company, find the first available company
      if (!chatRoomCompanyId) {
        const firstCompany = await prisma.company.findFirst({
          select: { id: true }
        });
        chatRoomCompanyId = firstCompany?.id;
      }
      
      // If still no company found, we can't create a chat room
      if (!chatRoomCompanyId) {
        return res.status(400).json({ message: 'No valid company found for chat room creation' });
      }
      
      chatRoom = await prisma.chatRoom.create({
        data: {
          type: 'DIRECT',
          companyId: chatRoomCompanyId,
          participants: {
            create: [
              { userId: currentUserId },
              { userId: parseInt(participantId) }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          messages: []
        }
      });
    }

    // Mark messages as read for the current user
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: chatRoom.id,
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(chatRoom);
  } catch (error) {
    console.error('Error in getOrCreateDirectChat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all chat rooms for the current user
const getUserChatRooms = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
            isActive: true
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(chatRooms);
  } catch (error) {
    console.error('Error in getUserChatRooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get chat room messages
const getChatRoomMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is a participant in this chat room
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: {
        chatRoomId: parseInt(chatRoomId),
        userId: currentUserId,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: parseInt(chatRoomId)
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark messages as read for the current user
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: parseInt(chatRoomId),
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error in getChatRoomMessages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatRoomId, content, receiverId } = req.body;
    const currentUserId = req.user.id;

    // Verify user is a participant in this chat room
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: {
        chatRoomId: parseInt(chatRoomId),
        userId: currentUserId,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId: currentUserId,
        receiverId: receiverId ? parseInt(receiverId) : null,
        chatRoomId: parseInt(chatRoomId)
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Update chat room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: parseInt(chatRoomId) },
      data: { updatedAt: new Date() }
    });

    // Ensure sender is in the WebSocket chat room
    if (global.wsHandler) {
      console.log(`🔌 Broadcasting message via WebSocket:`, {
        messageId: message.id,
        chatRoomId: parseInt(chatRoomId),
        senderId: currentUserId
      });
      
      // Add sender to chat room if not already there
      global.wsHandler.handleJoinChatRoom(currentUserId, parseInt(chatRoomId));
      
      // Broadcast message via WebSocket for real-time delivery
      global.wsHandler.broadcastMessage(parseInt(chatRoomId), {
        ...message,
        chatRoomId: parseInt(chatRoomId)
      });
    } else {
      console.log('⚠️ WebSocket handler not available');
    }

    res.json(message);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all users for chat (excluding current user)
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all users regardless of company for cross-company chat
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Show admins/managers first
        { name: 'asc' }
      ]
    });

    res.json(users);
  } catch (error) {
    console.error('Error in getCompanyUsers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get unread message count
const getUnreadMessageCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const count = await prisma.chatMessage.count({
      where: {
        receiverId: currentUserId,
        isRead: false
      }
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getOrCreateDirectChat,
  getUserChatRooms,
  getChatRoomMessages,
  sendMessage,
  getAllUsers,
  getUnreadMessageCount
};
