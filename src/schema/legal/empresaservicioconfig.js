const mongoose = require('mongoose');

const empresaservicioconfigSchema = new mongoose.Schema({
  servicioserverId: String,
  serviciochannelId: String,
});

const empresaservicioconfig = mongoose.model('empresaservicioconfig', empresaservicioconfigSchema);

module.exports = empresaservicioconfig;