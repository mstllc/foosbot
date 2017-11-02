const express = require('express')

const GameService = require('../../services/game')

const router = express.Router()

router.post('/foos', async (request, response) => {

  GameService.startNewGame(request.body)

  response.status(200).end()
})

module.exports = router
