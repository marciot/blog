---
assets: /assets/2016/09/14
---

# Legacy Peer-to-Peer Networking over WebRTC (Introduction)

![mazewars-eye](mazewars-eye.png){: class="floatLeft" style="width:15vw"}

One of my long term ambitions for the [RetroWeb Vintage Computer Museum](http://retroweb.maclab.org) was to allow the emulated computers to talk to one another. Last July, after learning about [WebRTC ](https://webrtc.org/)and [PeerJS](http://peerjs.com/), I managed to accomplish first contact. By tunneling serial data over WebRTC, I had an emulated Macintosh running one browser window playing BattleChess with an emulated Commodore Amiga running on another browser window; I then played MazeWars+ with a stranger I met on the MAME IRC channel, showing that playing games originally meant for modem play via the Internet instead, through WebRTC, was not only possible, but also rather fun!

By August, I had become determined to tunnel AppleTalk packets over WebRTC, which would allow MazeWars+ and other multi-player Macintosh games to be played with [several players at once](http://retroweb.maclab.org/articles/Online-Games.html). In subsequent posts of this series, I will explain what it took to get there.