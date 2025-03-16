const mongoose = require('mongoose');

const dealerconfigSchema = new mongoose.Schema({
  dealerserverId: String,
  dealerchannelId: String,
});

const dealerconfig = mongoose.model('dealerconfig', dealerconfigSchema);

module.exports = dealerconfig;