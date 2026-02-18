const User = require('../models/User.model');
const PasswordResetRequest = require('../models/PasswordResetRequest.model');
const bcrypt = require('bcryptjs');
const { generatePassword } = require('../utils/generators');
const { sendCredentialsEmail, sendPasswordResetEmail } = require('../utils/emailService');




exports.getDashboard = async (req, res) => {
  try {
    const totalParticipants = await User.countDocuments({ role: 'participant' });
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const activeOrganizers = await User.countDocuments({ role: 'organizer', isActive: true });
    const pendingPasswordResets = await PasswordResetRequest.countDocuments({ status: 'Pending' });

    res.json({
      success: true,
      data: {
        totalParticipants,
        totalOrganizers,
        activeOrganizers,
        pendingPasswordResets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};




exports.createOrganizer = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail
    } = req.body;


    if (!organizerName || !category || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }


    const loginEmail = contactEmail;
    const password = generatePassword();


    const existingUser = await User.findOne({ email: loginEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const organizer = await User.create({
      email: loginEmail,
      password: hashedPassword,
      role: 'organizer',
      organizerName,
      category,
      description: description || '',
      contactEmail,
      isActive: true
    });


    await sendCredentialsEmail(loginEmail, password, organizerName);

    res.status(201).json({
      success: true,
      message: 'Organizer account created successfully',
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        loginEmail,
        temporaryPassword: password,
        category: organizer.category
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating organizer',
      error: error.message
    });
  }
};




exports.getOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' }).
    select('-password').
    sort({ createdAt: -1 });

    res.json({
      success: true,
      count: organizers.length,
      organizers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organizers',
      error: error.message
    });
  }
};




exports.updateOrganizerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const organizer = await User.findOne({
      _id: req.params.id,
      role: 'organizer'
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    organizer.isActive = isActive;
    await organizer.save();

    res.json({
      success: true,
      message: `Organizer ${isActive ? 'activated' : 'deactivated'} successfully`,
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        isActive: organizer.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating organizer status',
      error: error.message
    });
  }
};




exports.deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: 'organizer'
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    await organizer.deleteOne();

    res.json({
      success: true,
      message: 'Organizer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting organizer',
      error: error.message
    });
  }
};




exports.getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query).
    populate('organizerId', 'organizerName email category').
    populate('resolvedBy', 'email').
    sort({ requestDate: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching password reset requests',
      error: error.message
    });
  }
};




exports.processPasswordResetRequest = async (req, res) => {
  try {
    const { status, adminComments } = req.body;

    const request = await PasswordResetRequest.findById(req.params.id).
    populate('organizerId', 'organizerName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    request.status = status;
    request.adminComments = adminComments || '';
    request.resolvedBy = req.user.id;
    request.resolvedDate = new Date();

    if (status === 'Approved') {

      const newPassword = generatePassword();
      request.newPassword = newPassword;


      const organizer = await User.findById(request.organizerId);
      organizer.password = await bcrypt.hash(newPassword, 10);
      await organizer.save();


      await sendPasswordResetEmail(
        organizer.email,
        newPassword,
        organizer.organizerName
      );
    }

    await request.save();

    res.json({
      success: true,
      message: `Password reset request ${status.toLowerCase()}`,
      request: {
        id: request._id,
        organizerName: request.organizerId.organizerName,
        status: request.status,
        newPassword: status === 'Approved' ? request.newPassword : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};




exports.getParticipants = async (req, res) => {
  try {
    const participants = await User.find({ role: 'participant' }).
    select('-password').
    sort({ createdAt: -1 });

    res.json({
      success: true,
      count: participants.length,
      participants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching participants',
      error: error.message
    });
  }
};
