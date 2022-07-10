const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
  },
  img:
  {
      data: Buffer,
      contentType: String
  }
});

module.exports = mongoose.model('Image', imageSchema);