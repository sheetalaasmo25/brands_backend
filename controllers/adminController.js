const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModels');

// Controller for admin signup
const adminSignup = async (req, res) => {
    const { username, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
        return res.status(400).json({ msg: 'Admin already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new admin user
    const admin = new Admin({
        username,
        password: hashedPassword,
    });

    try {
        await admin.save();
        res.status(201).json({ msg: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Error saving admin', error });
    }
};

// Controller for admin login
const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    // Find the admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    res.json({ token });
};

module.exports = {
    adminSignup,
    adminLogin,
};
