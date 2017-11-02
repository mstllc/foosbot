const WebClient = require('@slack/client').WebClient

// Get Slack OAuth token from env variable or die (gotta have it)
const token = process.env.FOOSBOT_SLACK_API_TOKEN
if (!token || token === '') {
  console.log('Missing required env variable FOOSBOT_SLACK_API_TOKEN')
  process.exit(1)
}

// Export the Slack client instance as a "singleton"
module.exports = new WebClient(token)
