const Discord = require("discord.js")
const config = require("./config.json")
const database = require("./database.json")
const dbmanager = require("./dbmanager")
const webmanager = require("./webmanager")
const {Permissions} = require("discord.js")
const {Player, RepeatMode} = require("discord-music-player")
const http = require("http")
const fs = require("fs")

var admin = "295310535107280908"
var ticketid
var dataBase = []

const hostname = "0.0.0.0"
const port = 80

const server = http.createServer((req, res) => {
    const route = new URL(req.url, 'http://' + req.headers.host)
    let path = route.pathname

    if (!path.includes("."))
        path += ".html"

    fs.readFile('client/' + path, null, (e, data) =>
    {
        if (e)
        {
            console.log(e)
            res.statusCode = 404
            res.end()
        }
        else
        {
            res.write(data)
            res.end()
        }
    })
}).listen(port, hostname)

dataBase = dbmanager.ParseDB()
ticketid = dataBase.users.length

const client = new Discord.Client({
    restTimeOffset: 0,
    allowedMentions: {
        parse: ["roles", "users", "everyone"],
    },
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
    intents: 1679,
    status: "online"
})

const player = new Player(client, {
    leaveOnEmpty: false,
})

client.player = player

client.login(config.token)

client.on("ready", () => {
    client.user.setActivity("Pasta Cooking", {type: "COMPETING"})
    console.log("Pasta is ready")
})

