const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NotificationService = require('../services/notificationService');

module.exports = {
  signup: async (req, res) => {
    try {
      const { name, email, password, companyName } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }
      
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user with PENDING status - no company assigned yet
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'TRAINEE',
          companyId: null, // No company assigned yet
          isVerified: false, // Not verified until approved
          status: 'PENDING', // Pending approval
        },
      });

      // Send notification to admins and managers about new trainee signup
      try {
        await NotificationService.notifyNewTraineeSignup(user);
        console.log(`Notification sent for new trainee signup: ${user.name} (${user.email})`);
      } catch (notificationError) {
        // Don't fail the signup if notification fails
      }

      return res.status(201).json({ 
        message: 'Signup successful. Your account is pending approval.', 
        user: { id: user.id, name: user.name, email: user.email, status: user.status }
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if user is approved
      if (user.status === 'PENDING') {
        return res.status(403).json({ message: 'Your account is pending approval. Please wait for an administrator to approve your account.' });
      }
      
      if (user.status === 'REJECTED') {
        return res.status(403).json({ message: 'Your account has been rejected. Please contact an administrator.' });
      }
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, status: user.status } });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  adminSignup: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      // Check if email exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create admin user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          isVerified: true,
        },
      });
      return res.status(201).json({ message: 'Admin signup successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  },
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
}; 