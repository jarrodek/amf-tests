const { assert } = require('chai');
const amf = require('amf-client-js');

describe('CustomDomainProperty', function() {
  before(() => amf.AMF.init());

  it('should add a custom property', function() {
    const doc = new amf.model.document.Document().withId('amf://document');
    const wa = new amf.model.domain.WebApi().withName('test');
    doc.withEncodes(wa);

    const domainElement = new amf.model.domain.CustomDomainProperty();
    domainElement.withName('Test annotation');

    doc.withDeclaredElement(domainElement);

    assert.lengthOf(doc.declares, 1);
  });
});
