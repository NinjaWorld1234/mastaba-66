
const bcrypt = require('bcryptjs');

const studentHash = "$2b$10$y/q7wv5y.12NwCDThEszCOiZsC0GPmYtn4lj2wp.GdQvuILPdAIHW";
const adminHash = "$2b$10$bpHXq0QJ6if.yxcT4MONbe3g3bGH2PUiBlbDu.Z3SML6HMSLtfON2";

const studentPass = "123456";
const adminPass = "admin123";

console.log("Checking Student Password...");
const studentMatch = bcrypt.compareSync(studentPass, studentHash);
console.log(`Student (123456): ${studentMatch ? "MATCH" : "MISMATCH"}`);

console.log("Checking Admin Password...");
const adminMatch = bcrypt.compareSync(adminPass, adminHash);
console.log(`Admin (admin123): ${adminMatch ? "MATCH" : "MISMATCH"}`);
