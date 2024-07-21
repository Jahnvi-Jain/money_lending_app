const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

// GET /user
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      purchasePower: user.purchasePower,
      phone: user.phone,
      email: user.email,
      registrationDate: user.registrationDate,
      dob: user.dob,
      monthlySalary: user.monthlySalary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error });
  }
});

// POST /borrow
router.post('/borrow', auth, async (req, res) => {
    const { amount } = req.body;
  
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }
  
    try {
      const user = await User.findById(req.user);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Calculate updated purchase power
      const updatedPurchasePower = user.purchasePower + amount;
  
      // Calculate repayment details
      const interestRate = 0.08;
      const tenureMonths = 12; // Example tenure of 12 months
      const monthlyRepayment = (amount * (1 + interestRate)) / tenureMonths;
  
      user.purchasePower = updatedPurchasePower;
      await user.save();
  
      res.json({
        updatedPurchasePower,
        monthlyRepayment
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error });
    }
  });
  

module.exports = router;
