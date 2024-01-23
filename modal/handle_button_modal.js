const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
const OpenAIAPI = require('openai');

const openai = new OpenAIAPI({ key: process.env.OPENAI_API_KEY });

// Function to process and format the OpenAI response
function processOpenAIResponse(response, selectedUserIDs) {
  return response.map(item => {
    const textValue = item.text.value.replace(/\[{"type":"text","text":{"value":"/g, '').replace(/"}}]/g, '');

    // Replace user IDs with Slack mentions
    const textWithMentions = textValue.replace(/<@(.*?)>/g, (match, userId) => {
      if (selectedUserIDs.includes(userId)) {
        return `<@${userId}>`;
      }
      return match;
    });

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: textWithMentions.replace(/\n\n/g, '\n \n'), // Replace for double new line
      },
    };
  });
}

// Function to make a request to the OpenAI API
async function generateCampaignDetails(selectedUserIDs, selectedClasses, selectedGenre, channelId) {
  // Create a new WebClient instance using the bot token
  const web = new WebClient(process.env.BOT_TOKEN);

  try {
    // Send a message from the assistant to the thread
    await web.chat.postMessage({
      channel: channelId,
      text: "I'm here to help you create a DND campaign! Please wait while I generate the details.",
    });

    // Retrieve the assistant's details
    const assistant = await openai.beta.assistants.retrieve("asst_j8g8ChX9nrdy1Sd6jaI2nJjy");

    // Create a new thread
    const thread = await openai.beta.threads.create();

    // Add a message to the thread
    const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: `Begin my campaign - please generate characters for these users: Sam &  Jennifer. I also want you to generate the following classes : rogue and cleric. Please distribute the points, spells and provide their inventory etc. I want the story to be predominantly in this 
        theme: fantasy. Please start by giving me the characters, generate names for them, background and all the rests. Make sure you break this up so it's easy to read in the text. After you've done that Please begin the campaign by giving and introduction to the world, give a bit of background of the world and finally talk about where the players begin`,
      }
    );

    // Run the thread
    const run = await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: assistant.id,
        instructions: "please generate images where applicable"
      }
    );

    console.log(thread);
    console.log(run);

    // Retrieve messages from the OpenAI API thread
    const messagesResponse = await openai.beta.threads.messages.list("thread_Q0rD2ZG8hMoRKSKdffgkcnkg");

    // Log the entire OpenAI API response for debugging
    console.log('OpenAI API Response:', messagesResponse.body);

    // Extract messages from the OpenAI API thread
    const messages = messagesResponse.body.data;

    // Find the assistant's response
    const assistantMessage = messages.find(message => message.role === 'assistant');

    // Check if assistantMessage is defined before using it
    if (assistantMessage) {
      // Extract the content from the assistant's response
      const assistantResponseContent = assistantMessage.content;

      // Process and format the OpenAI response
      const formattedAssistantResponse = processOpenAIResponse(assistantResponseContent, selectedUserIDs);

      // Send the formatted response to the Slack channel
      if (channelId) {
        try {
          // Debugging: Print channelId
          console.log('Channel ID:', channelId);

          // Send the formatted assistant's response to the Slack channel
          await web.chat.postMessage({
            channel: channelId,
            blocks: formattedAssistantResponse,
          });
        } catch (postMessageError) {
          console.error('Error posting assistant response:', postMessageError);
        }
      } else {
        console.error('Error: channelId is not valid.');
      }
    } else {
      console.error('Assistant response not found in the messages');
    }

  } catch (error) {
    console.error('Error generating campaign details:', error);
  }
}

async function handleModalSubmission() {
  const app = new App({
    token: process.env.BOT_TOKEN,
    appToken: process.env.APP_TOKEN,
    signingSecret: process.env.SIGNING_SECRET,
    socketMode: true,
  });

  // Handle submission of the modal form
  app.view('your_modal_1', async ({ ack, body, view }) => {
    try {
      await ack(); // Acknowledge the view submission

      // Extract user input from the submitted modal
      const multiUsersInput = view.state.values['multi-users-select-input'];
      const selectedUserIDs = multiUsersInput && multiUsersInput['multi_users_select-action']
        ? multiUsersInput['multi_users_select-action'].selected_users
        : null;

      // Debugging: Print selectedUserIDs
      console.log('Selected User IDs:', selectedUserIDs);

      // Extract class selections
      const classInput = view.state.values['class-select-input'];
      const selectedClasses = classInput && classInput['class-select-action']
        ? classInput['class-select-action'].selected_options.map(option => option.value)
        : [];

      // Debugging: Print selectedClasses
      console.log('Selected Classes:', selectedClasses);

      // Extract genre selection
      const genreInput = view.state.values['genre-select-input'];
      const selectedGenre = genreInput && genreInput['genre-select-action']
        ? genreInput['genre-select-action'].selected_option.value
        : '';

      // Debugging: Print selectedGenre
      console.log('Selected Genre:', selectedGenre);

      // Generate a random channel name
      const randomChannelName = `dnd-campaign-${Math.floor(Math.random() * 10000)}`;

      // Create a private channel
      const web = new WebClient(process.env.BOT_TOKEN);
      let channelId;

      try {
        const createChannelResult = await web.conversations.create({
          name: randomChannelName,
          is_private: true,
        });

        channelId = createChannelResult.channel.id;

        // Debugging: Print createChannelResult
        console.log('Create Channel Result:', createChannelResult);
        console.log('Channel ID:', channelId); // Debugging: Print channelId
      } catch (channelError) {
        console.error('Error creating a channel:', channelError);
        // Handle the error appropriately, e.g., by returning or throwing the error
        return;
      }

      // Invite members to the channel using selected User IDs
      if (channelId && selectedUserIDs) {
        try {
          await web.conversations.invite({
            channel: channelId,
            users: selectedUserIDs.join(','), // Convert array to comma-separated string
          });
        } catch (inviteError) {
          console.error('Error inviting members to the channel:', inviteError);
        }
      }

      // Generate campaign details using OpenAI API
      await generateCampaignDetails(selectedUserIDs, selectedClasses, selectedGenre, channelId);

      // Continue with the rest of your logic...
    } catch (error) {
      console.error('Error handling modal submission:', error);
    }
  });

  (async () => {
    await app.start();
    console.log('App is running with Slack Socket Mode!');
  })();
}

module.exports = {
  handleModalSubmission,
};
