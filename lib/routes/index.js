const express = require('express')

const commands = require('./commands')
const GameService = require('../services/game')

const router = express.Router()

router.use('/commands', commands)
router.post('/actions', (request, response) => {
  const payload = JSON.parse(request.body.payload)

  GameService.respondToNewGame(payload)

  response.status(200).end()
})

module.exports = router
