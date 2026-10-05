const Supplier = require ("../Models/Supplier");

//Create a supplier
const createSupplier = async (req, res) => {
    try{
        const supplier = await Supplier.create(req.body);

        return res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            data: supplier,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            messagge: error.message || "Unable to create supplier",
            data: null,
        });
    }
};

//Get a supplier by ID
const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
               success: false,
               message: "Supplier not found",
               data: null,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Supplier retrieved successfully",
            data: supplier,
        });
    } catch (error) {
        console.error("Get supplier by ID error:", error);

        return res.status(400).json({
            success: false,
            message: error.message,
            data: null,
        });
    }
};

//Get all suppliers
const getSuppliers = async (req, res) => {
    try{
        const suppliers = await Supplier.find();
        
        return res.status(200).json({
            success: true,
            message: "Suppliers retrieved successfully",
            data: suppliers,
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error.messagge || "Unable to retrieve suppliers",
            data: null,
        });
    }
};

//Update a supplier
const updateSupplier = async (req, res) => {
    try {
      const supplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
      );

      if (!supplier) {
        return res.status(404).json({
            success: false,
            message: "Supplier not found",
            data: null,
        });
      } 

      return res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
      });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Unable to update supplier",
            data: null,
        });

    }
};

// Delete a supplier
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
                data: null,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Supplier deleted successfully",
            data: supplier,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invali supplier ID",
            data: null,
        });
    }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};