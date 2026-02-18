const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { verifyTurnstileToken } = require('../utils/turnstile');




exports.registerParticipant = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      participantType,
      collegeName,
      contactNumber,
      interests,
      followedClubs,
      captchaToken
    } = req.body;

    const captcha = await verifyTurnstileToken(captchaToken, req.ip);
    if (!captcha.ok) {
      return res.status(400).json({
        success: false,
        message: captcha.error || 'CAPTCHA verification failed'
      });
    }


    if (!email || !password || !firstName || !lastName || !participantType || !collegeName || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }


    if (participantType === 'IIIT') {
      const allowedDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
      const lowerEmail = String(email).toLowerCase();
      const ok = allowedDomains.some((d) => lowerEmail.endsWith(d));
      if (!ok) {
        return res.status(400).json({
          success: false,
          message: `IIIT participants must use IIIT-issued email (${allowedDomains.join(', ')})`
        });
      }
    }


    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'participant',
      firstName,
      lastName,
      participantType,
      collegeName,
      contactNumber,
      interests: interests || [],
      followedClubs: followedClubs || []
    });


    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        participantType: user.participantType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};




exports.login = async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    const captcha = await verifyTurnstileToken(captchaToken, req.ip);
    if (!captcha.ok) {
      return res.status(400).json({
        success: false,
        message: captcha.error || 'CAPTCHA verification failed'
      });
    }


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }


    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }


    if (user.role === 'organizer' && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }


    const token = generateToken(user._id);


    let userData = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'participant') {
      userData = {
        ...userData,
        firstName: user.firstName,
        lastName: user.lastName,
        participantType: user.participantType,
        collegeName: user.collegeName,
        contactNumber: user.contactNumber,
        interests: user.interests,
        followedClubs: user.followedClubs
      };
    } else if (user.role === 'organizer') {
      userData = {
        ...userData,
        organizerName: user.organizerName,
        category: user.category,
        description: user.description,
        contactEmail: user.contactEmail
      };
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};




exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};




exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id);


    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }


    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};
