const User = require('../Models/Users.js');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../Middleware/emailsender.js');

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (req.body.password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }
    if (req.body.password.length > 20) {
      return res
        .status(400)
        .json({ message: 'Password must be at most 20 characters' });
    }
    if (req.body.phone.length < 11) {
      return res
        .status(400)
        .json({ message: 'Phone number must be at least 11 characters' });
    }

    if (req.body.phone.length > 11) {
      return res
        .status(400)
        .json({ message: 'Phone number must be at most 11 characters' });
    }

    if (/^[0-9]+$/.test(req.body.phone) === false) {
      return res.status(400).json({ message: 'Phone number must be a number' });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingphone = await User.findOne({ phone: req.body.phone });
    if (existingphone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: 'customer',
    });

    await newUser.save();

    //send email to user
    const subject = 'Welcome to Our Bank';
    const message = `Dear ${firstName} ${lastName},\n\nThank you for registering with our bank. We are excited to have you on board!\n\nBest regards,\nThe Bank Team`;
    await sendEmail(email, subject, message);
    res.status(201).json({
      message: 'User created successfully',
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    //generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    );
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEmailPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotificationsEnabled } = req.body;

    if (typeof emailNotificationsEnabled !== 'boolean') {
      return res.status(400).json({ message: 'Invalid email preference' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { emailNotificationsEnabled },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: 'Email preference updated successfully',
      emailNotificationsEnabled: updatedUser.emailNotificationsEnabled,
    });
  } catch (error) {
    console.error('Error updating email preference:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const setTransactionPin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pin } = req.body;

if (typeof pin !== 'string') {
  return res.status(400).json({
    message: 'PIN must be a string',
  });
}

if (pin.length !== 4) {
  return res.status(400).json({
    message: 'PIN must be exactly 4 digits',
  });
}

if (!/^[0-9]+$/.test(pin)) {
  return res.status(400).json({
    message: 'PIN must contain only numbers',
  });
}

    const hashedPin = await bcrypt.hash(pin, 10);

    const updatedUser = await User.findByIdAndUpdate(
  req.user.id,
  { transactionPin: hashedPin},
  { new: true, runValidators: true }
);

    return res.status(200).json({ message: 'Transaction PIN set successfully' });
  } catch (error) {
    console.error('Error setting PIN:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
module.exports = {
  createUser,
  loginUser,
  updateEmailPreference,
  setTransactionPin
};
