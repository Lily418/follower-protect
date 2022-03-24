const express = require('express')
const app = express()
const cors = require('cors')
const port = 8000
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://lily:${encodeURIComponent(`85e^soUMou6@eaMhHil%%9fO%Ct5xphwdAFBEAknNfmxg#TXh2058rcWtpu%H!U7`)}@cluster0.gp6km.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const mongo = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.use(cors())

app.get('/', async (req, res) => {
  await mongo.connect()
  const docs = await mongo.db("tumblr").collection("users").find({}).toArray()
  console.log(docs)
  res.send(docs)
})

app.post('/flag/:user/:color', async (req, res) => {
  await mongo.connect()
  const user = mongo.db("tumblr").collection("users").updateOne({ "_id": req.params.user }, { $set: { "flag": req.params.color } }, { upsert: false })
  res.send(user)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})