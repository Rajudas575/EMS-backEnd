import Category from "../models/category.model.js";

export const getCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    
    return res.json({ status: true, result: categories });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error,
    });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { category } = req.body;

    // create document
    const newCategory = new Category({ category });

    // save to DB
    await newCategory.save();

    return res.json({
      status: true,
      message: "Category added successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      message: "Failed to add category",
    });
  }
};
