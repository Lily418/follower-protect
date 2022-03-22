const fs = require("fs")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const tumblr = require('tumblr.js');
const cheerio = require('cheerio');
const nlp = require('compromise')
const chalk = require('chalk')

var client = tumblr.createClient({
    consumer_key: process.env.TUMBLR_CONSUMER_KEY,
    consumer_secret: process.env.TUMBLR_CONSUMER_SECRET,
    token: process.env.TUMBLR_TOKEN,
    token_secret: process.env.TUMBLR_TOKEN_SECRET
});

const matchWords = (htmlText) => {
    const $ = cheerio.load(htmlText);
    const text = $.text()
    const doc = nlp(text)

    let anyMatches = false

    filteredWords.forEach((word) => {
        const matches = doc.match(word)
        matches.replaceWith(chalk.red(word))
        if(matches.list.length > 0) {
            anyMatches = true
        }
    })

    if(anyMatches) {
        return {
            highlightedText: doc.text(), match: true
        }
    } else {
        return {
            highlightedText: text, match: false
        }
    }

}

const printMatch = ({highlightedText, match}, url ) => {
    if(match) {
        console.log(chalk.green("--------------------"))
        console.log(chalk.green("url: " + url))
        console.log(highlightedText)
    }
}


// Make the request
client.blogFollowers('blognamehere.tumblr.com', async (err, follower) => {

    const wordList = fs.readFileSync("./word-list.txt", "utf-8").split("\n")

    console.log("wordList", wordList)

    follower.users.map(async (user) => {
        console.log(chalk.cyanBright("========================"))
        console.log(chalk.cyanBright("User: " + user.url))


        client.blogPosts(user.name, { limit: 50 }, (err, blog) => {

            printMatch(matchWords(blog.blog.description), "in bio")


            blog.posts.map((post) => {

                if(post.type === "photo") {
                    return
                }

                const htmlText = post.body || post.caption || post.answer
                if(!htmlText) {
                    console.error(post)
                    throw Error("Cannot parse")
                }

                printMatch(matchWords(htmlText), post.post_url)


                
            })
        })
    })
});