
const assert = require('assert')

const base = require('./base')
const A = require('../rr/a.js')

const validRecords = [
  {
    class  : 'IN',
    name   : 'test.example.com',
    type   : 'A',
    address: '127.0.0.127',
    ttl    : 3600,
    testR  : 'test.example.com\t3600\tIN\tA\t127.0.0.127\n',
    testT  : '+test.example.com:127.0.0.127:3600::\n',
  },
  {
    class  : 'IN',
    name   : 'test.example.com',
    type   : 'A',
    address: '127.0.0.127',
    ttl    : 2147483647,
    testR  : 'test.example.com\t2147483647\tIN\tA\t127.0.0.127\n',
    testT  : '+test.example.com:127.0.0.127:2147483647::\n',
  },
]

const moreValid = [
  {
    name : '*.example.com',
    testR: '*.example.com\t3600\tIN\tA\t127.0.0.127\n',
    testT: '+*.example.com:127.0.0.127:3600::\n',
  },
]

for (let i = 0; i < moreValid.length; i++) {
  const temp = JSON.parse(JSON.stringify(validRecords[0]))
  Object.assign(temp, moreValid[i])
  validRecords.push(temp)
}

const invalidRecords = [
  { name: '' },
  { name: 'something*' },
  { name: 'some*thing' },
  { name: '*something' },
  { name: 'something.*' },
  { address: 'hosts.not.valid.here' },
  { address: '' },
  { type: '' },
  { ttl: ''   },
  { ttl: -299 },
  { ttl: 2147483648 },
]

// copy invalid properties to an valid object
for (let i = 0; i < invalidRecords.length; i++) {
  const temp = JSON.parse(JSON.stringify(validRecords[0]))
  Object.assign(temp, invalidRecords[i])
  invalidRecords[i] = temp
}

describe('A record', function () {
  base.valid(A, validRecords)
  base.invalid(A, invalidRecords)

  for (const val of validRecords) {
    it('converts to BIND format', async function () {
      const r = new A(val).toBind()
      if (process.env.DEBUG) console.dir(r)
      assert.strictEqual(r, val.testR)
    })

    it('converts to tinydns format', async function () {
      const r = new A(val).toTinydns()
      if (process.env.DEBUG) console.dir(r)
      // console.dir(r)
      assert.strictEqual(r, val.testT)
    })
  }
})
