
const net = require('net')

class RR extends Map {

  constructor (opts) {
    super()

    this.class(opts?.class)
    this.name (opts?.name)
    this.ttl  (opts?.ttl)
    this.type (opts?.type)
  }

  class (c) {
    switch (c) {
      case 'IN':
      case undefined:
        this.set('class', 'IN')
        break
      case 'CS':
      case 'CH':
      case 'HS':
        this.set('class', c)
        break
      default:
        throw new Error(`invalid class ${c}`)
    }
  }

  name (n) {
    if (n === undefined) throw new Error(`name is required`)

    if (n.length < 1 || n.length > 255)
      throw new Error('Domain names must have 1-255 octets (characters): RFC 2181')

    this.hasValidLabels(n)

    this.set('name', n)
  }

  ttl (t) {

    if (t === undefined) return

    if (typeof t !== 'number') throw new Error(`TTL must be numeric (${typeof t})`)

    if (parseInt(t, 10) !== t) {
      throw new Error('TTL must be a an unsigned integer')
    }

    // RFC 1035, 2181
    if (!this.is32bitInt(this.name, 'TTL', t)) return

    this.set('ttl', t)
  }

  type (t) {
    const types = [
      'A', 'AAAA', 'CAA', 'CNAME', 'DNAME', 'LOC', 'MX', 'NAPTR', 'NS',
      'PTR', 'SSHFP', 'SOA', 'SRV', 'TXT', 'URI',
    ]
    if (!types.includes(t)) throw new Error(`type ${t} not supported (yet)`)
    this.set('type', t)
  }

  hasValidLabels (hostname) {
    for (const label of hostname.split('.')) {
      if (label.length < 1 || label.length > 63)
        throw new Error('Labels must have 1-63 octets (characters)')
    }
  }

  is8bitInt (type, field, value) {
    if (typeof value === 'number'
      && parseInt(value, 10) === value  // assure integer
      && value >= 0
      && value <= 255) return true

    throw new Error(`$type} {field} must be a 8-bit integer (in the range 0-255)`)
  }

  is16bitInt (type, field, value) {
    if (typeof value === 'number'
      && parseInt(value, 10) === value  // assure integer
      && value >= 0
      && value <= 65535) return true

    throw new Error(`$type} {field} must be a 16-bit integer (in the range 0-65535)`)
  }

  is32bitInt (type, field, value) {
    if (typeof value === 'number'
      && parseInt(value, 10) === value  // assure integer
      && value >= 0
      && value <= 2147483647) return true

    throw new Error(`$type} {field} must be a 32-bit integer (in the range 0-2147483647)`)
  }

  fullyQualified (type, blah, hostname) {
    if (hostname.slice(-1) === '.') return true

    throw new Error(`${type}: ${blah} must be fully qualified`)
  }

  validHostname (type, field, hostname) {
    if (!/[^a-zA-Z0-9\-._]/.test(hostname)) return true

    throw new Error(`${type}, ${field} has invalid hostname characters`)
  }
}

class A extends RR {
  constructor (opts) {
    super(opts)

    this.address(opts.address)
  }

  address (val) {
    if (!val) throw new Error('A: address is required')
    if (!net.isIPv4(val)) throw new Error('A address must be IPv4')
    this.set('address', val)
  }
}

class AAAA extends RR {
  constructor (opts) {
    super(opts)

    this.address(opts?.address)
  }

  address (val) {
    if (!val) throw new Error('AAAA: address is required')
    if (!net.isIPv6(val)) throw new Error('AAAA: address must be IPv6')
    this.set('address', val)
  }
}

class CAA extends RR {
  constructor (opts) {
    super(opts)

    this.flags(opts?.flags)
    this.tags(opts?.tags)
    this.value(opts?.value)
  }

  flags (val) {
    if (!this.is8bitInt('CAA', 'flags', val)) return

    if ([ 0, 128 ].includes(val)) {
      console.warn(`CAA flags ${val} not recognized: RFC 6844`)
    }

    this.set('flags', val)
  }

  tags (val) {
    if (typeof val !== 'string'
      || val.length < 1
      || /[A-Z]/.test(val)
      || /^[a-z0-9]/.test(val))
      throw new Error('CAA flags must be a sequence of ASCII letters and numbers in lowercase: RFC 8659')

    if ([ 'issue', 'issuewild', 'iodef' ].includes(val)) {
      console.warn(`CAA tags ${val} not recognized: RFC 6844`)
    }
    this.set('tags', val)
  }

