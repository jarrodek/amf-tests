import { assert } from 'chai';
import amf from 'amf-client-js';

/** @typedef {import('amf-client-js').SchemaShape} SchemaShape */
/** @typedef {import('amf-client-js').WebApi} WebApi */
/** @typedef {import('amf-client-js').ScalarShape} ScalarShape */
/** @typedef {import('amf-client-js').UnionShape} UnionShape */
/** @typedef {import('amf-client-js').NodeShape} NodeShape */

describe('Beta tests', function() {
  describe('restoring XML schema', () => {
    it('has xsd schema', async () => {
      // parsing
      const configuration = amf.RAMLConfiguration.RAML10();
      const ro = new amf.RenderOptions().withCompactUris().withPrettyPrint().withSourceMaps();
      const client = configuration.withRenderOptions(ro).baseUnitClient();
      const result = await client.parseDocument('file://apis/schema/schema.raml');

      const doc = /** @type amf.Document */ (result.baseUnit);
      const types = /** @type SchemaShape[] */ (doc.findByType('http://a.ml/vocabularies/shapes#SchemaShape'));
      assert.lengthOf(types, 2, 'has 2 schema shapes');
      const type = types.find(i => i.name.value() === 'XmlRefSchema');
      const rawSrc = type.raw.value();
      assert.typeOf(rawSrc, 'string');
      assert.isNotEmpty(rawSrc);

      // serialization
      const transformed = client.transform(result.baseUnit, amf.PipelineId.Editing);
      const rendered = client.render(transformed.baseUnit, 'application/ld+json');

      // restoring
      const c2 = amf.RAMLConfiguration.RAML10().baseUnitClient();
      const restored = await c2.parseContent(rendered);
      const restoredDoc = /** @type amf.Document */ (restored.baseUnit);
      const restoredTypes = /** @type SchemaShape[] */ (restoredDoc.findByType('http://a.ml/vocabularies/shapes#SchemaShape'));
      assert.lengthOf(restoredTypes, 2, 'has 2 schema shapes');
      const restoredType = restoredTypes.find(i => i.name.value() === 'XmlRefSchema');
      const rawTrg = restoredType.raw.value();
      assert.typeOf(rawTrg, 'string');
      assert.isNotEmpty(rawTrg);
    });
  });

  describe('reading relative path', () => {
    it('has the relative path', async () => {
      const configuration = amf.RAMLConfiguration.RAML10();
      const ro = new amf.RenderOptions().withCompactUris().withPrettyPrint().withSourceMaps();
      const client = configuration.withRenderOptions(ro).baseUnitClient();
      const result = await client.parseDocument('file://apis/paths/paths.raml');

      const doc = /** @type amf.Document */ (result.baseUnit);
      const wa = /** @type WebApi */ (doc.encodes);
      const endpoint = wa.endPoints.find((ep) => ep.path.value() === '/people/{personId}');
      // btw, it might be intentional change and it's totally OK. API console does not use this property.
      // However, I has a test like this working with AMF 4 and it is not working with 5.
      assert.equal(endpoint.relativePath, '/people/{personId}', 'is consistent with AMF v4')
    });
  });

  describe('data types', () => {
    /** @type amf.Document */
    let doc;

    before(async () => {
      const configuration = amf.RAMLConfiguration.RAML10();
      const ro = new amf.RenderOptions().withCompactUris().withPrettyPrint().withSourceMaps();
      const client = configuration.withRenderOptions(ro).baseUnitClient();
      const result = await client.parseDocument('file://apis/types/types.raml');

      if (!result.conforms) {
        result.results.forEach(i => console.error(i.message));
        throw new Error(`Api does not conform`);
      }

      // serialization
      const transformed = client.transform(result.baseUnit, amf.PipelineId.Editing);
      if (!transformed.conforms) {
        transformed.results.forEach(i => console.error(i.message));
        throw new Error(`Api does not conform`);
      }

      const rendered = client.render(transformed.baseUnit, 'application/ld+json');

      // restoring
      const c2 = amf.RAMLConfiguration.RAML10().baseUnitClient();
      const restored = await c2.parseContent(rendered);
      doc = /** @type amf.Document */ (restored.baseUnit);
    });

    it('inherits number scalar properties', async () => {
      const list = /** @type ScalarShape[] */ (doc.findByType('http://a.ml/vocabularies/shapes#ScalarShape'));
      const type = list.find(i => i.name.value() === 'NumberWithParent');
      assert.equal(type.dataType.value(), 'http://www.w3.org/2001/XMLSchema#integer', 'has parent\'s data type');
      assert.equal(type.minimum.value(), 10, 'has parent\'s minimum');
      assert.equal(type.maximum.value(), 200, 'has own maximum');
      assert.equal(type.defaultValueStr.value(), '2', 'has own defaultValue');

      assert.lengthOf(type.values, 3, 'has parent\'s enum');
      assert.lengthOf(type.examples, 1, 'has parent\'s examples');
      assert.equal(type.multipleOf.value(), 5, 'has parent\'s multipleOf');
    });

    it('inherits string scalar properties', async () => {
      const list = /** @type ScalarShape[] */ (doc.findByType('http://a.ml/vocabularies/shapes#ScalarShape'));
      const type = list.find(i => i.name.value() === 'StringWithParent');
      assert.equal(type.dataType.value(), 'http://www.w3.org/2001/XMLSchema#string', 'has parent\'s data type');
      assert.equal(type.pattern.value(), '^[a-zA-Z0-9]*$', 'has own pattern');
      
      assert.lengthOf(type.values, 3, 'has parent\'s enum');
      assert.lengthOf(type.examples, 1, 'has parent\'s examples');
      assert.equal(type.defaultValueStr.value(), 'test', 'has parent\'s defaultValue');
      assert.equal(type.minLength.value(), 3, 'has parent\'s minLength');
      assert.equal(type.maxLength.value(), 15, 'has parent\'s maxLength');
    });

    it('has examples in the union', () => {
      const list = /** @type UnionShape[] */ (doc.findByType('http://a.ml/vocabularies/shapes#UnionShape'));
      const type = list.find(i => i.name.value() === 'ObjectUnionWithExample');
      assert.lengthOf(type.examples, 0, 'has no own example');
      assert.lengthOf(type.anyOf, 2, 'has two union members');
      const [withExample, withoutExample] = /** @type NodeShape[] */ (type.anyOf);
      assert.lengthOf(withoutExample.examples, 0, 'member #2 has no examples');
      assert.lengthOf(withExample.examples, 1, 'member #1 has an example');
    });
  });
});
