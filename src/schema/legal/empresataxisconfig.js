const mongoose = require('mongoose');

const empresataxisconfigSchema = new mongoose.Schema({
  empresataxisserverId: String,
  empresataxischannelId: String,
});

const empresataxisconfig = mongoose.model('empresataxisconfig', empresataxisconfigSchema);

module.exports = empresataxisconfig;