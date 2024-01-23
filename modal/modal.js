const { App } = require('@slack/bolt');

function setupModals(app) {
  app.command('/game', async ({ ack, body, client }) => {
    await ack();

    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'your_modal_1',
          title: {
            type: 'plain_text',
            text: 'Begin New Campaign',
            emoji: true,
          },
          submit: {
            type: "plain_text",
            text: "Submit",
            emoji: true
          },
          close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
          },
          blocks: [
            {
              type: "divider",
              block_id: "divider-block"
            },
            {
              type: "section",
              block_id: "intro-section",
              text: {
                type: "mrkdwn",
                text: "Greetings, adventurers ⚔️, and welcome to the realm of D&D :Dndemoji: within Slack :slack! To commence our epic journey, I need the following details:"
              }
            },
            {
              type: "image",
              image_url: "https://i.ibb.co/NKCcM1r/Screenshot-2023-11-0-4-at-10-46-34.png",
              alt_text: "inspiration",
              block_id: "image-block"
            },
            {
              type: "section",
              block_id: "intro-section-2",
              text: {
                type: "mrkdwn",
                text: "Once you've shared these details, we shall embark on a quest forged by your choices and the whims of the dice. Prepare yourselves for an extraordinary adventure!"
              }
            },
            {
              type: "divider",
              block_id: "divider-block-2"
            },
            {
              type: "input",
              element: {
                type: "multi_users_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select users",
                  emoji: true
                },
                action_id: "multi_users_select-action"
              },
              label: {
                type: "plain_text",
                text: " 🧙‍♂️ How many valiant heroes will partake in this grand adventure?",
                emoji: true
              },
              block_id: "multi-users-select-input"
            },
            {
              type: "input",
              element: {
                type: "multi_static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select options",
                  emoji: true
                },
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "*Barbarian*",
                      emoji: true
                    },
                    value: "barbarian"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Bard*",
                      emoji: true
                    },
                    value: "bard"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Cleric*",
                      emoji: true
                    },
                    value: "cleric"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Druid*",
                      emoji: true
                    },
                    value: "druid"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Fighter*",
                      emoji: true
                    },
                    value: "fighter"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Monk*",
                      emoji: true
                    },
                    value: "monk"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Paladin*",
                      emoji: true
                    },
                    value: "paladin"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Ranger*",
                      emoji: true
                    },
                    value: "ranger"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Rogue*",
                      emoji: true
                    },
                    value: "rogue"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Sorcerer*",
                      emoji: true
                    },
                    value: "sorcerer"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Warlock*",
                      emoji: true
                    },
                    value: "warlock"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Wizard*",
                      emoji: true
                    },
                    value: "wizard"
                  }
                ],
                action_id: "character_class_select-action"
              },
              label: {
                type: "plain_text",
                text: ":dndclass: Do you want any specific classes?",
                emoji: true
              },
              block_id: "character-class-select-input"
            },
            {
              type: "input",
              element: {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select options",
                  emoji: true
                },
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "*Classic Fantasy*",
                      emoji: true
                    },
                    value: "classic_fantasy"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Sci-fi*",
                      emoji: true
                    },
                    value: "sci-fi"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "*Steampunk*",
                      emoji: true
                    },
                    value: "steampunk"
                  }
                ],
                action_id: "campaign_genre_select-action"
              },
              label: {
                type: "plain_text",
                text: "🌄 Select a genre for our campaign (e.g., classic fantasy, sci-fi, steampunk)",
                emoji: true
              },
              block_id: "campaign-genre-select-input"
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  });
}

module.exports = {
  setupModals,
};
