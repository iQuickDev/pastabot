const jsonformatter = require("json-stringify-pretty-compact")
const fs = require("fs")

function ParseDB()
{
    return JSON.parse(fs.readFileSync("./database.json"))
}

function ClearDB()
{
    let newDB = {tickets: 0, users: []}
    fs.writeFile("./database.json", jsonformatter(newDB), (err) => {if (err) return})
    return newDB.users.length
}

function SetEventDate(date, time, timezone)
{
    console.log("date length: " + date.length + "time length: " + time.length + "timezone length: " + timezone.length)
    if (date.length != 10 || !date.includes("/") || time.length != 5 || !time.includes(":") || timezone.length < 1)
        return false

    var completedate = date + " " + time + " (" + timezone + ")"

    var parsedDB = []

    fs.readFile("./database.json", (err, data) =>
    {
        if (err) return
        parsedDB = JSON.parse(data)

        parsedDB.eventdate = completedate

        fs.writeFile("./database.json", jsonformatter(parsedDB), function(err) {
            if (err) return
        })
    })

    return true
}

function QueryUser(invitee, ticketid)
{
    var tempDB = []

    tempDB = JSON.parse(fs.readFileSync("./database.json"))

    for (let i = 0; i < ticketid; i++)
    {
        if (tempDB.users[i].invitee == invitee)
        {
            return tempDB.users[i]
        }
    }
}

function RemoveUser(invitee, ticketid)
{
    let userToRemove = invitee
    let parsedDB = []

    fs.readFile("./database.json", (err, data) =>
    {
        if (err) return
        parsedDB = JSON.parse(data)
        
        for (let i = 0; i < ticketid; i++)
        {
            if (parsedDB.users[i].invitee == userToRemove)
            {
                parsedDB.users[i].invitee += " [DELETED]"
            }
        }

        ticketid = parsedDB.users.length
        parsedDB.tickets = ticketid

        fs.writeFile("./database.json", jsonformatter(parsedDB), function(err) {
            if (err) return
        })
    })

    return ticketid
}

function AddUser(inviter, invitee, datetime, ticketid)
{
    var parsedDB = []
    var newInvitation = {"inviter": inviter, "invitee": invitee, "date": datetime, "ticketid": ticketid}

    fs.readFile("./database.json", (err, data) =>
    {
        if (err) return
        parsedDB = JSON.parse(data)

        if (newInvitation.ticketid == 0 && parsedDB.users.length != 0)
        newInvitation.ticketid = parsedDB.users.length

        parsedDB.users.push(newInvitation)
        ticketid = parsedDB.users.length
        parsedDB.tickets = ticketid

        fs.writeFile("./database.json", jsonformatter(parsedDB), function(err) {
            if (err) return
        })
    })
    return ticketid
}

exports.ParseDB = ParseDB
exports.ClearDB = ClearDB
exports.SetEventDate = SetEventDate
exports.QueryUser = QueryUser
exports.RemoveUser = RemoveUser
exports.AddUser = AddUser