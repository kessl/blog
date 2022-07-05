---
title: Wireguardifying crappy work VPN
tags:
  - devops
---
I need to connect to a VPN to access our development environments and various tools we use at work.
We were given [FortiClient](https://www.fortinet.com/support/product-downloads) as the VPN client, which is utter crap and probably the worst Mac app I've ever had the misfortune to use.
To give you a picture of how bad it is:

- It requires root privileges to install, connect and disconnect (ok, fair enough, it's a VPN, but it asks for password only and doesn't allow me to use Touch ID or Apple Watch).
- FortiClient positively cannot stay online over anything but the most stable of connections.
  Change networks?
  Sorry, connect again.
  Roam to a closer AP?
  No luck.
  Close your Mac for 10 seconds?
  Here, why don't you enter your OTP for the 18th time today.
- Sometimes, when quitting the app, this stupid, bug-ridden piece of critical network infrastructure code that is supposed to help sysadmins sleep at night will ask for a password and simultaneously disable all keyboard input 😠
 The only fix I found for this is to un/plug an external keyboard.
- It does this:

![FortClient playing Solitaire with error dialogs :(](/assets/images/forticlient-solitaire.png)

## Way out of here

I'm a spoiled computer nerd who likes to use software made in this century.
What if I connect a remote box to the VPN using this piece of crap, and use Wireguard to connect to the box?
Turn on IP forwarding and route traffic from my Laptop to the VPN subnet, like this:

<pre class="ascii-diagram">

            Tailscale       openfortivpn                   ┌─────┐
          ┌────────────┐   ┌─────────────┐                 │ DNS │
          │            │   │             │                 └─────┘
  ┌───────▼──┐      ┌──▼───▼──┐       ┌──▼──────────┐    10.11.12.13
  │          │      │         │       │             │
  │  Laptop  │  WG  │   VPS   │ IPsec │  VPN server │    VPN subnet
  │          ◄──────┼─────────┼───────┼─────────────┼──► 10.0.0.0/8
  └──────────┘      └─────────┘       └─────────────┘

</pre>

Since the VPS will remain always connected and Wireguard is a lot more resilient than IPsec when it comes to roaming and reconnecting, this should solve both the disconnects and having to deal with a crappy app.
I will still have to SSH in and manually log in with `openfortivpn` every once in a while, when the connection times out.

## Tailscale to the rescue

Wireguard is awesome but takes a bit of work to set up and maintain.
[Tailscale](https://tailscale.com/), however, uses Wireguard internally, is even more awesome and is unbelievably easy to set up.
It just works&trade;.
Also it's free for a single account (which you can use for ~~as many devices as you like~~ 20 devices + one subnet route as of June 2021).
It works behind [all sorts of nasty NATs](https://tailscale.com/blog/how-nat-traversal-works/).
Seriously, it's amazing.

I used a $5 DigitalOcean VPS I have lying around for random purposes like this.
I connected both using Tailscale, installed [openfortivpn](https://github.com/adrienverge/openfortivpn) (an open-source CLI alternative to FortClient) and connected.

![Tailscale machines screen with arcane-potato (VPS) connected](/assets/images/tailscale-machines.png)

```bash
daniel@macbook $ ssh arcane-potato

# set bash create a new tmux session when SSHing in, so that openfortivpn doesn't terminate when I close the SSH session
daniel@arcane-potato:~$ cat << 'EOF' >> .bashrc
if command -v tmux &> /dev/null && [ -n "$PS1" ] && [[ ! "$TERM" =~ screen ]] && [[ ! "$TERM" =~ tmux ]] && [ -z "$TMUX" ]; then
  exec tmux
fi
EOF

# configure openfortivpn
daniel@arcane-potato:~$ cat << EOF > /etc/openfortivpn/config
host = 123.45.67.89
port = 12345
username = <username>
password = <password>
trusted-cert = 6f6205cddd796c6d58730df9d35f908d6c513690c6e24135dda4f662fc9997b3
EOF

daniel@arcane-potato:~$ echo "alias vpn=\"sudo openfortivpn -o \"" >> .bashrc
daniel@arcane-potato:~$ source .bashrc
daniel@arcane-potato:~$ vpn 123456
[sudo] password for daniel:
<snip>
INFO:   Tunnel is up and running.
```

VPS is now connected to VPN.
Next, I needed to tell Tailscale to forward packets to our VPN subnet.
Also, DNS.

## Forwarding traffic

I enabled IP forwarding and told Tailscale to add routes to the VPN subnet.

```bash
# enable IP forwarding
daniel@arcane-potato:~$ echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
daniel@arcane-potato:~$ echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf
daniel@arcane-potato:~$ sudo sysctl -p /etc/sysctl.conf

# tell Tailscale that we have a route to our VPN subnet
daniel@arcane-potato:~$ sudo tailscale up --advertise-routes=10.0.0.0/8
```

In the Tailscale control panel, `arcane-potato` now has a badge saying that it advertises routes.
Before these routes are applied, they need to be [reviewed](https://tailscale.com/kb/1019/subnets/) and approved.
Once that was done, I was able to reach services behind the VPN by their IP addresses.

## Configuring DNS

To resolve domain names of services behind the VPN, I need to tell my laptop to use the DNS server on our VPN.
I did that using Tailscale's DNS settings panel, which supports split DNS.
Split DNS tells Tailscale clients, "to resolve domain names in this domain, use this DNS server".
(If your services don't all have a second level domain in common, you will have to add your VPN DNS as a global nameserver.
In this case, DNS will only work when the VPS is connected to the VPN.
You can disable Tailscale DNS in `Tailscale > Preferences > Use Tailscale DNS settings` without disconnecting when you don't need it.)

![Tailscale split DNS configuration](/assets/images/tailscale-dns.png)

There's one less distraction to ruin your flow 🎉
