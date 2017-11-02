const express = require('express')
const bodyParser = require('body-parser')

const bot = require('./lib/bot')
const routes = require('./lib/routes')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(routes)

async function run() {
  try {
    const { channels } = await bot.channels.list()
    const channel = channels.find(channel => channel.name === 'foosball')
    if (channel) {
      global.channelId = channel.id

      app.listen(3000, () => {
        console.log('Foosbot listening at 127.0.0.1:3000')
      })
    } else {
      console.log('Error', 'Cant find channel named `foosball`')
    }
  } catch (error) {
    console.log('Error getting `foosball` channel id', error)
  }
}

run()
