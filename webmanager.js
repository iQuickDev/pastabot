const fs = require("fs")
const jsdom = require("jsdom")

const dom = jsdom.JSDOM.fromFile("client/invitation.html")

async function FillInvitationFile(inviter, invitee, datetime, ticketid)
{
    var document = (await dom).window.document

    document.querySelector("#inviter").innerHTML = inviter
    document.querySelector("#invitee").innerHTML = invitee
    document.querySelector("#datetime").innerHTML = datetime
    document.querySelector("#ticketid").innerHTML = ticketid.toString()

    fs.writeFileSync("client/newinvitation.html", (await dom).window.document.documentElement.outerHTML)
}

exports.FillInvitationFile = FillInvitationFile