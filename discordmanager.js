function Purge(message, num)
{
    if (!isNaN(num)) {
        if (num > 100)
            num = 100
        message.channel.bulkDelete(num)
        message.channel.send("The chat has been cleared by " + message.member.toString())
    }
    else
        message.channel.send("The given value is not a number")
}

exports.Purge = Purge