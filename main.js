const Discord = require("discord.js")
const config = require("./config.json")
const database = require("./database.json")
const {Client, Intents, Permissions} = require("discord.js")
const {Player, RepeatMode} = require("discord-music-player")
const http = require("http")
const fs = require("fs")
const jsdom = require("jsdom")
const { jsonfy } = require("booru/dist/Utils")
const jsonformatter = require("json-stringify-pretty-compact")


const dom = jsdom.JSDOM.fromFile("./invitation.html")

const hostname = "0.0.0.0"
const port = 80
var responseData = fs.readFileSync("./newinvitation.html")

const server = http.createServer((req, res) => {
    res.statusCode = 200
    res.setHeader("Content-Type", "text/html")
    res.end(responseData)

}).listen(port, hostname)

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

function AddUserToLocalDatabase(inviter, invitee, datetime, ticketid)
{
    var parsedDB = []
    var newInvitation = {"inviter": inviter, "invitee": invitee, "date": datetime, "ticketid": ticketid}

    fs.readFile("./database.json", function (err, data)
    {
        if (err) return
        parsedDB = JSON.parse(data)
        parsedDB.users.push(newInvitation)
        parsedDB.ticketcount += 1;

        fs.writeFile("./database.json", jsonformatter(parsedDB), function(err) {
            if (err) return
        })
    })
}

client.on("messageCreate", async message => {
    try
     {
        if (!message.content.startsWith(config.prefix) || message.author.bot) return

        let guildQueue = client.player.getQueue(message.guild.id)

        const args = message.content.slice(config.prefix.length).split(/ +/)
        const command = args.shift().toLowerCase()
        const allArgs = args.join().replaceAll(","," ").replace(/<.*>/gm, "")

        switch (command)
        {
            case "addinvite":

                var document = (await dom).window.document
                
                var inviter = `${message.author.username}#${message.author.discriminator}`
                var invitee = `${args[0]}`
                var datetime = `${args[1]} - ${args[2]} (${args[3]})`
                var ticketid = `${database.ticketcount}`
                
                AddUserToLocalDatabase(inviter, invitee, datetime, ticketid)

                document.querySelector("#inviter").innerHTML = inviter
                document.querySelector("#invitee").innerHTML = invitee
                document.querySelector("#datetime").innerHTML = datetime
                document.querySelector("#ticketid").innerHTML = ticketid

                fs.writeFileSync("newinvitation.html", (await dom).window.document.documentElement.outerHTML)
                
                responseData = fs.readFileSync("./newinvitation.html")

                message.channel.send("The invite has been generated at the following url: " + "http://quicksense.ddns.net/newinvitation.html")
                break

            case "verify":
                    let verifyprefix = "[Pasta Verification Service] "
                    let username = `${message.author.username}#${message.author.discriminator}`
                    let isVerified = false;
                    let participantrole = message.guild.roles.cache.find(role => role.name === "Pasta Admirer");
                    message.channel.send(verifyprefix + "Initializing verification process for **" + message.author.toString() +" **")
                    await new Promise(resolve => setTimeout(resolve, 500));
                    message.channel.send(verifyprefix + "Fetched username: " + username)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    message.channel.send(verifyprefix + "Scanning database for invites corresponding to the id...")
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    for (var i = 0; i < database.users.length; i++)
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
                        message.channel.send(verifyprefix + "**"+ message.author.toString() + "** cannot be verified, the user will be kicked in 5 seconds...")
                        await new Promise(resolve => setTimeout(resolve, 5000))
                        message.member.send(`You have been kicked from **THE PASTA EVENT** for the following reason: "You are not eligible for the current pasta event"`)
                        message.member.kick("You are not eligible for the current pasta event")
                        message.channel.send(verifyprefix + message.author.toString() + " has been kicked")
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