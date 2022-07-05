---
title: Home data storage with encrypted cloud backup
tags:
  - homelab
---
I thought it would be a good idea to consolidate all my data to a central storage.
Before I set this up, I had data all over the place: photos and documents on iCloud and OneDrive, old programming projects and very old documents scattered on random hard drives, games and music on my PC.

I had a few requirements:

- Central location for all my devices: I want to mount a share and copy files
- Backups: the central location should have versioned backups
- No proprietary solutions: I want to be in control of my data
- No vendor lock-in: There should be an option to switch cloud storage providers
- Encryption: The cloud backups need to be encrypted

I decided to use an Odroid HC1 with an HDD.
The Odroid will advertise an NFS share and periodically back up its contents to a cloud storage.
I chose to go with [Backblaze](https://www.backblaze.com/b2/cloud-storage.html), which offers an S3-compatible object store at \$0.005/GB.
First 10 GB are free.

## Odroid setup

I downloaded Armbian for the HC1 here: [https://www.armbian.com/odroid-hc1/](https://www.armbian.com/odroid-hc1/) and wrote the image to an SD card using [Etcher](https://www.balena.io/etcher/).
I'm using OSX on my machine.
If you're on Windows, [Rufus](https://rufus.ie/) is a good choice.

Once the Odroid boots up, find its MAC address in your router config and configure a static IP lease.
Mine has `192.168.0.11`. Then SSH in:

```shell
$ ssh root@192.168.0.11
```

It will ask you to change the root password and create a new user.
Once done, add your user to the `sudo` group and update:

```shell
$ usermod -aG sudo <username>
$ apt update
$ apt upgrade
```

You should probably `su <username>`, but then you will have to `sudo` everything. ¯\\\_(ツ)\_/¯

### Mount the disk

Now is a good time to mount the HDD in `/mnt/hdd` and set it to mount on boot.

```shell
# find out where your disk is
$ fdisk -l

# create a fresh partition
$ parted /dev/sda
  > mklabel gpt # beware: this will erase all data on the drive
  > mkpart primary 0TB 1TB # or however large your disk is
  > quit

# create an Ext4 filesystem
$ mkfs.ext4 /dev/sda1

# create the mount point
$ mkdir /mnt/hdd

# mount it to verify it works
$ mount /dev/sda1 /mnt/hdd

# find your disk's UUID
$ blkid -o list

# add this line to /etc/fstab to mount on boot
$ vi /etc/fstab
  # ...snip...
  UUID=<uuid> /mnt/hdd ext4 defaults 0 2

# after reboot, disk should be mounted in /mnt/hdd
$ reboot
```

## NFS setup

Install the NFS server:

```shell
$ apt install autofs nfs-kernel-server nfs-common --install-recommends -f -y
$ reboot
```

Configure the share:

```shell
# the share will live in a subdirectory. That way you can add data to the disk that will not be shared
$ mkdir /mnt/hdd/data

# back up default NFS config
$ cp -a /etc/exports /etc/exports.backup

# configure the share
$ vi /etc/exports
  # data_directory  host(attributes)
  /mnt/hdd/data *(rw,async,insecure,all_squash,no_subtree_check,nohide,anonuid=1000,anongid=1000)
```

Attributes:

- `rw` - read/write
- `async` - allows the server to buffer writes
- `insecure` - allows clients (eg. Mac OS X) to use non-reserved ports to connect to the share
- `no_subtree_check` - improves speed and reliability by eliminating permission checks on parent directories
- `nohide` - not a hidden share
- `all_squash` - treats all users as anonymous and assigns them uid=anonuid & gid=anongid
- `anonuid=1000` - assigns anonymous users uid 1000
- `anongid=1000` - assigns anonymous users gid 1000

Change the `uid` and `gid` to match the owner of the `/mnt/hdd/data` directory.
That way every client will have full access to the share.
Use this only on your private network!

Restart to apply changes:

```shell
# if you make additional changes, run this first
$ exportfs -ra

# restart the server
$ service nfs-kernel-server restart
```

### Add a test NFS client

Mount the NFS share on your computer to verify it works.

```shell
# find out if the share is advertised
$ showmount -e 192.168.0.11

# mount it to /Users/<username>/odroid
$ mount -t nfs -o rsize=65536,wsize=65536,intr,hard,tcp,locallocks,rdirplus,readahead=128 192.168.0.11:/mnt/hdd/data /Users/<username>/odroid
```

Check if you see it in Finder and copy some files.
If it works, unmount and set up an auto mount:

```shell
# unmount
$ umount /Users/<username>/odroid

# add auto_nfs to auto_master
$ sudo vi /etc/auto_master
  /-          auto_nfs    -nobrowse,nosuid

# add the share to auto_nfs
$ sudo vi /etc/auto_nfs
  /System/Volumes/Data/Users/<username>/odroid -fstype=nfs,noowners,nolockd,locallocks,rdirplus,hard,intr,rw,tcp,nfc,rsize=65536,wsize=65536 nfs://192.168.0.11:/mnt/hdd/data

# set proper permissions: a+rwx,u-x,g-wx,o-wx
$ sudo chmod 644 /etc/auto_nfs

# mount everything in auto_master
$ sudo automount -cv
```

You should find the volume in `/Users/<username>/odroid`.
Verify it still works.

## Backup setup

Register for a Backblaze account at [https://www.backblaze.com/b2/cloud-storage.html](https://www.backblaze.com/b2/cloud-storage.html).
(You can use any other cloud storage provider supported by `rclone`, which is most of them.)
Create a private bucket with versioning on (it's the default for B2).

Side note: if you create a public bucket, you can [proxy traffic](https://help.backblaze.com/hc/en-us/articles/217666928-Using-Backblaze-B2-with-the-Cloudflare-CDN) to it through Cloudflare to create your own private CDN.

Next, create an app key with permissions to your bucket and save the app key ID and the key to configure `rclone`.

### Install & configure rclone

Rclone is an amazing CLI utility that supports a lot of cloud storage providers.
It's basically rsync for the cloud. Let's install rclone and add B2 as a remote:

```shell
# install rclone
$ apt install rclone

# add a remote
$ rclone config
  No remotes found - make a new one
  n) New remote
  s) Set configuration password
  q) Quit config

  n/s/q> n

  name> b2

  Type of storage to configure.
  Enter a string value. Press Enter for the default ("").
  Choose a number from below, or type in your own value
  ...snip...
  4 / Amazon S3 Compliant Storage Providers (AWS, Ceph, Dreamhost, IBM COS, Minio)
    \ "s3"
  5 / Backblaze B2
    \ "b2"
  ...snip...

  Storage> b2

  ** See help for b2 backend at: https://rclone.org/b2/ **

  Account ID or Application Key ID
  Enter a string value. Press Enter for the default ("").
  account> 0000000000000000000
  Application Key
  Enter a string value. Press Enter for the default ("").

  key> *876FD87SFGadsfSD08F6fD087Fadf07SF608D6fdsfzgjhsdfgd76*

  Permanently delete files on remote removal, otherwise hide files.
  Enter a boolean value (true or false). Press Enter for the default ("false").

  hard_delete> false

  Edit advanced config? (y/n)
  y) Yes
  n) No
  y/n> n

  Remote config
  --------------------
  [b2]
  account = 0000000000000000000
  key = 876FD87SFGadsfSD08F6fD087Fadf07SF608D6fdsfzgjhsdfgd76
  hard_delete = false
  --------------------

  y) Yes this is OK
  e) Edit this remote
  d) Delete this remote

  y/e/d> y
```

To test that it worked, create a file in `/mnt/hdd/data` and run rclone:

```shell
# create a file
$ touch /mnt/hdd/data/test-file

# sync to B2
$ rclone sync /mnt/hdd/data b2:<bucket-name>
```

See if the file was uploaded in B2 management console.

### Enable encryption

To enable encryption, rclone has a `crypt` remote type that encrypts files uploaded to it.
Most of the configuration is straightforward and uses the defaults, except for filename and directory name encryption, which [does not work with B2 versioning system](https://github.com/rclone/rclone/issues/1627#issuecomment-371625277), so we will disable it.
If you insist on encrypting file and directory names, you could disable versioning and use the `--backup-dir` option instead.

Let's add another remote:

```shell
$ rclone config
  n) New remote
  s) Set configuration password
  q) Quit config

  n/s/q> n

  name> b2-crypt-backup

  Type of storage to configure.
  Enter a string value. Press Enter for the default ("").
  Choose a number from below, or type in your own value
  ...snip...
  9 / Encrypt/Decrypt a remote
    \ "crypt"
  ...snip...

  Storage> crypt

  ** See help for crypt backend at: https://rclone.org/crypt/ **

  Remote to encrypt/decrypt.
  Normally should contain a ':' and a path, eg "myremote:path/to/dir",
  "myremote:bucket" or maybe "myremote:" (not recommended).
  Enter a string value. Press Enter for the default ("").

  remote> b2:<bucket-name>

  How to encrypt the filenames.
  Enter a string value. Press Enter for the default ("standard").
  Choose a number from below, or type in your own value
  1 / Don't encrypt the file names.  Adds a ".bin" extension only.
    \ "off"
  2 / Encrypt the filenames see the docs for the details.
    \ "standard"
  3 / Very simple filename obfuscation.
    \ "obfuscate"

  filename_encryption> off

  Option to either encrypt directory names or leave them intact.
  Enter a boolean value (true or false). Press Enter for the default ("true").
  Choose a number from below, or type in your own value
  1 / Encrypt directory names.
    \ "true"
  2 / Don't encrypt directory names, leave them intact.
    \ "false"

  directory_name_encryption> false

  Password or pass phrase for encryption.
  y) Yes type in my own password
  g) Generate random password
  n) No leave this optional password blank

  y/g/n> g

  Password strength in bits.
  64 is just about memorable
  128 is secure
  1024 is the maximum

  Bits> 1024

  Your password is: zFpNRENxx75Eks3GftRzhDdRYFO8U8oAWTIwezf5Qnj5HPwAxypXDZb4LGy1wJSUGPo4c9aj4GLhQ87Gcw3ar6ve7TET77NORkAyhKwkR6BwPk4jVGRi-YMkjIf6oqDPdRRB3RQUhtFKp5VtBQl-txe-luOQlHR2-zQ_YiamuAg
  Use this password? Please note that an obscured version of this
  password (and not the password itself) will be stored under your
  configuration file, so keep this generated password in a safe place.
  y) Yes
  n) No

  y/n> y

  Password or pass phrase for salt. Optional but recommended.
  Should be different to the previous password.
  y) Yes type in my own password
  g) Generate random password
  n) No leave this optional password blank

  y/g/n> g

  Password strength in bits.
  64 is just about memorable
  128 is secure
  1024 is the maximum

  Bits> 1024

  Your password is: CadSQrSUqAAGOfNzr6-__Rsdv8Bauj2lG8Ee2Q7oFZh7MByhnRFyUGLoX5yXX1dKRKKxMCpoG5-OQlKgascKd-aU9p9sGAeVpzs301zzwrRI8ngE8XtPE8Qzx_HZvZAMqVSy1gl-zGhqqnsdCLuty5VbBtk2PJwQ9Hlq1XygxCA
  Use this password? Please note that an obscured version of this
  password (and not the password itself) will be stored under your
  configuration file, so keep this generated password in a safe place.
  y) Yes
  n) No

  y/n> y

  Edit advanced config? (y/n)
  y) Yes
  n) No

  y/n> n

  Remote config
  --------------------
  [b2-crypt-backup]
  remote = b2:<bucket-name>
  filename_encryption = off
  directory_name_encryption = false
  password = *** ENCRYPTED ***
  password2 = *** ENCRYPTED ***
  --------------------
  y) Yes this is OK
  e) Edit this remote
  d) Delete this remote

  y/e/d> y
```

**Save the keys to your password manager.**
You will need them to restore your files.

Check that the encrypted remote works the same way we checked the B2 remote:

```shell
# create a file
$ echo "unencrypted text" > /mnt/hdd/data/test-plain-file

# sync to B2
$ rclone sync /mnt/hdd/data b2-crypt-backup:/
```

The file should show up in the management console with a `.bin` extension and encrypted contents.

**Test that you're able to restore the data.**
This step is crucial, without it you're uploading random bytes to the cloud.
On the Odroid:

```shell
# copy your config
$ cat $(rclone config file | tail -n1)
```

On another machine:

```shell
# paste your config
$ rclone config edit

# restore the files, decrypting them in the process
$ rclone sync b2-crypt-backup:/ /Users/<username>/test
```

Confirm that the file is restored and its contents have been decrypted.

## Schedule rclone to sync periodically

I used `cron` to automate running `rclone` every 30 minutes.
Create a bash script in `/home/<username>/rclone-cron.sh`:

```shell
#!/bin/bash
if pidof -o %PPID -x “rclone-cron.sh”; then
exit 1
fi
rclone sync --fast-list --stats-log-level NOTICE --stats-one-line --log-file=/var/log/rclone.log /mnt/hdd/data b2-crypt-backup:/
exit
```

If your storage provider bills you for every transaction (B2 does), I recommend to use `--fast-list`, which will minimize the amount of transactions at the expense of higher memory usage and result in a lower monthly payment.

I enabled logging to file for easier monitoring with `--stats-log-level NOTICE --stats-one-line --log-file=/var/log/rclone.log`.

The script runs `rclone sync`, but only if another instance of the script is not already running.

```shell
# set the executable bit
$ chmod a+x rclone-cron.sh

# add this line to crontab
$ crontab -e
  0,30 * * * * /home/<username>/rclone-cron.sh >/dev/null 2>&1
```

If you'd like to change the schedule, [crontab.guru](https://crontab.guru/#0,30_*_*_*_*) is handy when editing crontab.

That's it! Anything you store on the Odroid will be backed up to Backblaze every 30 minutes.
Previous versions of edited or deleted files will remain in Backblaze.
You can recover them using `rclone --b2-versions`.
You'll find more about that in the [docs](https://rclone.org/b2/#versions).
