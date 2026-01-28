/**
 * @file seedController.js
 * @description Controller for populating the database with robust demo data.
 * Generates 50+ diverse items assigned to the first found Admin user.
 */

const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @desc    Wipe database and seed with comprehensive demo data
 * @route   POST /api/inventory/seed
 * @access  Private
 */
exports.seedData = async (req, res) => {
  try {
    // 1. Identify Admin User (Assigns data to this user)
    const adminUser = await User.findOne();
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "No user found. Please Register/Login first." });
    }

    // 2. Clear existing data to prevent duplicates during testing
    await Product.deleteMany({});

    // 3. Define Categories and Templates for Random Generation
    const categories = ['Electronics', 'Laptops', 'Audio', 'Accessories', 'Monitors', 'Networking', 'Servers', 'Furniture'];
    const demoProducts = [];

    // 4. Generate 50 Realistic Items
    for (let i = 1; i <= 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Smart Naming Logic based on Category
      let name = `Generic ${category} Item ${i}`;
      let price = Math.floor(Math.random() * 200) + 20;

      if (category === 'Laptops') {
        name = `ProBook Gen${Math.floor(Math.random() * 5) + 1} - ${i}`;
        price = Math.floor(Math.random() * 1500) + 800;
      } else if (category === 'Servers') {
        name = `RackServer X${Math.floor(Math.random() * 900)} - Node ${i}`;
        price = Math.floor(Math.random() * 5000) + 2000;
      } else if (category === 'Audio') {
        name = `Studio Headphones MK${i}`;
        price = Math.floor(Math.random() * 300) + 100;
      } else if (category === 'Networking') {
        name = `Gigabit Switch 24-Port v${i}`;
        price = Math.floor(Math.random() * 600) + 150;
      }

      demoProducts.push({
        user: adminUser._id,
        name: name,
        category: category,
        price: price,
        quantity: Math.floor(Math.random() * 100), // Random stock 0-100
        sku: `DEMO-${category.substring(0, 3).toUpperCase()}-${1000 + i}`,
        description: `High-quality ${category.toLowerCase()} unit used for demonstration purposes. Features standard specifications.`,
        source: 'demo' // Tagging as demo data for the dashboard
      });
    }

    // 5. Insert Data in Bulk
    await Product.insertMany(demoProducts);

    console.log(`✅ Seeded ${demoProducts.length} products for user: ${adminUser.name}`);
    res.status(200).json({ 
      success: true, 
      message: `Successfully seeded ${demoProducts.length} demo products.` 
    });

  } catch (error) {
    console.error("❌ Seed Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};