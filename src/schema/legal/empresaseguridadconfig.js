const mongoose = require('mongoose');

const empresaseguridadconfigSchema = new mongoose.Schema({
  empresaseguridadserverId: String,
  empresaseguridadchannelId: String,
});

const empresaseguridadconfig = mongoose.model('empresaseguridadconfig', empresaseguridadconfigSchema);

module.exports = empresaseguridadconfig;