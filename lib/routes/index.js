const express = require('express')

const commands = require('./commands')
const GameService = require('../services/game')

const router = express.Router()

router.use('/commands', commands)
router.post('/actions', (request, response) => {
  // All interactive message actions hit this single route
  // payload is JSON encoded and contains the data for the action
  const payload = JSON.parse(request.body.payload)

  // So far there is only the one action anyone can take so handle that.
  // Potentially someday this will need to conditionally do something based on the action
  GameService.respondToNewGame(payload)

  response.status(200).end()
})

module.exports = router
