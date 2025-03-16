const mongoose = require('mongoose');

const darknetconfiggSchema = new mongoose.Schema({
  darknetserverid: String,
  darknetchid: String,
});

const darknetconfig = mongoose.model('darknetconfig', darknetconfiggSchema);

module.exports = darknetconfig;