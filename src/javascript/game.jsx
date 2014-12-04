/**
 * @jsx React.DOM
 */

var React          = window.React = require('react')
var Song           = require('./components/song')
var HandBell       = require('./lib/Handbell')
var $              = require('jquery')
var Phoenix        = require('./vendor/phoenix')
var SongActions    = require('./actions/song')
var ComputerPlayer = require('./lib/computer_player')
var getNoteUrl     = require('./util/getNoteUrl')
var audioContext   = require('./lib/audioContext')

var Game = function(container) {
  this.container = container
  this.cacheDom()
  this.data = this.$lobby.data()
  this.computerPlayer = new ComputerPlayer()
  this.userToken = Math.random().toString(36).substr(2)
  this.gameLeader = false
  this.attachSong()
  this.connect()
}

Game.prototype = {
  attachSong: function() {
    React.renderComponent(<Song bpm={this.data.song.bpm} notes={this.data.song.notes} playerNotes={this.data.song.roles} bell={ this.bell } />, this.container)
  },

  connect: function() {
    var socket = new Phoenix.Socket('ws://' + location.host + '/ws')
    socket.join('room', this.data.id.toString(), {}, this.setup.bind(this))
  },

  cacheDom: function() {
    this.$lobby         = $('#game-lobby')
    this.$noteSelection = $('#noteSelection')
    this.$readyButton   = $('#ready-button')
    this.$startButton   = $('#start-game')
    this.$game          = $('#game')
    this.$usersPresent  = $('#users-present')
    this.$usersReady    = $('#users-ready')
  },

  start: function(e) {
    if (this.$startButton.not(':disabled')) {
      e.preventDefault()
      this.chan.send('game:start', {})
    }
  },

  pong: function(message) {
    this.chan.send('game:pong', {ping_time: message.ping_time})
  },

  setup: function(chan) {
    this.chan = chan
    this.$readyButton.click(this.announceReady.bind(this))
    this.$startButton.click(this.start.bind(this))
    this.chan.send("user:joined", {user_token: this.userToken})
    this.chan.on("room:update", this.renderRoomInfo.bind(this))
    this.chan.on('game:ping', this.pong.bind(this))
    this.chan.on("game:started", this.renderGame.bind(this))
  },

  announceReady: function(e) {
    e.preventDefault()
    // Initialize bell with touch
    this.handBell.initialize()
    this.handBell.sound.play()
    this.$readyButton.hide()
    this.$startButton.show()
    this.chan.send('user:ready', {})
  },

  renderGame: function(message) {
    // var unassignedNotes = this.data.song.roles.slice(this.ready)
    // this.computerPlayer.initialize(this.data.song, unassignedNotes)

    this.$lobby.hide()
    this.$game.show()

    console.log(message.start_delays)

    var playerIndex = message.user_tokens.indexOf(this.userToken)
    var startDelay  = message.start_delays[playerIndex]

    setTimeout(function(){SongActions.play(playerIndex)}, startDelay)

    if (this.gameLeader && this.ready < this.data.song.roles.length) {
      // this.computerPlayer.play()
    }
  },

  renderRoomInfo: function(message) {
    // any time a user joins or leaves you get this message
    var present     = message.users_present
    var userTokens  = message.user_tokens
    this.ready      = message.users_ready
    this.gameLeader = userTokens[0] == this.userToken

    if (this.gameLeader) {
      this.$startButton.text('Start the Song!')
    } else {
      this.$startButton.text('Please Wait')
    }

    if (present == this.ready && this.gameLeader) {
      this.$startButton.removeAttr('disabled')
    }

    // TODO: This should be a react view probably
    if(!this.handBell) {
        var note = this.data.song.roles[userTokens.indexOf(this.userToken)].toLowerCase()
        this.handBell = new HandBell(getNoteUrl(note), audioContext)
        this.$game.on('click', this.handBell.ding.bind(this.handBell))
        this.$noteSelection.val(note);
    }

    this.$usersPresent.html(present)
    this.$usersReady.html(this.ready)
  }
}

module.exports = Game
