
const bcrypt = require('bcryptjs');

const dbHash = "$2b$10$FZU1UK8qgRZKS7wpAaw37OK92DDLbm/dtkCC1q4DE0jFPzu/Lvmvm";
const pass = "123456";

console.log("Checking db.json Password...");
const match = bcrypt.compareSync(pass, dbHash);
console.log(`Student (123456) vs db.json hash: ${match ? "MATCH" : "MISMATCH"}`);
