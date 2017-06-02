var socket = io('https://webrtcttcn.herokuapp.com/');

socket.on('DANH_SACH_ONLINE', function (arrUserInfo) {
    arrUserInfo.forEach(function (user) {
        var { ten, peerId } = user;
         $('#ulUser').append(`<li id="${peerId}">${ten}</li>`);
    });

      socket.on('CO_NGUOI_DUNG_MOI', function (user) {
        var { ten, peerId } = user;
       $('#ulUser').append(`<li id="${peerId}">${ten}</li>`);
    });
    
    socket.on('AI_DO_NGAT_KET_NOI',function(peerId){
        $(`#${peerId}`).remove();
    });
})

socket.on('DANG_KY_THAT_BAI',function(){
    alert("Vui lòng đăng ký tên khác");
});


function openStream() {
    var config = { audio: true, video: true };
    return navigator.mediaDevices.getUserMedia(config);
}

function playVideo(idVideoTag, stream) {
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}

// This object will take in an array of XirSys STUN / TURN servers
// and override the original config object
var customConfig;
  
// Call XirSys ICE servers
$.ajax({
  url: "https://service.xirsys.com/ice",
  data: {
    ident: "buichuongvnua",
    secret: "be6ed77a-4697-11e7-aa0a-cd48826a7976",
    domain: "buichuongvnua.github.io",
    application: "default",
    room: "default",
    secure: 1
  },
  success: function (data, status) {
    // data.d is where the iceServers object lives
    customConfig = data.d;
    console.log(customConfig);
  },
  async: false
});
  

var peer = new Peer({ key:'peerjs',host:'webrtcserverpeerjs.herokuapp.com',secure:true,port:443,config:customConfig});

peer.on('open', function (id) {
    $('#myPeer').append(id);
    $('#btnSignup').click(function () {
        var username = $('#txtUsername').val();
       
    })
});

//Call
$('#btnCall').click(function () {
    const id = $('#remoteId').val();
    openStream()
        .then(stream => {
            playVideo('my-video', stream);
            var call = peer.call(id, stream);
            call.on('stream', remoteStream => playVideo('their-video', remoteStream));
        })
});

peer.on('call', function (call) {
    openStream()
        .then(function (stream) {
            call.answer(stream);
            playVideo('my-video', stream);
            call.on('stream', remoteStream => playVideo('their-video', remoteStream));
        })
})

$('#ulUser').on('click','li',function(){
   var id = $(this).attr('id');
    openStream()
        .then(stream => {
           
            playVideo('my-video', stream);
            var call = peer.call(id, stream);
            call.on('stream', remoteStream => playVideo('their-video', remoteStream));
        })
})