  value (val) {
    // either (2) a quoted string or
    // (1) a contiguous set of characters without interior spaces
    if (!/["']/.test(val) && /\s/.test(val)) {
      throw new Error(`CAA value may not have spaces unless quoted: RFC 8659`)
    }

    // const iodefSchemes = [ 'mailto:', 'http:', 'https:' ]
    // TODO: check if val starts with one of iodefSchemes, RFC 6844

    this.set('value', val)
  }
}

class CNAME extends RR {
  constructor (opts) {
    super(opts)

    this.address(opts?.address)
  }

  address (val) {
    if (!val) throw new Error('CNAME: address is required')

    if (net.isIPv4(val) || net.isIPv6(val))
      throw new Error(`CNAME: address must be a FQDN: RFC 2181`)

    if (!this.fullyQualified('CNAME', 'address', val)) return
    if (!this.validHostname('CNAME', 'address', val)) return
    this.set('address', val)
  }
}

class DNAME extends RR {
  constructor (opts) {
    super(opts)

    this.target(opts?.target)
  }

  target (val) {
    if (!val) throw new Error('DNAME: target is required')

    if (net.isIPv4(val) || net.isIPv6(val))
      throw new Error(`DNAME: target must be a domain name: RFC 6672`)

    if (!this.fullyQualified('DNAME', 'target', val)) return
    if (!this.validHostname('DNAME', 'target', val)) return
    this.set('target', val)
  }
}

class LOC extends RR {
  constructor (opts) {
    super(opts)

    this.address(opts?.address)
  }

  address (val) {
    // todo: validate this with https://datatracker.ietf.org/doc/html/rfc1876
    this.set('address', val)
  }
}

class MX extends RR {
  constructor (opts) {
    super(opts)

    this.address(opts?.address)
    this.weight(opts?.weight)
  }

  address (val) {
    if (!val) throw new Error('MX: address is required')

    if (net.isIPv4(val) || net.isIPv6(val))
      throw new Error(`MX: address must be a FQDN: RFC 2181`)

    if (!this.fullyQualified('MX', 'address', val)) return
    if (!this.validHostname('MX', 'address', val)) return
    this.set('address', val)
  }

  weight (val) {
    if (!this.is16bitInt('MX', 'weight', val)) return
    this.set('weight', val)
  }
}

class NAPTR extends RR {
  constructor (obj) {
    super(obj)

    this.order(obj?.order)
    this.preference(obj?.preference)
    this.flags(obj?.flags)
    this.service(obj?.service)
  }

  order (val) {
    if (!this.is16bitInt('NAPTR', 'order', val)) return

    this.set('order', val)
  }

  preference (val) {
    if (!this.is16bitInt('NAPTR', 'preference', val)) return
    this.set('preference', val)
  }

  flags (val) {
    if (![ 'S', 'A', 'U', 'P' ].includes(val))
      throw new Error (`NAPTR flags are invalid: RFC 2915`)

    this.set('flags', val)
  }

  service (val) {
    this.set('service', val)
  }
}

class NS extends RR {
  constructor (opts) {
    super(opts)

    if (!this.fullyQualified('NS', 'address', opts.address)) return
    if (!this.validHostname('NS', 'address', opts.address)) return
    this.set('address', opts.address)
  }
}

class PTR extends RR {
  constructor (obj) {
    super(obj)

    if (obj?.dname) {
      this.dname(obj?.dname)
    }
    else if (obj?.rdata) { // Generic DNS packet content
      this.dname(obj?.rdata)
    }
    else if (obj?.ptrdname) { // RFC 1035
      this.dname(obj?.ptrdname)
    }
  }

  dname (val) {
    if (!this.fullyQualified('PTR', 'dname', val)) return
    if (!this.validHostname('PTR', 'dname', val)) return

    this.set('dname', val)
  }
}

class SRV extends RR {
  constructor (opts) {
    super(opts)

    this.priority(opts?.priority)
    this.weight(opts?.weight)
    this.port(opts?.port)
    this.target(opts?.target)
  }

  priority (val) {
    if (!this.is16bitInt('SRV', 'priority', val)) return

    this.set('priority', val)
  }

  port (val) {
    if (!this.is16bitInt('SRV', 'port', val)) return

    this.set('port', val)
  }

