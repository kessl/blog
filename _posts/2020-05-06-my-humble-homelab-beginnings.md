---
title: My humble homelab beginnings
tags:
  - homelab
---
Hi, I'm Daniel and I'm an absolute newb when it comes to kubernetes.
I also really like the idea of having a homelab to experiment on, self-host some apps and look at pretty lights and cables.
My original plan to rack-mount a HP DL380 G6 in my living room I [abandoned rather quickly](https://youtu.be/eBTPKBm4vA4?t=36) in hopes of remaining in a relationship.

The next best thing I have is a random assortment of mostly ARM hardware, which I'll try to coerce into homelab stuff with the help of kubernetes.

I know next to nothing about kubernetes, so my setup will be a mashup of these great kubernetes guides:

- https://blog.alexellis.io/test-drive-k3s-on-raspberry-pi/
- https://blog.quickbird.uk/domesticating-kubernetes-d49c178ebc41
- https://kauri.io/38-install-and-configure-a-kubernetes-cluster-with/418b3bc1e0544fbc955a4bbba6fff8a9/a

## The goal

The ultimate goal is to set up a homelab kubernetes environment on hardware that I have lying around.
I should be able to deploy apps to the cluster and have them be reachable on a subdomain of bitgate.cz over HTTPS.

I have a few apps in mind that I'd like to eventually host:

- **[NextCloud](https://nextcloud.com/)** - self-hosted file sharing & document tools
- **[Jellyfin](https://jellyfin.org/), Sonarr, Radarr,** etc - home theater with automated media management
- **nginx & [goaccess](https://goaccess.io/) analytics** - something to tell me if anyone reads this blog
- **storage** with off-site backup - a NAS backed up to B2

## The hardware

I have a Raspberry Pi 3B+, a 2011 Raspberry Pi, an old Windows laptop and two Odroid HC1s.
All devices are very low-end for kubernetes.
I will therefore be going for [k3s](https://k3s.io/), a lightweight, stripped-down kubernetes distribution crammed in a single binary.

The 2011 is apparently way too slow and not supported by k3s.
The 3B+ is supported but slow, needs to run off an SD card and is limited to USB2.0 and 100Mb ethernet.
It should do its job as master node.

The Odroids are better specced with an 8-core CPU, 2GB RAM and a SATA port.
They will serve as agent nodes doing the heavy lifting, as well as storage hosts.

## The path

Since my current knowledge of kubernetes is that it's something I somehow deploy things to at work, this should be a pretty fun ride.

Based on the excellent guides linked above, I plan to tackle the setup in this order:

1. prepare hardware and operating systems, install k3s
2. configure load balancer, ingress controller, certificate management and DNS
3. add persistent storage
4. deploy apps

It will probably take a lot of my time to understand how it all works, so I'll split this endeavor into multiple posts.
Let's do this!
