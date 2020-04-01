//cloud firestore and realtime database are two database services of firebase...
const admin = require('firebase-admin')

const serviceAccount = require('../config/firebase-key.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

module.exports = db
