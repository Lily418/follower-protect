const fs = require("fs")
const tumblr = require('tumblr.js');
const cheerio = require('cheerio');
const nlp = require('compromise')
const chalk = require('chalk')
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://lily:${encodeURIComponent(process.env.TUMBLR_MONGO_PASSWORD)}@cluster0.gp6km.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const mongo = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const tumblrClient = tumblr.createClient({
    credentials: {
        consumer_key: 'WdJRCIsvQSP0iSLt02fBYpYEk5N0aJ7ayTZDgXBSEGLWPD5kar',
        consumer_secret: 'QnUiZiWbBYZte69lkaD2BrpIVmCuyFEyLrHajvcWrRPnaeNfsx',
        token: '9eGwsiYt4KSJZMZudDk5oLMmuGGUTtypuPnxZ0IYzauOD4kE3C',
        token_secret: 'EdSrFFlIP32BHQpNZ8gpkmUVdxSTE2RFB1M1PdGRvCnrlQE786'
    }, returnPromises: true
});

const matchWords = (htmlText, filteredWords) => {
    const $ = cheerio.load(htmlText);
    const text = $.text()
    const doc = nlp(text)

    let matchesListLength = 0

    filteredWords.forEach((word) => {
        const matches = doc.match(word)
        matches.replaceWith(`<span style="color: red;">${word}</span>`)
        matchesListLength = matches.list.length
    })

    return {
            highlightedText: doc.text(), matchesListLength
        }


}


const scanFollowers = async (follower) => {

    const wordList = fs.readFileSync("./word-list.txt", "utf-8").split("\n")

    return await Promise.all(follower.users.map(async (user) => {
        const blog = await tumblrClient.blogPosts(user.name, { limit: 50 })

        console.log(chalk.cyanBright("========================"))
        console.log(chalk.cyanBright("User: " + user.url))


        const bioMatch = matchWords(blog.blog.description, wordList)

        const posts =  blog.posts.map((post) => {

            if (post.type === "photo" || post.type === "video" || post.type === "audio") {
                return
            }

            const htmlText = post.body || post.caption || post.description || post.summary || post.answer || post.question
            if (!htmlText) {
                console.error(post)
                throw Error("Cannot parse")
            }

            const postMatch = matchWords(htmlText, wordList)
            if(postMatch.matchesListLength > 0) {
                return postMatch.highlightedText
            } else {
                return undefined
            }
        }).filter((x) => {
            return x
        }).concat(bioMatch.matchesListLength > 0 ? bioMatch.highlightedText : [])

        return {
            user, posts
        }
    }))
}


// Make the request
const f = async () => {

    await mongo.connect()
    const collection = mongo.db("test").collection("devices");
    let offset = 0
    let hasNext = true

    while(hasNext) {
        const allFollowers = await tumblrClient.blogFollowers('queercutlureis.tumblr.com', { limit: 20, offset })
    
        const followerRecords = await Promise.all(allFollowers.users.map(async (follower) => {
            return await mongo.db("tumblr").collection("users").findOne({ "_id": follower.url })
        }))

        allFollowers.users = allFollowers.users.filter((user, index) => {
            return followerRecords[index] === null
        })

        const followerScans = await scanFollowers(allFollowers)

        await Promise.all(followerScans.map(async ({user, posts}) => {
            return mongo.db("tumblr").collection("users").updateOne({ "_id": user.url }, { $set: { "_id": user.url, user, posts, date: new Date() } }, { upsert: true })
        }))
        if (allFollowers._links.next.href) {
            offset += 20
        } else {
            hasNext = false
        }
    }

    mongo.close()



}

f()

