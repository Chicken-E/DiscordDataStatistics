//csv parser
const csv = require("csv-parser")
//filesystem module
const fs = require("fs");
//indexing file for the messages
const data = require(__dirname + "/messages/index.json")

//variable to change if outputting data to files
const OUTPUT_TO_FILE = true;

//variables with all the data
let messages_full = []
let messages_txt = "messageid,channelid,time,message\n"
let attachments_full = []
let attachments_txt = "messageid,channelid,time,attachments\n"

//count for the most active channel
let highest_count = 0
let highest_count_channel = ""

//array for promises
let promises = [];

//loop the channels
Object.keys(data).forEach(id=>{
    promises.push(new Promise((resolve,reject)=>{
    let rows = [];
    fs.createReadStream("messages/"+id+"/messages.csv")
    .pipe(csv())
    .on('data', (data) => rows.push(data))
    .on('end', () => {
        rows.forEach(row=>{
            let {ID, Timestamp, Contents, Attachments} = row;
            //push to message array
            messages_full.push({
                cid: id,
                msgid: ID,
                time: new Date(Timestamp).getTime(),
                message: Contents
            })
            //add attachment to list
            if(Attachments) {
                attachments_full.push({
                    cid: id,
                    msgid: ID,
                    time: new Date(Timestamp).getTime(),
                    attachments: Attachments
                })
            }
        })
        //test for the most active channel
        if(rows.length>highest_count) {
            highest_count = rows.length;
            highest_count_channel = id;
        }
        //resolve promise when done processing
        resolve();
        })
    }))
})

//wait till all files have been processed
Promise.all(promises).then(v=>{
    //make printable data
    messages_txt += messages_full.sort((a,b)=>a.time-b.time).map(m=>`${m.msgid},${m.cid},${m.time},${m.message}`).join("\n")
    attachments_txt += attachments_full.sort((a,b)=>a.time-b.time).map(m=>`${m.msgid},${m.cid},${m.time},${m.attachments}`).join("\n")

    //if outputting to file output the extracted data to files
    if(OUTPUT_TO_FILE) {
        fs.writeFileSync("messages.csv", messages_txt, {encoding: "utf-8"})
        fs.writeFileSync("attachments.csv", attachments_txt, {encoding: "utf-8"})
        console.log("\x1b[0m\x1b[2m\x1b[34mOutputted messages and attachments to their own files.")
        console.log("Attachments in \"attachments.csv\" in columns of message id, channel id, timestamp, attachments.")
        console.log("Messages in \"messages.csv\" in columns of message id, channel id, timestamp, message.")
        console.log("Both sorted by timestamp.\x1b[0m")
    }

    //output statistics (the weird chars are just color codes)
    console.log("")
    console.log("\x1b[0m\x1b[1m\x1b[4m\x1b[32mMESSAGE STATISTICS BY Chicken#4127\x1b[0m")
    console.log("")
    console.log("\x1b[0m\x1b[1m\x1b[33mTotal messages: \x1b[0m\x1b[36m" +  messages_full.length)
    console.log("\x1b[0m\x1b[1m\x1b[33mCharacters typed: \x1b[0m\x1b[36m" + messages_full.map(m=>m.message).join("").length)
    console.log("\x1b[0m\x1b[1m\x1b[33mAttachments sent: \x1b[0m\x1b[36m" + attachments_full.length)
    console.log("\x1b[0m\x1b[1m\x1b[33mCharacters per message: \x1b[0m\x1b[36m" + (messages_full.map(m=>m.message).join("").length / messages_full.length).toFixed(1))
    console.log("\x1b[0m\x1b[1m\x1b[33mMessages per channel: \x1b[0m\x1b[36m" + (messages_full.length / Object.keys(data).length).toFixed(1))
    console.log("\x1b[0m\x1b[1m\x1b[33mTotal channels: \x1b[0m\x1b[36m" + Object.keys(data).length)
    console.log("\x1b[0m\x1b[1m\x1b[33mMost active channel: \x1b[0m\x1b[36m#" + data[highest_count_channel] + " (" + highest_count_channel + ")")
    console.log("\x1b[0m")
})
