
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../validation/schemas.js';

export async function register(req, res, next) {
  try {
    console.log('Register request body:', req.body);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user (password will be hashed in pre-save hook)
    const user = await User.create(value);

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Return user without password and token
    const { password, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Register error:', err);
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    console.log('Login request body:', req.body);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    // Find user
    const user = await User.findOne({ email: value.email }).select('+password');
    console.log('User found:', !!user);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(value.password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Return user without password and token
    const { password, ...userWithoutPassword } = user.toObject();

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
}



export async function getCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user.toObject();
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (err) {
    next(err);
  }
}
