const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
const OpenAIAPI = require('openai');
require('dotenv').config();

const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});

const openai = new OpenAIAPI({ key: process.env.OPENAI_API_KEY });

// Function to process and format the OpenAI response
function processOpenAIResponse(response) {
  return response.map((item) => {
    const textValue = item.text.value
      .replace(/\[{"type":"text","text":{"value":"/g, '')
      .replace(/"}}]/g, '')
      .replace(/[\[\]!]/g, '')    // Remove !, [, and ] characters
      .replace(/\(/g, ' ');       // Replace ( with a space

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: textValue.replace(/\n\n/g, '\n \n'), // Replace for double new line
      },
    };
  });
}

// Asynchronously process 'app_mention' events
async function processAppMention(event, client) {
  const messageText = event.text;
  const channelId = event.channel;

  console.log(`Message text: ${messageText}, Channel ID: ${channelId}`); // Log message details

  try {
    await client.reactions.add({
      channel: channelId,
      timestamp: event.ts,
      name: 'dungeonmaster',
    });

    const thinkingMessage = await client.chat.postMessage({
      channel: channelId,
      text: 'Slack Dungeon Master is thinking...',
    });

    const threadId = 'thread_jAZVtIe91krqfMyVARU0LTlh';
    const assistantId = 'asst_xeYSuCjC4HPkeWu6ac8fsAqN';

    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);

      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: messageText,
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant.id,
        instructions: 'Please generate images with some prompt I want it to be structured so that we put ![image](url of image)',
      });

      await new Promise((resolve) => setTimeout(resolve, 30000));

      const messagesResponse = await openai.beta.threads.messages.list(threadId);
      const messages = messagesResponse.body.data;
      const assistantMessage = messages.find((message) => message.role === 'assistant');

      if (assistantMessage) {
        const assistantResponseContent = assistantMessage.content;
        await client.chat.postMessage({
          channel: channelId,
          text: 'Here is the response from ChatGPT:',
          blocks: processOpenAIResponse(assistantResponseContent),
        });

        await client.reactions.add({
          channel: channelId,
          timestamp: thinkingMessage.ts,
          name: 'dndemoji',
        });

        await client.chat.delete({
          channel: channelId,
          ts: thinkingMessage.ts,
        });
      } else {
        console.error('Assistant response not found in the messages');
      }
    } catch (error) {
      console.error('Error sending to ChatGPT:', error);
    }
  } catch (error) {
    console.error('Error in handling app_mention:', error);
  }
}

// Enhanced Event handler for 'app_mention'
app.event('app_mention', async ({ event, client }) => {
  console.log('Received an app_mention event', event); // Log the received event

  // Start the processing in a non-blocking way
  processAppMention(event, client).catch(error => {
    console.error('Error in async app_mention processing:', error);
  });
});

// Start the Bolt app
const startApp = async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
};

// Export the function to start the app
module.exports = {
  startApp,
};
