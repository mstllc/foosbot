const Moniker = require('moniker')

const bot = require('../bot')

// Team name generator
const teamNames = Moniker.generator([Moniker.adjective, Moniker.noun], {glue: ' '})
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    }
  )
}

// currentGame is just scoped, no DB
let currentGame = null

// Default text and attachments for new game message
// 2 buttons for responding IN or OUT to a game request
const defaultText = '<!channel> Let\'s play some foosball!'
const defaultAttachments = [
  {
    text: 'Looking for 3 more to join the game, you in?',
    fallback: 'You are unable to join the game, sorry.',
    callback_id: 'start_new_game',
    attachment_type: 'default',
    actions: [
      {
        name: 'response',
        text: 'YES, DUH',
        type: 'button',
        value: 'in'
      },
      {
        name: 'response',
        text: 'Can\'t Do It',
        style: 'danger',
        type: 'button',
        value: 'out'
      }
    ]
  }
]

// Function posts a message to foosball channel about organizing a game
// if there are no current games already being organized
exports.startNewGame = async ({ user_id, channel_id }) => {
  if (!currentGame) {
    try {
      // Add an attachment to the front of the list saying that the organizer is in
      let attachments = [...defaultAttachments]
      attachments.unshift({
        text: `<@${user_id}> is in!`
      })

      // Post the new game message to the foosball channel
      let response = await bot.chat.postMessage(
        global.FOOSBOT_CHANNEL_ID,
        defaultText,
        { attachments }
      )

      // If the message posted OK, save the new game in memory.
      // messageTs is used to update the message later
      if (response && response.ok) {
        currentGame = {
          messageTs: response.ts,
          createdBy: user_id,
          ins: new Set([ user_id ]),
          outs: new Set()
        }
      }
    } catch (error) {
      console.log('Error posting new game message', error)
    }
  } else {
    // There is already a currentGame, so send a response only to the user
    // who triggered this about that game in the foosball channel.
    bot.chat.postEphemeral(
      channel_id,
      `Looks like <@${currentGame.createdBy}> is already organizing a game! Check out <#${global.FOOSBOT_CHANNEL_ID}|${process.env.FOOSBOT_CHANNEL_NAME}> to join.`,
      user_id
    )
  }
}

// Method to handle user response to new game message
exports.respondToNewGame = async ({ actions, user, channel, message_ts }) => {
  if (!currentGame || message_ts !== currentGame.messageTs) {
    if (!currentGame) {
      // There is no current game, so send a response only to the user
      // who triggered this about starting one.
      bot.chat.postEphemeral(
        channel.id,
        'Hmmm, currently there is not a game being organized. Start one with the `/foos` command!',
        user.id
      )
    } else {
      // Somehow user clicked a button from an old game, so send a response
      // only to the user about that
      bot.chat.postEphemeral(
        channel.id,
        `Hmmm, that game has expired. Check <#${global.FOOSBOT_CHANNEL_ID}|${process.env.FOOSBOT_CHANNEL_NAME}> to see if another one is being organized or start a new one with the '/foos' command!`,
        user.id
      )
    }

    // Try to delete this message, not sure how they clicked on this button
    try {
      await bot.chat.delete( message_ts, channel.id )
    } catch (error) {
      console.log('Error deleting non-existant message', error)
    }

    return false
  }

  // Determine if the user responded IN or OUT
  let playerIn = (actions[0].value === 'in')

  if (!playerIn && user.id === currentGame.createdBy) {
    // User responded OUT and is the organizer, cancel the game and
    // update the message to reflect that bummer
    bot.chat.update(
      currentGame.messageTs,
      global.FOOSBOT_CHANNEL_ID,
      `<@${currentGame.createdBy}> bailed on the game while organizing it. Super lame.`,
      { attachments: [] }
    )
    currentGame = null

    return false
  }

  if (playerIn) {
    // Make sure this player isn't in the `outs` list, they responded IN
    currentGame.outs.delete(user.id)
  } else {
    currentGame.outs.add(user.id)
    currentGame.ins.delete(user.id)
  }

  // This hacky-ness is to prevent more than 4 people from every showing in the list
  if (currentGame.ins.size === 3) {
    currentGame.ins.add(user.id)
    // If this user will be the 4th, the game is ready. Post new message
    // with who's in and that it is good to go.
    if (currentGame.ins.size === 4) {
      let players = [...currentGame.ins].sort(() => Math.random() - 0.5)
      let black = players.slice(0, 2)
      let yellow = players.slice(2, 4)

      let attachments = [
        {
          color: '#090909',
          title: toTitleCase(teamNames.choose()),
          text: black.map(user_id => `<@${user_id}>`).join(' and '),
          footer: 'Starting Black'
        },
        {
          color: '#f2ae09',
          title: toTitleCase(teamNames.choose()),
          text: yellow.map(user_id => `<@${user_id}>`).join(' and '),
          footer: 'Starting Yellow'
        },
      ]

      // Delete the original message
      try {
        await bot.chat.delete( message_ts, channel.id )
      } catch (error) {
        console.log('Error deleting message', error)
      }

      // Post new message
      bot.chat.postMessage(
        global.FOOSBOT_CHANNEL_ID,
        '<!channel> We got a game of foos! Your teams are:',
        { attachments }
      )

      // Reset game to null so someone can organize another
      currentGame = null

      return true
    }
  } else if (currentGame.ins.size < 3) {
    currentGame.ins.add(user.id)
    // Still looking for more players, update the message with who's in and how many more are needed
    let attachments = [...defaultAttachments]
    attachments[0].text = `Looking for ${4 - currentGame.ins.size} more to join the game, you in?`
    attachments.unshift({
      text: [...currentGame.ins].map(user_id => `<@${user_id}> is in!`).join('\n')
    })
    bot.chat.update(
      currentGame.messageTs,
      global.FOOSBOT_CHANNEL_ID,
      defaultText,
      { attachments }
    )
  }
}
