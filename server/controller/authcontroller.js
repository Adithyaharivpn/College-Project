const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cloudinary = require("../middleware/cloudinary");
const logger = require('../utils/logger'); 

const checkUserUnique = async (req, res) => {
  const { email, phoneNumber } = req.body;
  try {
    const existingUser = await User.findOne({ 
      $or: [
        { email: email }, 
        { phoneNumber: phoneNumber }
      ] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already registered" });
      }
      if (existingUser.phoneNumber === phoneNumber) {
         return res.status(400).json({ error: "Phone number already registered" });
      }
    }
    return res.status(200).json({ message: "User is unique" });
  } catch (error) {
    logger.error(`Uniqueness check error: ${error.message}`);
    return res.status(500).json({ error: "Unable to verify details" });
  }
};

const signup = async (req, res) => {
  const { name, email, password, role, tradeCategory, experience, location, phoneNumber, lat, lng } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      if (existingUser.email === email) {
        logger.warn(`Signup failed: Email already registered ${email}`);
        return res.status(400).json({ error: "Email already registered" });
      }
      if (existingUser.phoneNumber === phoneNumber) {
         logger.warn(`Signup failed: Phone already registered ${phoneNumber}`);
         return res.status(400).json({ error: "Phone number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      phoneNumber, // Added
      location, // Available for all roles
      verificationStatus: role === 'tradesperson' ? 'pending' : 'unverified',
      isVerified: false,
    };

    if (req.files) {
      if (req.files['profilePicture']) {
        userData.profilePictureUrl = req.files['profilePicture'][0].path;
      }
      if (req.files['documents']) {
        userData.verificationDocuments = req.files['documents'].map(doc => doc.path);
      }
    }

    if (role === "tradesperson") {
      userData.tradeCategory = tradeCategory;
      userData.experience = experience;
      // userData.location = location; // Moved up
  
    if (lat && lng) {
          userData.mapLocation = { lat, lng };
      }
    }

    const user = new User(userData);
    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        isVerified: user.isVerified
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "3h" },
      (err, token) => {
        if (err) throw err;
        logger.info(`New user registered: ${email}`);
        res.status(201).json({ token, message: "User registered successfully!" });
      }
    );
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true  });
    
    if (!user) {
      logger.warn(`Login failed for ${email}: User not found or inactive`);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed for ${email}: Invalid password`);
      return res.status(400).json({ error: "Invalid credentials or user deactivated" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        isVerified: user.isVerified
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "3h" },
      (err, token) => {
        if (err) throw err;
        logger.info(`User logged in: ${user.email}`, { meta: { userId: user.id } });

        res.json({ token, message: "Logged in successfully" });
      }
    );
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).send("Server error");
  }
};



const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
        return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    logger.error(`Error fetching Me: ${err.message}`);
    res.status(500).send("Server Error");
  }
};

module.exports = { signup, login, getMe, checkUserUnique };