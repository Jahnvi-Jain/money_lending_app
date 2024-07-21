const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Utility function to calculate age
const calculateAge = (dob) => {
  const diff = Date.now() - dob.getTime();
  const age = new Date(diff);
  return Math.abs(age.getUTCFullYear() - 1970);
};

// POST /signup
router.post('/signup', async (req, res) => {
  const { phone, email, name, dob, monthlySalary, password } = req.body;

  // Calculate user age
  const age = calculateAge(new Date(dob));

  // Validate age and salary
  if (age <= 20) {
    return res.status(400).json({ message: 'User must be above 20 years of age.' });
  }
  if (monthlySalary < 25000) {
    return res.status(400).json({ message: 'Monthly salary must be 25k or more.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      phone,
      email,
      name,
      dob,
      monthlySalary,
      password: hashedPassword,
      status: 'approved', // Approve user after validation
      purchasePower: monthlySalary * 2 // Example initial purchase power
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error });
  }
});

// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }
  
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }
  
      // Generate JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ message: 'Login successful.', token });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error });
    }
  });  

module.exports = router;
