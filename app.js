$(document).ready(function () {
	const socket = io('https://webrtcttcn.herokuapp.com');

	// Getting references to page DOM for signalling.
	var peersEl = document.getElementById('peers'),
		loginEl = document.getElementById('login'),
		logOutEl = document.getElementById('log-out'),
		usernameEl = document.getElementById('username'),
		usernameLabelEl = document.getElementById('username-label'),
		messageEl = document.getElementById('message'),
		sendMessageEl = document.getElementById('sendMessage'),
		messagesEl = document.getElementById('messages'),
		chatBtn = document.getElementById('chat-btn'),
		msgHistory = document.getElementById('chatHistory'),
		hideColumnBtn = document.getElementById('hideColumn'),
		showColumnBtn = document.getElementById('showColumn');

	// Getting references to page DOM for video calling.
	var callPeerEl = document.getElementById('call-peer'),
		hangUpEl = document.getElementById('hang-up'),
		localVideoEl = document.getElementById('local-video'),
		remoteVideoEl = document.getElementById('remote-video'),
		// localFullScreenEl = document.getElementById('local-full-screen'),
		remoteFullScreenEl = document.getElementById('remote-full-screen'),
		peerInfoView = document.getElementById('remote-username'),
		videoMenu = document.getElementById('video-menu'),
		mainEndCall = peerInfoView.querySelectorAll('#hang-up')[0],
		remotePeerName = document.querySelectorAll('#remote-username .title-text')[0];


	//var peerSession;//peer whom you are chatting with.
	var automaticAnswer = false;
	var remoteChatRequest = {};//user requesting to chat
	var username = '';
	var chatOn = true;

	//Funtion Interface
	function stripLeaf($p) {
		if ($p === undefined) return;
		return $p.substr($p.lastIndexOf('/') + 1);
	};
	// Get the name of the peer the user has selected.
	//@ returnObject - if true, returns entire object not just name value.
	var selectedPeer = function (returnObject) {
		var peerEl = document.getElementsByClassName('peer');
		for (var i = 0, l = peerEl.length; i < l; i++) {
			var peer = peerEl[i];
			console.log('peer: ', peer, '  is sel: ' + (peer.classList.contains('selected')));
			if (peer.classList.contains('selected')) {
				if (peer.id == '__all__') return undefined;
				console.log('value: ', peer.id);
				return !!returnObject ? peer : (peer.id).substr(5);
			}
		}
	};

	function setSelectedPeer($peer, $setting) {
		//if setting is there use, otherwise set true by default.
		if ($setting == undefined) $setting = true;
		var sel = selectedPeer(true);//get peer object.
		//if a peer element is selected, remove the selected state before setting the new peer.
		if (!!sel) {
			//console.log('selc: ',sel,', img: ',sel.getElementsByClassName('peer-icon')[0]);
			sel.classList.remove('selected');
			//if the peer is the same as the selected one, do not reselect.
			if (sel.id === $peer.id) {
				if (callPeerEl.classList.contains('start-call-grn')) {
					callPeerEl.classList.remove('start-call-grn');
					callPeerEl.classList.add('start-call');
				}
				return;
			}
		}
		if (callPeerEl.classList.contains('start-call')) {
			callPeerEl.classList.remove('start-call');
			callPeerEl.classList.add('start-call-grn');
		}
		$peer.classList.add('selected');
	};

	//show and hide chat.
	function showChat($show) {
		msgHistory.style.display = !$show ? 'none' : 'inherit';
		sendMessageEl.style.display = !$show ? 'none' : 'inherit';
		chatBtn.style.backgroundColor = !$show ? '#797979' : '#81b75c';
		console.log('showChat ' + $show + ', display: ' + msgHistory.style.display);

		chatOn = $show;
		messagesEl.scrollTop = messagesEl.scrollHeight;
		if (chatOn && isFullScreen()) {
			fullScreenVideo();
		}
	};


	socket.on('DANH_SACH_ONLINE', function (arrUserInfo) {
		//Hien thi danh sach cac tai khoan dang online
		arrUserInfo.forEach(function (user) {
			//if local user add to Username Label not list.
			if (!document.getElementById('peer-' + user.peerId)) {
				var imgEl = document.createElement('div');
				imgEl.setAttribute('class', 'peer-icon user-icon-img');
				//create label
				var txtEl = document.createElement('span');
				txtEl.setAttribute('class', 'sr-only');
				txtEl.setAttribute('class', 'peer-label');
				txtEl.textContent = stripLeaf(user.ten);
				var nodeEl = document.createElement('div');
				nodeEl.appendChild(imgEl);
				nodeEl.appendChild(txtEl);
				nodeEl.id = 'peer-' + user.peerId;
				nodeEl.className = 'peer';
				peersEl.append(nodeEl);
			}
		});

		socket.on('CO_NGUOI_DUNG_MOI', function (user) {
			console.log('co nguoi dung moi');
			usernameLabelEl.appendChild(document.createTextNode(stripLeaf(user.ten)));
			var imgEl = document.createElement('div');
			imgEl.setAttribute('class', 'peer-icon user-icon-img');
			//create label
			var txtEl = document.createElement('span');
			txtEl.setAttribute('class', 'sr-only');
			txtEl.setAttribute('class', 'peer-label');
			txtEl.textContent = stripLeaf(user.ten);
			var nodeEl = document.createElement('div');
			nodeEl.appendChild(imgEl);
			nodeEl.appendChild(txtEl);
			nodeEl.id = 'peer-' + user.peerId;
			nodeEl.className = 'peer';
			peersEl.append(nodeEl);
		});

		//Xu ly su kien co ai do ngat ket noi
		socket.on('AI_DO_NGAT_KET_NOI', function (peerId) {
			console.log(peerId + " da ngat ket noi");
			// Removes peer elements from the page when a peer leaves.
			var nodeEl = document.getElementById('peer-' + peerId);
			var curSel = selectedPeer(true);
			if (!!curSel && curSel.id == nodeEl.id) {
				setSelectedPeer(curSel, false);
			}
			if (!!nodeEl) peersEl.removeChild(nodeEl);

			// var selectors = peersEl.getElementsByTagName('div');
			// var i, len = selectors.length;
			// for (i = 0; i < len; i++) {
			// 	var peerSel = selectors[i];
			// 	if (!!peerSel && peerSel.classList.contains('peer')) peersEl.removeChild(peerSel);
			// }


		});


	});

	var customConfig;
	var peer = new Peer({ key: 'peerjs', host: 'webrtcserverpeerjs.herokuapp.com', secure: true, port: 443, config: customConfig });

	peer.on('open', function (id) {
		console.log('My peer ID is: ' + id);
		//Xu ly su kien khi nguoi dung an vao nut dang ky
		$('#login-btn').click(function () {
			username = usernameEl.value.replace(/\W+/g, '');

			if (!username || username === '') {
				return;
			}

			loginEl.parentNode.style.visibility = 'hidden';
			logOutEl.style.visibility = 'visible';

			if (logOutEl.classList.contains('sign-out')) {
				logOutEl.classList.remove('sign-out');
				logOutEl.classList.add('sign-out-grn');
			}

			socket.emit('NGUOI_DUNG_DANG_KY', { ten: username, peerId: id });
		})

	});


	//Ham cau hinh thiet bi media
	function openStream() {
		var config = { audio: true, video: true };
		return navigator.mediaDevices.getUserMedia(config);
	}

	//Ham de chay video
	function playVideo(idVideoTag, stream) {
		const video = document.getElementById(idVideoTag);
		video.srcObject = stream;
		video.play();
	}

	//peer select handling
	$(peersEl).click(function (evt) {
		var tar = evt.target;
		console.log(tar);
		if (tar.classList.contains('peer')) setSelectedPeer(tar);
	})

	//Ham su ly su kien khi cuoc goi da bat dau
	function callStart(peerName) {
		remotePeerName.innerHTML = peerName;
		remoteChatRequest = { peer: peerName };

		if (hangUpEl.classList.contains('end-call')) {
			hangUpEl.classList.remove('end-call');
			hangUpEl.classList.add('end-call-grn');
		}

		//udpate indicator in userlist item
		var sel = document.getElementById('peer-' + remoteChatRequest.peer);
		if (!!sel) {
			var pIcon = sel.getElementsByClassName('peer-icon')[0];
			if (pIcon.classList.contains('user-icon-img')) {
				pIcon.classList.remove('user-icon-img');
				pIcon.classList.add('user-icon-img-grn');
			}
		}

		//hide chat by default
		showChat(false);
		//show remote video elements.
		var majBox = document.getElementsByClassName('major-box')[0];
		if (majBox.classList.contains('hide-vid')) majBox.classList.remove('hide-vid');
		var minBox = document.getElementsByClassName('minor-box')[0];
		if (minBox.classList.contains('box-standby')) minBox.classList.remove('box-standby');
		remoteVideoEl.style.visibility = 'visible';

		//show buttons
		peerInfoView.style.visibility = 'visible';
		videoMenu.style.visibility = 'visible';
		console.log('callStart: ', remoteChatRequest);
	}



	//Ham xu ly su kien khi nguoi dung click vao nut goi
	$(callPeerEl).click(function (call) {
		var peerName = selectedPeer();
		console.log(peerName);

		if (!!peerName) {
			openStream()
				.then(function (stream) {
					playVideo('local-video', stream);
					var call = peer.call(peerName, stream);
					callStart(peerName);
					call.on('stream', function (remoteStream) {
						playVideo('remote-video', remoteStream)
					});
				})
		}
	})

	
	peer.on('call', function (call) {
		openStream()
			.then(function (stream) {
				call.answer(stream);
				//hide chat by default
					showChat(false);
					//show remote video elements.
					var majBox = document.getElementsByClassName('major-box')[0];
					if (majBox.classList.contains('hide-vid')) majBox.classList.remove('hide-vid');
					var minBox = document.getElementsByClassName('minor-box')[0];
					if (minBox.classList.contains('box-standby')) minBox.classList.remove('box-standby');
					remoteVideoEl.style.visibility = 'visible';

					//show buttons
					peerInfoView.style.visibility = 'visible';
					videoMenu.style.visibility = 'visible';
					console.log('callStart: ', remoteChatRequest);
				playVideo('local-video', stream);
				call.on('stream', remoteStream => playVideo('remote-video', remoteStream));
			})
	})



	function isFullScreen() {
		return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
	}

	// Full-screens any HTML5 video on the page.
	function fullScreenVideo($video) {
		// are we full-screen?
		if (isFullScreen()) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
			//remoteFullScreenEl.style.backgroundColor = '#797979';
		} //else go to fullscreen
		else {
			if ($video.requestFullscreen) {
				$video.requestFullscreen();
			} else if ($video.webkitRequestFullscreen) {
				$video.webkitRequestFullscreen();
			} else if ($video.mozRequestFullScreen) {
				$video.mozRequestFullScreen();
			} else if ($video.msRequestFullscreen) {
				$video.msRequestFullscreen();
			}
			//remoteFullScreenEl.style.backgroundColor = '#81b75c';
		}
	};

	//Su kien phong to video khi click vao button
	remoteFullScreenEl.onclick = function ($evt) {
		var majBox = document.getElementsByClassName('major-box')[0];
		fullScreenVideo(majBox);//remoteVideoEl);
	};

	// 	var callEnd = function ($event, $denied) {
	// 		console.log('*** callEnd, peer:  ', remoteChatRequest.peer);
	// 		remotePeerName.innerHTML = 'No Caller';

	// 		if (hangUpEl.classList.contains('end-call-grn')) {
	// 			hangUpEl.classList.remove('end-call-grn');
	// 			hangUpEl.classList.add('end-call');
	// 		}

	// 		p.hangUp();

	// 		if (remoteChatRequest.peer === undefined) return;

	// 		var sel = document.getElementById('peer-' + remoteChatRequest.peer);
	// 		if (!!sel) {
	// 			var pIcon = sel.getElementsByClassName('peer-icon')[0];
	// 			if (pIcon.classList.contains('user-icon-img-grn')) {
	// 				pIcon.classList.remove('user-icon-img-grn');
	// 				pIcon.classList.add('user-icon-img');
	// 			}
	// 		}
	// 		//show chat if hidden
	// 		showChat(true);
	// 		//hide remote video elements.
	// 		var majBox = document.getElementsByClassName('major-box')[0];
	// 		if (!majBox.classList.contains('hide-vid')) majBox.classList.add('hide-vid');
	// 		var minBox = document.getElementsByClassName('minor-box')[0];
	// 		if (!minBox.classList.contains('box-standby')) minBox.classList.add('box-standby');
	// 		remoteVideoEl.style.visibility = 'hidden';
	// 		//hide btns
	// 		peerInfoView.style.visibility = 'hidden';
	// 		videoMenu.style.visibility = 'hidden';
	// 		//if its a denial, do not send messages.
	// 		if ($denied === false) {
	// 			sendMsg({ internal: true, type: 'action', code: 'rtc.p2p.close', peer: username }, remoteChatRequest.peer);
	// 			addMessage('INFO', { internal: true, type: 'msg-info', message: 'Your chat with ' + remoteChatRequest.peer + ' has endeed.' });
	// 		}
	// 		remoteChatRequest = {};

	// 		if (isFullScreen()) {
	// 			fullScreenVideo();
	// 		}
	// 	};

	// 	var callDenied = function ($event, $peer, $data) {
	// 		if ($data.code === 'user.insession') {
	// 			var peer = remoteChatRequest.peer;
	// 			callEnd($event, true);
	// 			addMessage('ERROR', { internal: true, type: 'msg-alert', message: peer + ' is currently in a session, please try again later.' });
	// 		}
	// 	};


	// 	// Ends current call, if any.
	// 	mainEndCall.onclick = hangUpEl.onclick = function () {
	// 		callEnd();
	// 	};




	// };



});