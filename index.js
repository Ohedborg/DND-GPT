require("dotenv").config();

// Import your modal definition module
const modals = require('/Users/ohedborg/Desktop/D&D/modal/modal.js');
// Import your modal handling logic module
const modalsSubmission = require('/Users/ohedborg/Desktop/D&D/modal/handle_button_modal.js');
// Import gpt
const eventOpenAI = require('/Users/ohedborg/Desktop/D&D/OpenAI/openaiEventListener.js');

const { App } = require("@slack/bolt");

// Set up the app with all required tokens (living in an external hidden file called .env)
const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  signingSecret: process.env.SIGNING_SECRET,
  socketMode: true,
});

// Call the correct function from the modal definition module
modals.setupModals(app); // Set up modal definition

// Handle Modal Submission
modalsSubmission.handleModalSubmission(app); // Set up modal definition

// generate the images from event
eventOpenAI.startApp(app); // Corrected: Removed the app parameter

(async () => {
    await app.start();
    console.log('⚡️ Bolt app started');
})();
