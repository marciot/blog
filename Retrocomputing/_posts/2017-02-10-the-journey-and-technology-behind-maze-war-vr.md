---
assets: /assets/2017/02/10
---

# The Journey and Technology Behind “Maze War VR”

![icon-512.png](icon-512.png){: class="dropCap"}
I have been working on a game that bridges the new to the old. **Maze War** is a historic game: it was [the very first first person shooter game](http://www.polygon.com/features/2015/5/21/8627231/the-first-first-person-shooter), released in 1974 for a computer called the Imlac.

**Maze War VR** is a web game. On the surface, it is an simple web game with a retro feel, but how the first led to the second is a story of how one hack led to another, and then to another, and to many others still.

## It Started with a Museum

I have a sweet spot in my heart for retro computers and software. I built an [online computer museum](http://retroweb.maclab.org/), in JavaScript, so that people could interact with vintage computers and learn about them. This is the altruistic reason I share with others: in truth, the project was a selfish excuse for me to spend time tinkering with emulators, old software and Javascript, three things I really enjoy.

Some of the features in my museum stem from a desire to leave no “what if” unexplored. For instance: I made it so the emulated computers could talk to one another, via an emulated serial connection, from one browser window to another. This entailed a series of sub-hacks, including code to emulate a Hayes smart-modem and a virtual telephone exchange complete with made up telephone numbers in the [ficticious 555 area code](https://en.wikipedia.org/wiki/555_(telephone_number)), which would allow one emulated computers to “dial” another via WebRTC data-channels.

One of my early experiments involved running two instances of Battlechess, one on an emulated Macintosh and another on an emulated Commodora Amiga 500 in different browser tabs. Using my emulated modem, I was able to send a move across the line, but not quite reliably enough for a playable game (perhaps Battlechess required serial flow control, which my code did not implement).

<figure>
  <img src="battlechess1.png">  
  <figcaption>Battlechess on the Macintosh (left), Battlechess on the Amiga 500 (right)</figcaption>
</figure>

MazeWars+ between two emulated Macintosh instances, however, worked perfectly, proving the concept and leading me to want even more than two simultaneous players.

## From Emulated Modems to LocalTalk

Having gotten a pair of computers to play Maze Wars+ via a serial link, I set my sights on allowing several to do so. Most of the computers in my museum lacked native networking capabilities, but the Apple Macintosh Plus, the crown jewel of my museum, had in its original form the ability to participate in a LAN called a [LocalTalk network](https://archive.org/details/networks2). With LocalTalk, Maze Wars+ on the Macintosh supported up to thirty simultaneous players. Thirty is a whole lot better than two.

![mazewarsadlarge](mazewarsadlarge.jpg)

The Macintosh had a Mini DIN-9 port on its rear called the LocalTalk port. This port served double-duty: it could serve as a serial port or as an interface to the LocalTalk network, via Y-splitters. At minimum, two Macintosh computers could be cabled directly together via their LocalTalk ports, making a small LAN of two, but more often, several computers were daisy chained together into a larger network.

This simplicity lead me to believe that LocalTalk was plain old serial communications, with the transmit and receive lines electrically coupled into a common wire. I suspected that expanding my serial port demo to a LAN would merely involve shuttling serial data from one emulated Macintosh to several others, a trivial modification from sending it to just one, which I had already demonstrated. Easy peasy.

## The Zilog E8530 SCC

It turns out I was wrong. The Macintosh uses a chip called the Zilog E8530 SCC, a master-of-all-trades. Yes, it does serial communications, but it also has a much more complex mode called SDLC that forms the backbone of the LocalTalk network. In this mode, the chip is quite sophisticated. It frames packets, senses the media, avoids and detects collisions and computes frame checksums.

<figure class="floatRight">
  <img src="zilog-e8530.jpg">  
  <figcaption>The Z8530 SCC chip on on an Apple Macintosh 128K/512K motherboard</figcaption>
</figure>

The [PCE emulator](http://www.hampa.ch/pce/) I had been using implemented the serial mode of the Zilog chip, but not the SDLC mode. This task would fall to me. Fortunately, I was able to rely on the earlier work that had been done by [Mike Fort for the Mini vMac emulator](http://mfort.net/Mini_vMac_LT/Mini_vMac_LT.html). Even with that source as my guide and the comprehensive “[Zilog SCC/ESCC User Manual](http://www.zilog.com/force_download.php?filepath=YUhSMGNEb3ZMM2QzZHk1NmFXeHZaeTVqYjIwdlpHOWpjeTl6WlhKcFlXd3ZWVTB3TVRBNUxuQmtaZz09)”, adding SDLC capabilities to the PCE emulator turned out to be a significant undertaking.

The reward came when I combined this with my earlier WebRTC work to allow several emulated Macintosh computers to communicate using native AppleTalk frames on a simulated inter-browser network. Today, my museum features [several multi-player Macintosh games](http://retroweb.maclab.org/articles/Online-Games.html?emulator=pce-macplus), such as NetTrek, Pararena, and Maze War+.

## The Xerox Alto: The Missing Link

![alto-mazewar](alto-mazewar.jpg){: class="floatRight"}

My success in making Maze War+, a Macintosh game, playable in LAN mode in my museum lead me to the next step: a step forward but also back in history. The Xerox Alto, a computer developed at the Xerox PARC Labs in the 1970s, is an important player in the history of the Macintosh: it inspired Steve Jobs and his team to develop the Macintosh GUI.

Not only did the Xerox Alto play this pivotal role to the Macintosh, it also ran a much earlier version of Maze War, which had been developed at MIT around 1976. The more I learned, the more I understood that the Xerox Alto could weave together two threads in my museum: the story of the Macintosh as well as the story of Maze War, the game.

At this point, it became inevitable that my museum had to one day have a Xerox Alto running Maze War, in multi-player mode.

## The Xerox Alto, in JavaScript.

So inspired in this new mission, I came across an emulator called SALTO and [ported it to JavaScript](https://github.com/marciot/retroweb-salto-simulator-js) using the EMSCRIPTEN toolchain. Sadly, I found that it was too buggy and slow to be of use.

Further research led me to another emulator, [Contralto](https://github.com/livingcomputermuseum/ContrAlto), that was being developed by the [Living Computers: Museum+Labs](http://www.livingcomputers.org/). This emulator proved to be much more robust, but was written in C#, making my plans of using EMSCRIPTEN to port it to Javascript impossible. Porting it by hand appeared daunting, but another brave individual had already taken up the challenge.

I got in touch with the author of ContraltoJS, [a JavaScript port of Contalto](http://www.loomcom.com/contraltojs/), and began collaborating with him. The Ethernet emulation was something the author of ContraltoJS had not yet tackled, so I volunteered to help, hoping that my earlier work with PCE and SDLC would give me the right experience for the job. This turned out to be true and my earlier AppleTalk tunneling code morphed into [a general library for tunneling legacy protocols over WebRTC](https://github.com/marciot/retroweb-networking): now capable of both LocalTalk and the legacy Ethernet frames that the Xerox Alto employed.

![diagram](diagram.png)

I eventually demonstrated instances of ContraltoJS running in a LAN in the web browser, playing two multi-player games for the Xerox Alto: Battleship and Maze War.

## Rethinking Maze War, in the Third Dimension

Along side my work with emulators, I had been learning THREE.js, a 3D graphics library for the web. It occurred to me one night that making a Maze War clone would be a excellent learning experience. Drawing mazes and spheres is fairly straightforward in THREE.js, after all.

Doing a remake of Maze War did not take me deep enough into the rabbit hole, however,so I decided my version would have to be [compatible with the Xerox Alto version](https://www.youtube.com/watch?v=XXOH0z3Aki8&t=9s). This goal led me to reverse-engineer the legacy Ethernet frames of the original game as it ran under ContraltoJS. These packets were being wrapped and tunneled over WebRTC, so I ended up writing a packet inspection tool for my tunneling library.

The work of understanding the Maze War frames was aided by documentation on the [PUP data frames](http://bitsavers.trailing-edge.com/pdf/xerox/parc/techReports/CSL-79-10_Pup_An_Internetwork_Architecture_Jul79.pdf) used by the Xerox Alto as well as by code fragments from the original Maze War that were graciously provided to me by the developer of ContraltoJS.

## The Last Frontier: Virtual Reality

The last step on this journey was rewriting the game to [WebVR specs](https://webvr.info/) and [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API). By using [Crosswalk](https://crosswalk-project.org/), I was able to bring it to [mobile phone users](https://play.google.com/store/apps/details?id=com.marciot.mazewar_vr_free&hl=en). Maze War VR is now available both on the Android store as well as online for all major VR headsets. It has been tested on Google Cardboard, GearVR, Oculus Rift, but should work on any WebVR capable browser. Give it a try. Invite your friends to step right into this historic game with you.

Oh, and don't forget it is also [compatible with Maze War for the Xerox Alto](https://www.youtube.com/watch?v=XXOH0z3Aki8).

<iframe width="560" height="315" src="https://www.youtube.com/embed/iemJnNFq3r4?si=sVLHyZlyd9dUixDR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>