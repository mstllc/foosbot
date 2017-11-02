const bot = require('../bot')

let currentGame = null
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

exports.startNewGame = async ({ user_id, channel_id }) => {
  if (!currentGame) {
    try {
      let attachments = [...defaultAttachments]
      attachments.unshift({
        text: `<@${user_id}> is in!`
      })

      let response = await bot.chat.postMessage(
        global.channelId,
        defaultText,
        { attachments }
      )

      if (response && response.ok) {
        currentGame = {
          message_ts: response.ts,
          createdBy: user_id,
          ins: new Set([ user_id ]),
          outs: new Set()
        }
      }
    } catch (error) {
      console.log('Error posting new game message', error)
    }
  } else {
    bot.chat.postEphemeral(
      channel_id,
      `Looks like <@${currentGame.createdBy}> is already organizing a game! Check out <#${global.channelId}|foosball> to join.`,
      user_id
    )
  }
}

exports.respondToNewGame = async ({ actions, user, channel }) => {
  if (!currentGame) {
    bot.chat.postEphemeral(
      channel.id,
      'Hmmm, currently there is not a game being organized. Start one with the `/foos` command!',
      user.id
    )

    return false
  }

  let playerIn = (actions[0].value === 'in')
  if (playerIn) {
    currentGame.ins.add(user.id)
    currentGame.outs.delete(user.id)
  } else {
    if (user.id === currentGame.createdBy) {
      bot.chat.update(
        currentGame.message_ts,
        global.channelId,
        `<@${currentGame.createdBy}> bailed on the game while organizing it. Super lame.`,
        { attachments: [] }
      )
      currentGame = null

      return false
    }

    currentGame.outs.add(user.id)
    currentGame.ins.delete(user.id)
  }

  let attachments = [...defaultAttachments]
  if (currentGame.ins.size < 4) {
    attachments[0].text = `Looking for ${4 - currentGame.ins.size} more to join the game, you in?`
    attachments.unshift({
      text: [...currentGame.ins].map(user_id => `<@${user_id}> is in!`).join('\n')
    })
  } else {
    attachments = [
      { text: [...currentGame.ins].map(user_id => `<@${user_id}> is in!`).join('\n') },
      { text: 'That\'ll be your foursome, enjoy the game!' }
    ]
  }

  bot.chat.update(
    currentGame.message_ts,
    global.channelId,
    defaultText,
    { attachments }
  )
}
