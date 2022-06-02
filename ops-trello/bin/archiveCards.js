#!/usr/bin/env node
require('dotenv').config()

const Promise = require('bluebird')
const fetch = require('cross-fetch')
const moment = require('moment')
const yargs = require('yargs')

const { board, dryRun } = yargs
  .option('board', { string: true, demandOption: true, description: 'https://trello.com/b/[ board ]/…' })
  .option('dry-run', { boolean: true, default: true })
  .argv

// https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/
const TRELLO_ENDPOINT = 'https://api.trello.com/1'

const {
  TRELLO_APP_KEY,
  TRELLO_AUTH_TOKEN
} = process.env

const isNotTemplate = (card) => !card.isTemplate
const isNotOnList = (idLIst) => (card) => card.idList !== idLIst
const isOlderThan = (than) => (card) =>
  moment(card.due || card.dateLastActivity) < than

const run = async () => {
  const cards = await fetch(
    `${TRELLO_ENDPOINT}/boards/${board}/cards?filter=open&key=${TRELLO_APP_KEY}&token=${TRELLO_AUTH_TOKEN}`,
    { method: 'GET' },
  )
    .then((res) => {
      if (!res.ok) {
        throw Error(res.status)
      }

      return res.json()
    })
    .catch(e => {
      console.warn(e)
      return []
    })
    .then(cards => {
      return cards
        .filter(isNotTemplate)
        .filter(isNotOnList('5bee8e757e178a5c7fffacb5')) // "Vorlage / Ideen"
        .filter(isOlderThan(moment().subtract(2, 'months')))
    })

  console.log({ cards: cards.length })

  await Promise.mapSeries(
    cards,
    async (card) => {
      if (dryRun) {
        console.log(
          '(dry run, would archive)',
          card.id,
          card.shortUrl,
          card.due || card.dateLastActivity,
          card.name,
        )

        return
      }

      // Trello refers to archiving assets as "closing".
      await fetch(
        `${TRELLO_ENDPOINT}/cards/${card.id}?closed=true&key=${TRELLO_APP_KEY}&token=${TRELLO_AUTH_TOKEN}`,
        { method: 'PUT' },
      )
        .catch((e) => {
          console.log(
            'Error while fetching',
            card.id,
            card.shortUrl,
            card.due || card.dateLastActivity,
            card.name,
          )

          throw e
        })
        .then((res) => {
          if (!res.ok) {
            console.log(
              'Error from Trello',
              card.id,
              card.shortUrl,
              card.due || card.dateLastActivity,
              card.name,
            )

            throw Error(res.status)
          }

          console.log(
            card.id,
            card.shortUrl,
            card.due || card.dateLastActivity,
            card.name,
          )
      })
    },
  )
    .catch(console.error)
    .finally(() => { console.log('Done.') })
}

run()
