const Discord = require("discord-user-bots");
const client = new Discord.Client();
const fs = require("fs");

// Used to know how many minutes has passed
const startDate = Date.now();

class Message {
    constructor(content, time, id, sender) {
        this.content = content;
        this.time = time;
        this.id = id;
        this.sender = sender;
    }
}

const messages = [];

client.on("ready", () => {
    console.log("I observe");
});

client.on("message", (message) => {


    if (message.content.startsWith("?find")) {
        const guild = client.info.guilds.filter(g => g.id == message.guild_id)[0];
        const channel = guild.channels.filter(c => c.id == message.channel_id)[0];

        // Extract the rest of the message after "?find "
        const idToFind = message.content.slice(6).trim(); // removes "?find "

        // Call your find function
        const result = find(idToFind); // should return a message object or null

        // Send the result back
        let replyContent;
        if (result) {
            replyContent = `Found message:\n` +
                           `Server: ${guild.properties.name}\n` +
                           `Channel: #${channel.name}\n` +
                           `Content: ${result.content}\n` +
                           `Sender: ${result.sender}\n` +
                           `Time: ${result.time}`;
        } else {
            replyContent = `No message found with ID: ${idToFind}`;
        }

        client.send("1409182455469965382", {
            content: replyContent,
            tts: false,
            embeds: [],
            allowed_mentions: {
                allowUsers: true,
                allowRoles: true,
                allowEveryone: true,
                allowRepliedUser: true,
            },
            components: [],
            stickers: [],
            attachments: [],
        });
    }

    
    if (message.content.startsWith("?near")) {
        const guild = client.info.guilds.filter(g => g.id == message.guild_id)[0];
        const channel = guild.channels.filter(c => c.id == message.channel_id)[0];

        // Extract the rest of the message after "?near "
        const idToFind = message.content.slice(6).trim(); // removes "?near "

        // Call findAround function
        const surroundingMessages = findAround(idToFind); // returns array of messages

        let replyContent;
        if (surroundingMessages.length > 0) {
            // Format each message using its ID instead of timestamp
            replyContent = surroundingMessages
                .map(msg => `[ID: ${msg.id}] ${msg.sender}: ${msg.content}`)
                .join("\n");
        } else {
            replyContent = `No messages found near ID: ${idToFind}`;
        }

        // Send the reply
        client.send("1409182455469965382", {
            content: replyContent,
            tts: false,
            embeds: [],
            allowed_mentions: {
                allowUsers: true,
                allowRoles: true,
                allowEveryone: true,
                allowRepliedUser: true,
            },
            components: [],
            stickers: [],
            attachments: [],
        });
    }


    

    // Get the guild and channel it was sent in
    const guild = client.info.guilds.filter(
        (guild) => guild.id == message.guild_id,
    )[0];
    const channel = guild.channels.filter(
        (channel) => channel.id == message.channel_id,
    )[0];

    const date = new Date(message.timestamp);

    // Convert to GMT+3
    const gmt3Hour = date.getUTCHours() + 3; // add 3 hours
    const hour = gmt3Hour % 24; // wrap around if > 23
    const minutes = date.getUTCMinutes().toString().padStart(2, '0'); // always 2 digits

    const localTimeString = `${hour}:${minutes}`;
    

    // Calculate the amount of minutes passed since this program started
    const minutesPassed = ((Date.now() - startDate) / 1000 / 60).toFixed(2);

    // Log everything
    // This will hold all Message objects
    messages.push(
        new Message(
            message.content,
            message.timestamp,
            message.id,
            message.author.username,
        ),
    );
    console.log(
        `[${guild.properties.name}][#${channel.name}][${localTimeString}] ${message.author.username}: ${message.content}`,
    );

    saveMessages();
});

client.on("message_delete", (message) => {
    console.log("i remember", find(message.id));
});

function saveMessages() {
    if (messages.length === 0) return; // nothing to save

    // Convert all new messages to JSON strings
    const newJson = messages
        .map((msg) => JSON.stringify(msg, null, 2))
        .join(",");

    if (!fs.existsSync("messages.json")) {
        // File doesn't exist: create a new array
        fs.writeFileSync("messages.json", `[${newJson}]`);
    } else {
        // File exists: append inside existing array
        let data = fs.readFileSync("messages.json", "utf8").trim();

        if (data.endsWith("]")) data = data.slice(0, -1); // remove closing bracket

        if (data.length > 1) data += ","; // add comma if array already has elements

        fs.writeFileSync("messages.json", data + newJson + "]");
    }

    // Clear messages array in memory
    messages.length = 0;
}

function find(id) {
    // read the file
    const data = fs.readFileSync("messages.json", "utf8");

    // parse each line as a JSON object
    const messagesFromFile = JSON.parse(data);
    const idToFind = id;
    const message = messagesFromFile.find((msg) => msg.id === idToFind);
    // find the message by id
    return message;
    //return messagesFromFile.find(msg => msg.id === id);
}

function findAround(id, range = 5) {
    // Read the file
    const data = fs.readFileSync("messages.json", "utf8");

    // Parse the JSON array
    let messagesFromFile;
    try {
        messagesFromFile = JSON.parse(data);
    } catch (e) {
        console.error("Failed to parse messages.json:", e);
        return [];
    }

    // Find the index of the message with the given id
    const index = messagesFromFile.findIndex(msg => msg.id === id);
    if (index === -1) return []; // ID not found

    // Calculate start and end indexes for slicing
    const start = Math.max(0, index - range);
    const end = Math.min(messagesFromFile.length, index + range + 1);

    // Return the slice of messages
    return messagesFromFile.slice(start, end);
}

client.login(process.env.YOUR_DISCORD_USER_TOKEN_HERE);

