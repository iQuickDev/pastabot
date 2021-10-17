const jsonformatter = require("json-stringify-pretty-compact")
const fs = require("fs")

function ParseDB()
{
    return JSON.parse(fs.readFileSync("./database.json"))
}

function ClearDB()
{
    let newDB = {tickets: 0, eventdate: "00/00/0000 00:00 GMT", users: []}
    fs.writeFileSync("./database.json", jsonformatter(newDB))
    return newDB.users.length
}

function ListInvitees()
{
    let userslist = ""
    let parsedDB = ParseDB()

    for (let i = 0; i < parsedDB.users.length; i++)
    {
        userslist += "[" + i + "] " + parsedDB.users[i].invitee + "\n"
    }

    return userslist
}

function SetEventDate(date, time, timezone)
{
    if (date.length != 10 || !date.includes("/") || time.length != 5 || !time.includes(":") || timezone.length < 1)
        return false

    let completedate = date + " " + time + " (" + timezone + ")"
    let parsedDB = ParseDB()

    parsedDB.eventdate = completedate
    fs.writeFileSync("./database.json", jsonformatter(parsedDB))

    return completedate
}

function QueryUser(invitee, ticketid)
{
    let parsedDB = ParseDB()

    for (let i = 0; i < ticketid; i++)
    {
        if (parsedDB.users[i].invitee == invitee)
        {
            return parsedDB.users[i]
        }
    }
}

function RemoveUser(invitee, ticketid)
{
    let userToRemove = invitee
    let parsedDB = ParseDB()
        
    for (let i = 0; i < ticketid; i++)
    {
        if (parsedDB.users[i].invitee == userToRemove)
        {
            parsedDB.users[i].invitee += " [DELETED]"
        }
    }

    ticketid = parsedDB.users.length
    parsedDB.tickets = ticketid

    fs.writeFileSync("./database.json", jsonformatter(parsedDB))

    return ticketid
}

function AddUser(inviter, invitee, datetime, ticketid)
{
    let newInvitation = {"inviter": inviter, "invitee": invitee, "date": datetime, "ticketid": ticketid}
    let parsedDB = ParseDB()

    if (newInvitation.ticketid == 0 && parsedDB.users.length != 0)
    newInvitation.ticketid = parsedDB.users.length

    parsedDB.users.push(newInvitation)
    ticketid = parsedDB.users.length
    parsedDB.tickets = ticketid

    fs.writeFileSync("./database.json", jsonformatter(parsedDB))

    return ticketid
}

exports.ParseDB = ParseDB
exports.ClearDB = ClearDB
exports.ListInvitees = ListInvitees
exports.SetEventDate = SetEventDate
exports.QueryUser = QueryUser
exports.RemoveUser = RemoveUser
exports.AddUser = AddUser