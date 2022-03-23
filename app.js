const express = require('express')
const app = express()
const cors = require('cors')
const port = 3000
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})