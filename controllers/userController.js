const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModles');

// Controller for user signup
const signup = async (req, res) => {
    const { phoneNumber, firstName, lastName, city, password } = req.body;

    // Validate input
    if (!phoneNumber || !firstName || !lastName || !city || !password) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash the password
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = new User({
            phoneNumber,
            firstName,
            lastName,
            city,
            password: hashedPassword,
            role: req.body.role || 'user', // Optional: role can be passed during signup
        });

        await user.save();
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Error saving user', error });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, searchQuery = '' } = req.query;

    try {
        const query = {
            $or: [
                { firstName: { $regex: searchQuery, $options: 'i' } },
                { lastName: { $regex: searchQuery, $options: 'i' } },
                { contactNo: { $regex: searchQuery } },
                { city: { $regex: searchQuery, $options: 'i' } },
            ],
        };

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalUsers = await User.countDocuments(query);
        
        res.json({
            users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching users', error });
    }
};


// Get user by ID
const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching user', error });
    }
};

// Update user by ID
const updateUserById = async (req, res) => {
    const { id } = req.params;
    const { phoneNumber, firstName, lastName, city, password } = req.body;

    try {
        // Hash the new password if it's provided
        let hashedPassword;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                phoneNumber,
                firstName,
                lastName,
                city,
                ...(hashedPassword && { password: hashedPassword }), // Update password only if provided
            },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json({ msg: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ msg: 'Error updating user', error });
    }
};

// Delete user by ID
const deleteUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(200).json({ msg: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Error deleting user', error });
    }
};

// Controller for user login
const login = async (req, res) => {
    const { phoneNumber, password } = req.body;

    // Find the user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    res.json({ token });
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude password from response
        res.json(user);
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching user profile', error });
    }
};

const updateProfile = async (req, res) => {
    const { firstName, lastName, city, phoneNumber } = req.body;

    try {
        // Find the user by ID and update the profile details
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, // Use the authenticated user's ID
            {
                firstName,
                lastName,
                city,
                phoneNumber,
            },
            { new: true, select: '-password' } // Return the updated document excluding the password
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json({ msg: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ msg: 'Error updating profile', error });
    }
};

module.exports = {
    signup,
    login,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getProfile,
    updateProfile, // Add the updateProfile function here
};

