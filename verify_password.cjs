const bcrypt = require('bcryptjs');

const ahmedHash = '$2b$10$y/q7wv5y.12NwCDThEszCOiZsC0GPmYtn4lj2wp.GdQvuILPdAIHW';
const adminHash = '$2b$10$FbAwjBoxeNl8UA3.UObhYepGUph49uQkq5OmKctMIFL1a2Y8z52de';

const ahmedPass = '123456';
const adminPass = 'admin123';

console.log('Checking Ahmed (123456):', bcrypt.compareSync(ahmedPass, ahmedHash));
console.log('Checking Admin (admin123):', bcrypt.compareSync(adminPass, adminHash));
