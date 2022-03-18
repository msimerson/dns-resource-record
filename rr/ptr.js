
const RR = require('./index').RR

class PTR extends RR {
  constructor (opts) {
    super(opts)
  }

  /****** Resource record specific setters   *******/
  setDname (val) {
    this.fullyQualified('PTR', 'dname', val)
    this.validHostname('PTR', 'dname', val)

    this.set('dname', val)
  }

  getDescription () {
    return 'Pointer'
  }

  getRdataFields (arg) {
    return [ 'dname' ]
  }

  getRFCs () {
    return [ 1035 ]
  }

  getTypeId () {
    return 12
  }

  /******  IMPORTERS   *******/
  fromTinydns (str) {
    // ^fqdn:p:ttl:timestamp:lo
    const [ fqdn, p, ttl, ts, loc ] = str.substring(1).split(':')

    return new this.constructor({
      type     : 'PTR',
      name     : fqdn,
      dname    : p,
      ttl      : parseInt(ttl, 10),
      timestamp: ts,
      location : loc !== '' && loc !== '\n' ? loc : '',
    })
  }

  fromBind (str) {
    // test.example.com  3600  IN  PTR  dname
    const [ fqdn, ttl, c, type, dname ] = str.split(/\s+/)
    return new this.constructor({
      class: c,
      type : type,
      name : fqdn,
      dname: dname,
      ttl  : parseInt(ttl, 10),
    })
  }

  /******  EXPORTERS   *******/
  toTinydns () {
    return `^${this.get('name')}:${this.get('dname')}:${this.getEmpty('ttl')}:${this.getEmpty('timestamp')}:${this.getEmpty('location')}\n`
  }
}

module.exports = PTR
