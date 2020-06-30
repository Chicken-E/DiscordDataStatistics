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
let attachements_txt = ""

//count for the most active channel
let highest_count = 0
let highest_count_channel = ""

//total message count
let total = 0; 

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
            attachements_txt += Attachments ? Attachments + "\n" : "";
        })
        //test for the most active channel
        if(rows.length>highest_count) {
            highest_count = rows.length;
            highest_count_channel = id;
        }
        //increase total
        total += rows.length;
        //resolve promise when done processing
        resolve();
        })
    }))
})

//wait till all files have been processed
Promise.all(promises).then(v=>{
    //make printable data
    messages_txt += messages_full.sort((a,b)=>a.time-b.time).map(m=>`${m.msgid},${m.cid},${m.time},${m.message.replace(/\n/g, " ")}`).join("\n")

    //if outputting to file output the extracted data to files
    if(OUTPUT_TO_FILE) {
        fs.writeFileSync("messages.csv", messages_txt, {encoding: "utf-8"})
        fs.writeFileSync("attachements.txt", attachements_txt, {encoding: "utf-8"})
        console.log("\x1b[0m\x1b[2m\x1b[34mOutputted messages and attachements to their own files.\x1b[0m")
        console.log("\x1b[0m\x1b[2m\x1b[34mAttachements in \"attachements.txt\" seperated by newline (\\n). Sorted by some magic factor!\x1b[0m")
        console.log("\x1b[0m\x1b[2m\x1b[34mMessages in \"messages.csv\" in columns of message id, channel id, timestamp, message. Sorted by timestamp.\x1b[0m")
    }

    //output statistics (the weird chars are just color codes)
    console.log("")
    console.log("\x1b[0m\x1b[1m\x1b[4m\x1b[32mMESSAGE STATISTICS BY Chicken#4127\x1b[0m")
    console.log("")
    console.log("\x1b[0m\x1b[1m\x1b[33mTotal messages: \x1b[0m\x1b[36m" + total)
    console.log("\x1b[0m\x1b[1m\x1b[33mCharacters typed: \x1b[0m\x1b[36m" + messages_full.map(m=>m.message).join("").length)
    console.log("\x1b[0m\x1b[1m\x1b[33mAttachements sent: \x1b[0m\x1b[36m" + (attachements_txt.split("\n").length-1))
    console.log("\x1b[0m\x1b[1m\x1b[33mCharacters per message: \x1b[0m\x1b[36m" + (messages_full.map(m=>m.message).join("").length / total).toFixed(1))
    console.log("\x1b[0m\x1b[1m\x1b[33mMessages per channel: \x1b[0m\x1b[36m" + (total / Object.keys(data).length).toFixed(1))
    console.log("\x1b[0m\x1b[1m\x1b[33mTotal channels: \x1b[0m\x1b[36m" + Object.keys(data).length)
    console.log("\x1b[0m\x1b[1m\x1b[33mMost active channel: \x1b[0m\x1b[36m#" + data[highest_count_channel] + " (" + highest_count_channel + ")")
    console.log("\x1b[0m")
})
