const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
const axios = require('axios');

// Function to make a request to the OpenAI API
async function generateCampaignDetails(selectedUserIDs, selectedClasses, selectedGenre) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiApiEndpoint = 'https://api.openai.com/v1/completions';

  const params = {
    prompt: `You are the Dungeon Master guiding the players through the story. Create a DND campaign based on XP-leveling. Players: ${selectedUserIDs.join(', ')}. Classes: ${selectedClasses.join(', ')}. Set the story in a ${selectedGenre} setting. Generate backstories, assign races, distribute points, spells, equipment, and inventory. Whenver you use the UserID please put an "@" infront of it`,
    max_tokens: 1000,
    model: 'gpt-3.5-turbo-instruct', // Specify the model you want to use
  };

  try {
    const response = await axios.post(
      openaiApiEndpoint,
      params,
      { headers: { Authorization: `Bearer ${openaiApiKey}` } }
    );

    console.log('OpenAI API Response:', response.data);

    return response.data; // Return the entire OpenAI API response
  } catch (error) {
    console.error('Error in OpenAI API request:', error.message);
    console.error('Request payload:', error.config.data);
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);

    return 'Error generating campaign details.';
  }
}

async function handleModalSubmission() {
  const app = new App({
    token: process.env.BOT_TOKEN,
    appToken: process.env.APP_TOKEN,
    signingSecret: process.env.SIGNING_SECRET,
    socketMode: true,
  });

  // ...

  // Handle submission of the modal form
  app.view('your_modal_1', async ({ ack, body, view, client }) => {
    await ack(); // Acknowledge the view submission

    // Extract user input from the submitted modal
    const multiUsersInput = view.state.values['multi-users-select-input'];
    const selectedUserIDs =
      multiUsersInput && multiUsersInput['multi_users_select-action']
        ? multiUsersInput['multi_users_select-action'].selected_users
        : null;

    if (!selectedUserIDs) {
      console.error('Error: Selected User IDs are undefined or missing in the view state.');
      return;
    }

    // Debugging: Print selectedUserIDs
    console.log('Selected User IDs:', selectedUserIDs);

    // Extract class selections
    const classInput = view.state.values['class-select-input'];
    const selectedClasses =
      classInput && classInput['class-select-action']
        ? classInput['class-select-action'].selected_options.map(option => option.value)
        : [];

    // Debugging: Print selectedClasses
    console.log('Selected Classes:', selectedClasses);

    // Extract genre selection
    const genreInput = view.state.values['genre-select-input'];
    const selectedGenre =
      genreInput && genreInput['genre-select-action']
        ? genreInput['genre-select-action'].selected_option.value
        : '';

    // Debugging: Print selectedGenre
    console.log('Selected Genre:', selectedGenre);

    // Generate campaign details using OpenAI API
    const campaignDetails = await generateCampaignDetails(selectedUserIDs, selectedClasses, selectedGenre);

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
    } catch (channelError) {
      console.error('Error creating a channel:', channelError);
    }

    // Debugging: Print channelId
    console.log('Channel ID:', channelId);

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

    // Send the entire OpenAI API response to the channel with Slack-compatible line breaks
    if (channelId) {
      const rawText = campaignDetails.choices[0].text;

      // Add bold formatting to text before colons
      const formattedText = rawText.replace(/([^:\n]+):/g, '*$1:*');

      // Create mentions for selected users with "@" symbol
      const userMentions = selectedUserIDs.map(userId => `<@${userId}>`).join(' ');

      // Post the message to the channel
      const postMessageResult = await client.chat.postMessage({
        channel: channelId,
        text: `${userMentions}\n${formattedText}`, // Include user mentions before the formatted text
        parse: 'mrkdwn', // Enable markdown parsing for formatting
      });

      // Check if the message was successfully posted
      if (postMessageResult.ok) {
        // Add the :dungeonmaster: reaction to the message
        try {
          await client.reactions.add({
            channel: channelId,
            timestamp: postMessageResult.ts,
            name: 'dungeonmaster',
          });
        } catch (reactionError) {
          console.error('Error adding reaction to the message:', reactionError);
        }
      } else {
        console.error('Error posting message to the channel:', postMessageResult.error);
      }
    }
  });

  // ...

  (async () => {
    await app.start();
    console.log('App is running with Slack Socket Mode!');
  })();
}

module.exports = {
  handleModalSubmission,
};