  weight (val) {
    if (!this.is16bitInt('SRV', 'weight', val)) return

    this.set('weight', val)
  }

  target (val) {

    if (!val) throw new Error('SRV: target is required')

    if (net.isIPv4(val) || net.isIPv6(val))
      throw new Error(`SRV: target must be a FQDN: RFC 2782`)

    if (!this.fullyQualified('SRV', 'target', val)) return
    if (!this.validHostname('SRV', 'target', val)) return
    this.set('target', val)
  }
}

class SSHFP extends RR {
  constructor (opts) {
    super(opts)

    this.algorithm(opts?.algorithm)
    this.type(opts?.type)
    this.fingerprint(opts?.fingerprint)
  }

  algorithm (val) {
    // (0: reserved; 1: RSA 2: DSA 3: ECDSA 4: Ed25519 6:Ed448
    if (!this.is8bitInt('SSHFP', 'algorithm', val)) return

    this.set('algorithm', val)
  }

  type (val) {
    // 0: reserved, 1: SHA-1
    if (!this.is8bitInt('SSHFP', 'type', val)) return

    this.set('type', val)
  }

  fingerprint (val) {
    this.set('fingerprint', val)
  }
}

class SOA extends RR {
  constructor (opts) {
    super(opts)

    // name is the zone name

    // ttl, minimum (used for negative caching, since RFC 2308)
    // RFC 1912 sugggests 1-5 days
    // RIPE recommends 3600 (1 hour)

    const fields = [ 'mname', 'rname', 'serial', 'refresh', 'retry', 'expire' ]
    for (const f of fields) {
      this[f](opts[f])
    }
  }

  // MNAME (primary NS)
  mname (val) {
    if (!this.validHostname('SOA', 'MNAME', val)) return
    if (!this.fullyQualified('SOA', 'MNAME', val)) return
    this.set('mname', val)
  }

  // RNAME (email of admin)  (escape . with \)
  rname (val) {
    if (!this.validHostname('SOA', 'RNAME', val)) return
    if (!this.fullyQualified('SOA', 'RNAME', val)) return
    if (/@/.test(val)) throw new Error('SOA RNAME replaces @ with a . (dot).')
    this.set('rname', val)
  }

  serial (val) {
    if (!this.is32bitInt('SOA', 'serial', val)) return

    this.set('serial', val)
  }

  refresh (val) {
    // refresh (seconds after which to check with master for update)
    // RFC 1912 suggests 20 min to 12 hours
    // RIPE recommends 86400 (24 hours)
    if (!this.is32bitInt('SOA', 'serial', val)) return

    this.set('refresh', val)
  }

  retry (val) {
    // seconds after which to retry serial # update
    // RIPE recommends 7200 seconds (2 hours)

    if (!this.is32bitInt('SOA', 'serial', val)) return

    this.set('retry', val)
  }

  expire (val) {
    // seconds after which secondary should drop zone if no master response
    // RFC 1912 suggests 2-4 weeks
    // RIPE suggests 3600000 (1,000 hours, 6 weeks)
    if (!this.is32bitInt('SOA', 'serial', val)) return

    this.set('expire', val)
  }
}

class TXT extends RR {
  constructor (opts) {
    super(opts)

    this.address(opts?.address)
  }

  address (val) {
    this.set('address', val)
  }
}

class URI extends RR {
  constructor (opts) {
    super(opts)

    this.priority(opts?.priority)
    this.weight(opts?.weight)
    this.target(opts?.target)
  }

  priority (val) {
    if (!this.is16bitInt('URI', 'priority', val)) return

    this.set('priority', val)
  }

  weight (val) {
    if (!this.is16bitInt('URI', 'weight', val)) return

    this.set('weight', val)
  }

  target (val) {
    if (!val) throw new Error('URI: target is required')

    this.set('target', val)
  }
}

module.exports.A     = A
module.exports.AAAA  = AAAA
module.exports.CAA   = CAA
module.exports.CNAME = CNAME
module.exports.DNAME = DNAME
module.exports.LOC   = LOC
module.exports.MX    = MX
module.exports.NAPTR = NAPTR
module.exports.NS    = NS
module.exports.PTR   = PTR
module.exports.SSHFP = SSHFP
module.exports.SOA   = SOA
module.exports.SRV   = SRV
module.exports.TXT   = TXT
module.exports.URI   = URI
