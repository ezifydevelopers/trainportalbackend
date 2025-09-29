const prisma = require('../prismaClient');

// Get or create a direct chat room between two users
const getOrCreateDirectChat = async (req, res) => {
  try {

    const { participantId } = req.params;
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {

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

      // If current user is a manager without a companyId, assign them to the chat room's company
      if (!currentUser.companyId && currentUser.role === 'MANAGER') {

        await prisma.user.update({
          where: { id: currentUserId },
          data: { companyId: chatRoomCompanyId }
        });
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
      // Let's also check if the user exists in any participants for this room
      const allParticipants = await prisma.chatRoomParticipant.findMany({
        where: {
          chatRoomId: parseInt(chatRoomId)
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      return res.status(403).json({ 
        message: 'Access denied to this chat room',
        debug: {
          currentUserId,
          chatRoomId: parseInt(chatRoomId),
          allParticipants: allParticipants.map(p => ({ userId: p.userId, userName: p.user.name, userRole: p.user.role, isActive: p.isActive }))
        }
      });
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
        },
        replyToMessage: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true
              }
            }
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

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatRoomId, content, receiverId, replyToMessageId } = req.body;
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
      // Let's also check if the user exists in any participants for this room
      const allParticipants = await prisma.chatRoomParticipant.findMany({
        where: {
          chatRoomId: parseInt(chatRoomId)
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      return res.status(403).json({ 
        message: 'Access denied to this chat room',
        debug: {
          currentUserId,
          chatRoomId: parseInt(chatRoomId),
          allParticipants: allParticipants.map(p => ({ userId: p.userId, userName: p.user.name, userRole: p.user.role, isActive: p.isActive }))
        }
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId: currentUserId,
        receiverId: receiverId ? parseInt(receiverId) : null,
        chatRoomId: parseInt(chatRoomId),
        replyToMessageId: replyToMessageId ? parseInt(replyToMessageId) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        replyToMessage: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true
              }
            }
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

    }

    res.json(message);
  } catch (error) {

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

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get unread message count
const getUnreadMessageCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all chat rooms where the user is a participant
    const userChatRooms = await prisma.chatRoomParticipant.findMany({
      where: {
        userId: currentUserId,
        isActive: true
      },
      select: {
        chatRoomId: true
      }
    });

    const chatRoomIds = userChatRooms.map(room => room.chatRoomId);

    // Count unread messages in those chat rooms (excluding messages sent by the current user)
    const count = await prisma.chatMessage.count({
      where: {
        chatRoomId: {
          in: chatRoomIds
        },
        senderId: {
          not: currentUserId
        },
        isRead: false
      }
    });

    res.json({ unreadCount: count });
  } catch (error) {

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all unread messages for notifications
const getRecentMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 50; // Increased default limit

    // Get all chat rooms where the user is a participant
    const userChatRooms = await prisma.chatRoomParticipant.findMany({
      where: {
        userId: currentUserId,
        isActive: true
      },
      select: {
        chatRoomId: true
      }
    });

    const chatRoomIds = userChatRooms.map(room => room.chatRoomId);

    // Get all unread messages from those chat rooms
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: {
          in: chatRoomIds
        },
        senderId: {
          not: currentUserId
        },
        isRead: false
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
        createdAt: 'desc'
      },
      take: limit
    });

    // Get total count for reference
    const totalUnreadCount = await prisma.chatMessage.count({
      where: {
        chatRoomId: {
          in: chatRoomIds
        },
        senderId: {
          not: currentUserId
        },
        isRead: false
      }
    });

    res.json({ 
      success: true,
      messages: messages,
      totalUnread: totalUnreadCount,
      showing: messages.length
    });
  } catch (error) {

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { chatRoomId, messageId } = req.body;

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

    // Mark the message as read
    await prisma.chatMessage.updateMany({
      where: {
        id: parseInt(messageId),
        chatRoomId: parseInt(chatRoomId),
        receiverId: currentUserId
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark all messages as read for the current user
const markAllMessagesAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all chat rooms where the user is a participant
    const userChatRooms = await prisma.chatRoomParticipant.findMany({
      where: {
        userId: currentUserId,
        isActive: true
      },
      select: {
        chatRoomId: true
      }
    });

    const chatRoomIds = userChatRooms.map(room => room.chatRoomId);

    // Mark all unread messages as read
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: {
          in: chatRoomIds
        },
        receiverId: currentUserId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true, message: 'All messages marked as read' });
  } catch (error) {

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a single message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if message exists and user has permission to delete it
    const message = await prisma.chatMessage.findUnique({
      where: { id: parseInt(messageId) },
      include: {
        chatRoom: {
          include: {
            participants: {
              where: { userId: currentUserId }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant in the chat room
    if (message.chatRoom.participants.length === 0) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Allow any participant to delete messages (like WhatsApp)
    // Only check if user is participant in the chat room

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: parseInt(messageId) }
    });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete multiple messages
const deleteMultipleMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Message IDs are required' });
    }

    // Check if all messages exist and user has permission to delete them
    const messages = await prisma.chatMessage.findMany({
      where: { 
        id: { in: messageIds.map(id => parseInt(id)) }
      },
      include: {
        chatRoom: {
          include: {
            participants: {
              where: { userId: currentUserId }
            }
          }
        }
      }
    });

    if (messages.length !== messageIds.length) {
      return res.status(404).json({ message: 'Some messages not found' });
    }

    // Check permissions for each message
    for (const message of messages) {
      if (message.chatRoom.participants.length === 0) {
        return res.status(403).json({ message: 'Access denied to some chat rooms' });
      }
      
      // Allow any participant to delete messages (like WhatsApp)
      // Only check if user is participant in the chat room
    }

    // Delete all messages
    await prisma.chatMessage.deleteMany({
      where: { id: { in: messageIds.map(id => parseInt(id)) } }
    });

    res.json({ success: true, message: `${messageIds.length} messages deleted successfully` });
  } catch (error) {
    console.error('Error deleting multiple messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete entire chat room
const deleteChatRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if chat room exists and user has permission to delete it
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: parseInt(chatRoomId) },
      include: {
        participants: {
          where: { userId: currentUserId }
        }
      }
    });

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is participant in the chat room
    if (chatRoom.participants.length === 0) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Only allow admins to delete entire chat rooms, or users to leave the chat
    if (req.user.role !== 'ADMIN') {
      // For non-admin users, just remove them from the chat room
      await prisma.chatRoomParticipant.deleteMany({
        where: {
          chatRoomId: parseInt(chatRoomId),
          userId: currentUserId
        }
      });

      return res.json({ success: true, message: 'You have left the chat room' });
    }

    // For admins, delete the entire chat room and all related data
    await prisma.$transaction(async (tx) => {
      // Delete all messages in the chat room
      await tx.chatMessage.deleteMany({
        where: { chatRoomId: parseInt(chatRoomId) }
      });

      // Delete all participants
      await tx.chatRoomParticipant.deleteMany({
        where: { chatRoomId: parseInt(chatRoomId) }
      });

      // Delete the chat room
      await tx.chatRoom.delete({
        where: { id: parseInt(chatRoomId) }
      });
    });

    res.json({ success: true, message: 'Chat room deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getOrCreateDirectChat,
  getUserChatRooms,
  getChatRoomMessages,
  sendMessage,
  getAllUsers,
  getUnreadMessageCount,
  getRecentMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteMessage,
  deleteMultipleMessages,
  deleteChatRoom
};
