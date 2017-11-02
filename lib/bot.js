const WebClient = require('@slack/client').WebClient

const token = process.env.FOOSBOT_SLACK_API_TOKEN
if (!token || token === '') {
  console.log('Missing required env variable FOOSBOT_SLACK_API_TOKEN')
  process.exit(1)
}

const bot = new WebClient(token)

module.exports = bot
