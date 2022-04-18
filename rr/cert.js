
import RR from '../index.js'

export default class CERT extends RR {
  constructor (opts) {
    super(opts)
  }

  /****** Resource record specific setters   *******/
  setCertType (val) {
    // The type field is the certificate type
    // the type field as an unsigned decimal integer or as a mnemonic symbol
    // this.is16bitInt('CERT', 'type', val)

    this.set('cert type', val)
  }

  setKeyTag (val) {
    // The key tag field is the 16-bit value
    // The key tag field is represented as an unsigned decimal integer.

    this.is16bitInt('CERT', 'key tag', val)

    this.set('key tag', val)
  }

  setAlgorithm (val) {
    // The algorithm field has the same meaning as the algorithm field in DNSKEY
    // The algorithm field is represented as an unsigned decimal integer
    this.is8bitInt('CERT', 'algorithm', val)

    this.set('algorithm', val)
  }

  setCertificate (val) {
    // certificate/CRL portion is represented in base 64 [16] and may be
    // divided into any number of white-space-separated substrings
    this.set('certificate', val)
  }

  getDescription () {
    return 'Certificate'
  }

  getRdataFields () {
    return [ 'cert type', 'key tag', 'algorithm', 'certificate' ]
  }

  getRFCs () {
    return [ 4398 ]
  }

  getTypeId () {
    return 37
  }

  /******  IMPORTERS   *******/

  fromBind (str) {
    // test.example.com  3600  IN  CERT  certtype, keytag, algo, cert
    const [ owner, ttl, c, type  ] = str.split(/\s+/)
    return new this.constructor({
      owner,
      ttl  : parseInt(ttl, 10),
      class: c,
      type,
    })
  }

  /******  EXPORTERS   *******/
}
