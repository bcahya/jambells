var socket = new Phoenix.Socket("ws://" + location.host + "/ws");
var audioContext = new AudioContext()

socket.join("room", $("#room-info").data("id").toString(), {}, function(chan){
  chan.on("room:update", function(message){
    $("#users-present").html(message.users_present)
    $("#users-ready").html(message.users_ready)
  });

  $("#ready-button").click(function(e) {
    e.preventDefault()
    $("#ready-button").hide()
    chan.send("user:ready", {})
  })

  chan.send("ping", {})

  chan.on("note:play", function(message) {
    var bell = new Bell(audioContext)
    bell.ring(message.note)
  })

  $('body').on('mousedown', function(){
    var $noteSelection = $('#noteSelection')
    var note = parseInt($noteSelection.val())
    chan.send("note:send", {note: note})
  })

  $('body').on('touchstart', function(){
    var $noteSelection = $('#noteSelection')
    var note = parseInt($noteSelection.val())
    chan.send("note:send", {note: note})
  })

});
