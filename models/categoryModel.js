const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  subcategories: [{
    name:String
  }],
});
const categoryModel = mongoose.model('Category', categorySchema);

module.exports = categoryModel;
