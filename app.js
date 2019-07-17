const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const PDFDocument = require('pdfkit')
const fs = require('fs')

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('./public'))

function getConnection() {
    return mysql.createConnection({
        host: 'localhost',
        user: '***',
        password: '***',
        database: 'taskdb'
    })
}

app.post('/generate_pdf', (req, res) => {
    const connection = getConnection()

    const firstName = req.body.first_name
    const findQueryString = "SELECT * FROM users WHERE firstName = ?"
    connection.query(findQueryString, [firstName], (err, results, fields) => {
        if (err) {
            console.log('failed to query for users: ' + err)
            res.sendStatus(500)
            return
        }
        const doc = new PDFDocument();
        const stream = doc.pipe(fs.createWriteStream('output.pdf'))
        doc.fontSize(16).text(results[0].firstName + ' ' + results[0].lastName, 100, 100)
        doc.image(results[0].image, {
            fit: [250, 300],
            align: 'center',
            valign: 'center'
        })
        doc.save()
        doc.end()
        stream.on('finish', () => {
            const pdf = fs.readFileSync('./output.pdf')
            const generateQueryString = "UPDATE users SET pdf = ? WHERE firstName = ?"
            connection.query(generateQueryString, [pdf, firstName], (err, results, fields) => {
                if (err) {
                    console.log('failed to query for users: ' + err)
                    res.sendStatus(500)
                    return
                }
            })
            response = { 'isExists': true }
            res.json(response)
        })
    })
})

app.get('/', (req, res) => {
    res.send('root')
})

app.listen(3303, () => {
    console.log('+')
})