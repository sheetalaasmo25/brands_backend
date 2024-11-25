const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModles');
const Brands = require('../models/brandsModels');
const Deal = require('../models/dealsModels');
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

    res.json({ token,msg:"Login Successfully",role:user.role });
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


// API to add a rating for a store (without comment)
const addRatingToBrand = async (req, res) => {
    const { brandId, rating } = req.body;  // Expect brandId and rating from the body

    if (!brandId || !rating) {
        return res.status(400).json({ msg: 'Brand ID and rating are required' });
    }

    const userId = req.user.id;  // Get user ID from the JWT token

    if (!userId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        // Find the brand by ID
        const brand = await Brands.findById(brandId);
        if (!brand) {
            return res.status(404).json({ msg: 'Brand not found' });
        }

        // Check if the user has already rated this brand
        const existingRating = brand.ratings.find(rating => rating.user.toString() === userId.toString());
        if (existingRating) {
            return res.status(400).json({ msg: 'You have already rated this brand' });
        }

        // Add the new rating to the brand
        brand.ratings.push({
            user: userId,
            rating,
        });

        // Save the updated brand document
        await brand.save();

        res.status(200).json({ msg: 'Rating added successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Error adding rating', error: error.message });
    }
};

// API to get all ratings of the logged-in user
const getUserRatings = async (req, res) => {
    const userId = req.user.id; // Get user ID from JWT token

    if (!userId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        // Find all brands where the user has provided a rating
        const brands = await Brands.find({ 'ratings.user': userId }).select('name ratings');
        
        // Extract ratings data from the brands
        const userRatings = brands.map(brand => {
            const rating = brand.ratings.find(rating => rating.user.toString() === userId.toString());
            return {
                brandName: brand.name,
                rating: rating.rating,
                brandId: brand._id,
            };
        });

        if (userRatings.length === 0) {
            return res.status(404).json({ msg: 'No ratings found for this user' });
        }

        res.status(200).json({ ratings: userRatings });
    } catch (error) {
        res.status(500).json({ msg: 'Error retrieving ratings', error: error.message });
    }
};

// Add deal to user's wishlist
const addToWishlist = async (req, res) => {
    const { dealId } = req.body;
    const userId = req.user.id; // Assuming JWT authentication for user

    try {
        // Ensure the deal exists
        const deal = await Deal.findById(dealId);
        if (!deal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        // Check if the user is already in the wishlistUsers array
        if (deal.wishlistUsers.includes(userId)) {
            return res.status(400).json({ msg: 'Deal already in wishlist' });
        }

        // Add the user to wishlistUsers
        deal.wishlistUsers.push(userId);

        // Update the 'isWishlist' field to true since the user has added the deal to their wishlist
        deal.isWishlist = true;

        // Save the deal with the updated wishlist
        await deal.save();

        res.status(200).json({
            msg: 'Deal added to wishlist',
            dealId,
            isWishlist: deal.isWishlist, // Return the updated wishlist status
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ msg: 'Error adding deal to wishlist', error });
    }
};






const removeFromWishlist = async (req, res) => {
    const { dealId } = req.body;
    const userId = req.user.id; // Assuming JWT authentication for user

    try {
        // Ensure the deal exists
        const deal = await Deal.findById(dealId);
        if (!deal) {
            return res.status(404).json({ msg: 'Deal not found' });
        }

        // Check if the user is in the wishlistUsers array
        if (!deal.wishlistUsers.includes(userId)) {
            return res.status(400).json({ msg: 'Deal not in wishlist' });
        }

        // Remove the user from the wishlistUsers array
        deal.wishlistUsers = deal.wishlistUsers.filter(id => !id.equals(userId));

        // Update the 'isWishlistNew' field to false since the user removed the deal from the wishlist
        if (deal.wishlistUsers.length === 0) {
            // If no users are left in the wishlist, set isWishlistNew to false
            deal.isWishlist = false;
        }

        // Save the deal with the updated wishlist
        await deal.save();

        res.status(200).json({
            msg: 'Deal removed from wishlist',
            dealId,
            isWishlist: deal.isWishlist, // Return the updated wishlist status
        });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ msg: 'Error removing deal from wishlist', error });
    }
};

const getOwnWishlistDeals = async (req, res) => {
    const userId = req.user.id; // Assuming JWT authentication for user

    try {
        // Fetch all deals where the user is in the wishlistUsers array
        const deals = await Deal.find({ wishlistUsers: userId })
            .populate('brands')
            .populate('store')
            .populate('category');

        if (deals.length === 0) {
            return res.status(404).json({ msg: 'No deals found in wishlist' });
        }

        // Send response with the list of deals
        res.status(200).json({
            msg: 'Wishlist deals fetched successfully',
            deals,
        });
    } catch (error) {
        console.error("Error fetching wishlist deals:", error);
        res.status(500).json({ msg: 'Error fetching wishlist deals', error });
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
    updateProfile,
    addRatingToBrand, 
    getUserRatings,
    addToWishlist,
    removeFromWishlist,
    getOwnWishlistDeals
};

