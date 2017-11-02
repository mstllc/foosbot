const express = require('express')

const GameService = require('../../services/game')

const router = express.Router()

router.post('/foos', async (request, response) => {
  // Pass request data and try to start a new game
  GameService.startNewGame(request.body)

  response.status(200).end()
})

module.exports = router
