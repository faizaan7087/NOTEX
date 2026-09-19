const User = require('../models/User');
const generateToken = require('../utils/tokenGenerator');

// @desc    Register new student / user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, college, semester } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      college: college || 'Engineering & Science College',
      semester: semester || 'Sem 4'
    });

    if (user) {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully!',
        token: generateToken(user._id),
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          college: user.college,
          semester: user.semester,
          createdAt: user.createdAt
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user registration data.'
      });
    }
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully!',
        token: generateToken(user._id),
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          college: user.college,
          semester: user.semester,
          createdAt: user.createdAt
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        googleId: user.googleId || null,
        driveConnected: !!user.driveRootFolderId,
        driveRootFolderId: user.driveRootFolderId || '',
        college: user.college || '',
        semester: user.semester || '',
        location: user.location || '',
        bio: user.bio || '',
        isProfileCompleted: user.isProfileCompleted || false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[GetMe Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.'
    });
  }
};

// @desc    Update student profile details (Name, College, Location, Bio, Semester)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { name, college, semester, location, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name !== undefined ? name.trim() : user.name,
        college: college !== undefined ? college.trim() : user.college,
        semester: semester !== undefined ? semester.trim() : user.semester,
        location: location !== undefined ? location.trim() : user.location,
        bio: bio !== undefined ? bio.trim() : user.bio,
        avatar: avatar !== undefined ? avatar.trim() : user.avatar,
        isProfileCompleted: true
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully!',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar || '',
        googleId: updatedUser.googleId || null,
        driveConnected: !!updatedUser.driveRootFolderId,
        driveRootFolderId: updatedUser.driveRootFolderId || '',
        college: updatedUser.college || '',
        semester: updatedUser.semester || '',
        location: updatedUser.location || '',
        bio: updatedUser.bio || '',
        isProfileCompleted: true,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('[UpdateProfile Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile details.'
    });
  }
};

// @desc    Authenticate with Google OAuth 2.0 & Initialize Drive
// @route   POST /api/auth/google
// @access  Public
const googleLoginUser = async (req, res) => {
  try {
    const { credential, accessToken, refreshToken, userInfo } = req.body;
    const { OAuth2Client } = require('google-auth-library');
    const googleDriveService = require('../services/googleDriveService');

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let email, name, googleId, avatar;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
        avatar = payload.picture;
      } catch (verifyErr) {
        // Fallback: parse unverified JWT payload for local testing
        const base64Url = credential.split('.')[1];
        if (base64Url) {
          const payload = JSON.parse(Buffer.from(base64Url, 'base64').toString());
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
          avatar = payload.picture;
        }
      }
    } else if (userInfo) {
      email = userInfo.email;
      name = userInfo.name;
      googleId = userInfo.id || userInfo.googleId;
      avatar = userInfo.picture || userInfo.avatar;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract Google user profile.'
      });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let driveRootFolderId = user?.driveRootFolderId || '';

    // If OAuth access token is provided, attempt to create/fetch NOTEX_Vault in Google Drive
    if (accessToken || refreshToken) {
      try {
        const authClient = googleDriveService.createOAuth2Client(accessToken, refreshToken);
        driveRootFolderId = await googleDriveService.getOrCreateNotexVault(authClient);
      } catch (driveErr) {
        console.warn('[Google Drive Init Info]:', driveErr.message);
      }
    }

    if (user) {
      user = await User.findByIdAndUpdate(user._id, {
        googleId: googleId || user.googleId,
        avatar: avatar || user.avatar,
        googleAccessToken: accessToken || user.googleAccessToken,
        googleRefreshToken: refreshToken || user.googleRefreshToken,
        driveRootFolderId: driveRootFolderId || user.driveRootFolderId
      });
    } else {
      user = await User.create({
        name: name || 'Student',
        email: email.toLowerCase().trim(),
        googleId,
        avatar,
        googleAccessToken: accessToken || '',
        googleRefreshToken: refreshToken || '',
        driveRootFolderId: driveRootFolderId || '',
        college: 'Google Academic User',
        semester: 'Active Student'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome to NOTEX, ${user.name}! Connected to Google Drive.`,
      token: generateToken(user._id),
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        googleId: user.googleId,
        driveConnected: !!user.driveRootFolderId,
        driveRootFolderId: user.driveRootFolderId,
        college: user.college,
        semester: user.semester,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[Google Auth Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Google Authentication failed.'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLoginUser,
  updateUserProfile,
  getMe
};