client.on("messageCreate", async message => {
     try
      {
        if (!message.content.startsWith(config.prefix) || message.author.bot) return

        let guildQueue = client.player.getQueue(message.guild.id)

        const args = message.content.slice(config.prefix.length).replace(" ", " ").split(/ +/)
        const command = args.shift().toLowerCase()
        const allArgs = args.join().replaceAll(","," ").replace(/<.*>/gm, "")

        switch (command)
        {
            case "seteventdate":
                if (message.author.id != admin)
                {
                    message.channel.send("Only the **Pasta Cooker** can change the event date")
                    return
                }

                if (dbmanager.SetEventDate(args[0], args[1], args[2]))
                message.channel.send("The date has been updated correctly")
                else
                message.channel.send("The given date is invalid, the correct date format is: dd/mm/yyyy hh:mm timezone")
                break

            case "checkinvite":
                let user = dbmanager.QueryUser(args[0], ticketid)
                if (user != undefined)
                message.channel.send(`**FETCHED USER - ${user.invitee}**\n**Inviter:** ${user.inviter}\n**Date/Time:** ${user.date}\n**Invitation ID:** ${user.ticketid}`)
                else
                message.channel.send("The given user doesn't have any invitation")
                break

            case "cleardb":
                if (message.author.id != admin)
                {
                    message.channel.send("Only the **Pasta Cooker** can clear the database")
                    return
                }

                ticketid = dbmanager.ClearDB()
                break

            case "removeinvite":
                if (message.author.id != admin)
                {
                    message.channel.send("Only the **Pasta Cooker** can remove invitations")
                    return
                }

                ticketid = dbmanager.RemoveUser(args[0], ticketid)
                break

            case "addinvite":
                if (message.author.id != admin)
                {
                    message.channel.send("Only the **Pasta Cooker** can generate invitations")
                    return
                }
                
                var inviter = `${message.author.username}#${message.author.discriminator}`
                var invitee = `${args[0]}`
                var datetime = dataBase.eventdate

                if (allArgs.startsWith('"') || allArgs.startsWith("'")) // regex to not split the args if name has one or more spaces
                {
                    invitee = allArgs.split(/"(.*?)"/gm)[1];
                    datetime = allArgs.split(/"(.*?)"/gm)[2];
                }
                
                ticketid = dbmanager.AddUser(inviter, invitee, datetime, ticketid)

                webmanager.FillInvitationFile(inviter, invitee, datetime, ticketid)

                message.channel.send("Invitation successfully generated: " + "http://quicksense.ddns.net/newinvitation")
                break

            case "verify":
                    let verifyprefix = "[Pasta Verification Service] "
                    let username = `${message.author.username}#${message.author.discriminator}`
                    let isVerified = false;
                    let participantrole = message.guild.roles.cache.find(role => role.id === "892508397080047657")
                    message.channel.send(verifyprefix + "Initializing verification process for **" + message.author.toString() +" **")
                    await new Promise(resolve => setTimeout(resolve, 500))
                    message.channel.send(verifyprefix + "Fetched username: " + username)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    message.channel.send(verifyprefix + "Scanning database for invites corresponding to the username...")
                    await new Promise(resolve => setTimeout(resolve, 1000))

                    for (var i = 0; i < ticketid; i++)
                    {
                        if (database.users[i].invitee == username)
                        {
                            message.channel.send(verifyprefix + "found **1** valid invitation")
                            await new Promise(resolve => setTimeout(resolve, 500))
                            message.channel.send(verifyprefix + "**"+ message.author.toString() + "** has been verified and is ready to participate")
                            message.member.roles.add(participantrole);
                            isVerified = true;
                        }
                    }
                    if (!isVerified)
                    {
                        if (message.guild.me.permissions.has(Permissions.FLAGS.KICK_MEMBERS) && !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
                        {
                            message.channel.send(verifyprefix + "found **0** valid invitations")
                            message.channel.send(verifyprefix + "**"+ message.author.toString() + "** cannot be verified, the user will be kicked in 5 seconds...")
                            await new Promise(resolve => setTimeout(resolve, 5000))
                            message.member.send(`You have been kicked from **THE PASTA EVENT** for the following reason: "You are not eligible for the current pasta event"`)
                            .then(message.member.kick("You are not eligible for the current pasta event"))
                            message.channel.send(verifyprefix + message.author.toString() + " has been kicked")
                        }
                        else
                        {
                            message.channel.send(verifyprefix + "found **0** valid invitations")
                            message.channel.send(verifyprefix + "**"+ message.author.toString() + "** cannot be verified")
                        }
                    }
                break

            case "play":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                console.log(`${message.guild.name} | Playing song: ${eventReason} | Requested by ${message.author.username}#${message.author.discriminator}`)
                let queue = client.player.createQueue(message.guildId)
                await queue.join(message.member.voice.channel)
                let song = await queue.play(eventReason).catch(_ => {
                    if (!guildQueue) queue.stop()
                })
                message.channel.send("**Added** " + song.name + " **to the queue**")
                break

            case "skip":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                console.log(`${message.guild.name} | Skipped a song | Requested by ${message.author.username}#${message.author.discriminator}`)
                guildQueue.skip()
                message.channel.send("**Skipped:** " + guildQueue.nowPlaying)
                break

            case "stop":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                console.log(`${message.guild.name} | Stopped a song | Requested by ${message.author.username}#${message.author.discriminator}`)
                guildQueue.stop()
                message.channel.send("**Music has been stopped**")
                break

            case "volume":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                console.log(`${message.guild.name} | Set song volume to ${args[0]} | Requested by ${message.author.username}#${message.author.discriminator}`)
                guildQueue.setVolume(parseInt(args[0]))
                message.channel.send("**Volume:** " + guildQueue.volume)
                break

            case "progress":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                const ProgressBar = guildQueue.createProgressBar()
                message.channel.send(ProgressBar.prettier)
                break

            case "loopsong":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                guildQueue.setRepeatMode(RepeatMode.SONG)
                break

            case "loopqueue":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                guildQueue.setRepeatMode(RepeatMode.QUEUE)
                break

            case "unloop":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                guildQueue.setRepeatMode(RepeatMode.DISABLED)
                break

            case "pause":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                guildQueue.setPause(true)
                break

            case "resume":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                guildQueue.setPause(false)
                break

            case "shuffle":
                if (!message.member.voice.channel) {
                    message.channel.send("This command can only be executed when connected to a voice channel")
                    return
                }
                guildQueue.shuffle()
                break
        }
     }
     catch (error)
     {
         message.channel.send(error.toString())
     }
})
