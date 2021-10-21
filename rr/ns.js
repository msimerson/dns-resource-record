
const RR = require('./index')

class NS extends RR {
  constructor (opts) {
    super(opts)

    if (!this.fullyQualified('NS', 'address', opts.address)) return
    if (!this.validHostname('NS', 'address', opts.address)) return
    this.set('address', opts.address)
  }
}

module.exports = NS
