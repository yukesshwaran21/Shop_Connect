import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'USER', ownerId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const allowedRoles = ['ADMIN', 'SHOP_OWNER', 'USER'];
    const normalizedRole = role && allowedRoles.includes(role) ? role : 'USER';

    if (normalizedRole === 'SHOP_OWNER' && !ownerId) {
      return res.status(400).json({ message: 'Owner ID is required for shop owners' });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (normalizedRole === 'SHOP_OWNER') {
      const existingOwnerId = await User.findOne({ ownerId });
      if (existingOwnerId) {
        return res.status(400).json({ message: 'Owner ID is already in use' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      ownerId: normalizedRole === 'SHOP_OWNER' ? ownerId : undefined,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      ownerId: user.ownerId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, ownerId, role } = req.body;

    let user;
    const normalizedEmail = email ? email.toLowerCase() : '';

    if (ownerId) {
      user = await User.findOne({
        $or: [{ ownerId }, { email: normalizedEmail || ownerId.toLowerCase() }],
        role: 'SHOP_OWNER',
      });
    } else if (role === 'ADMIN') {
      user = await User.findOne({ email: normalizedEmail, role: 'ADMIN' });
    } else {
      user = await User.findOne({ email: normalizedEmail, role: 'USER' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

export const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};
