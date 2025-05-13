const { Schema, model } = require('mongoose');

const CompanySchema = new Schema({
  name: { type: String, required: true },
  description: String,
  industry: String,
  logo: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = model('Company', CompanySchema); 