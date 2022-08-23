const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

const customers = []

const verifyIfAccountExistsWithCPF = (req, res, next) => {
  const { cpf } = req.headers

  const customer = customers.find(customer => customer.cpf === cpf)
  if (!customer){
    return res.status(400).json({ error: "customer not found" })
  }

  req.customer = customer

  return next()
}

const getBalance = (statement) => {
  let aux = 0
  statement.forEach(el => {
    aux += el.amount
  }, aux)
  return aux
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)
  if (customerAlreadyExists){
    return res.status(400).json({ error: "customer already exists" })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return res.status(201).send()
})

app.put('/account', verifyIfAccountExistsWithCPF, (req, res) => {
  const { name } = req.body

  customers.forEach(acc => {
    if (acc.id === req.customer.id){
      acc.name = name
      return res.status(201).send()
    }
  })
})

app.get('/account', verifyIfAccountExistsWithCPF, (req, res) => {
  return res.status(200).json({ customer: req.customer })
})

app.get('/account/balance', verifyIfAccountExistsWithCPF, (req, res) => {
  const balance = getBalance(req.customer.statement)
  return res.status(200).json({ balance })
})

app.delete('/account', verifyIfAccountExistsWithCPF, (req, res) => {
  customers.splice(req.customer, 1)
  return res.status(200).json({ customers })
})

app.post('/deposit', verifyIfAccountExistsWithCPF, (req, res) => {
  const { description, amount } = req.body

  req.customer.statement.push({
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  })

  return res.status(201).send()
})

app.post('/withdraw', verifyIfAccountExistsWithCPF, (req, res) => {
  const { description, amount } = req.body

  const balance = getBalance(req.customer.statement)
  if (amount > balance){
    return res.status(400).json({ error: "insufficient funds" })
  }
  
  req.customer.statement.push({
    description,
    amount: -amount,
    createdAt: new Date(),
    type: 'debit'
  })

  return res.status(201).send()
})

app.get('/statement', verifyIfAccountExistsWithCPF, (req, res) => {
  const balance = getBalance(req.customer.statement)
  return res.status(200).json({ statement: req.customer.statement, balance })
})

app.get('/statement/date', verifyIfAccountExistsWithCPF, (req, res) => {
  const { date } = req.query

  const dateFormat = new Date(date + ' 00:00')
  const statementsByDate = req.customer.statement.filter(el => el.createdAt.toDateString() === new Date(dateFormat).toDateString())
  
  return res.status(200).json({ statementsByDate })
})

app.get('/', (req, res) => {
  return res.status(200).json({ message: 'hello world ignite' })
})

app.listen(3333)