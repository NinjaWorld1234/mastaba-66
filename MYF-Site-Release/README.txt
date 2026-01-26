AL-MASTABA PLATFORM - PRODUCTION DEPLOYMENT
=============================================

This folder contains the production-ready build of the Al-Mastaba application.

PREREQUISITES:
--------------
1. Node.js (Version 18 or higher) installed on the server/machine.

INSTALLATION:
-------------
1. Open a terminal/command prompt in this folder.
2. Run the following command to install dependencies:
   npm install --production

RUNNING THE APP:
----------------
1. Start the server:
   npm start

   OR

   node server.cjs

2. The application will be available at: http://localhost:5000

FILES INCLUDED:
---------------
- dist/         : The compiled frontend static files.
- server/       : Backend server logic and API routes.
- server.cjs    : Main server entry point.
- db.json       : Database file.
- .env          : Environment configuration.

NOTES:
------
- Ensure the PORT in .env is open on your firewall if deploying to a VPS.
- You do NOT need to run 'npm run build' again; the 'dist' folder is already built.
