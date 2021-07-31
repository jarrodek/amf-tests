import { assert } from 'chai';
import amf from 'amf-client-js';

/** @typedef {import('amf-client-js').SchemaShape} SchemaShape */
/** @typedef {import('amf-client-js').WebApi} WebApi */
/** @typedef {import('amf-client-js').SecurityScheme} SecurityScheme */

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
      const transformed = client.transform(result.baseUnit, amf.ProvidedMediaType.AMF);
      const rendered = client.render(transformed.baseUnit, amf.Vendor.AMF.mediaType);

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

  describe('reading oauth 2 settings', () => {
    it('reads the settings', async () => {
      const configuration = amf.RAMLConfiguration.RAML10();
      const ro = new amf.RenderOptions().withCompactUris().withPrettyPrint().withSourceMaps();
      const client = configuration.withRenderOptions(ro).baseUnitClient();
      const result = await client.parseDocument('file://apis/secured/secured.raml');

      // serialization
      const transformed = client.transform(result.baseUnit, amf.ProvidedMediaType.AMF);
      const rendered = client.render(transformed.baseUnit, amf.Vendor.AMF.mediaType);

      // restoring
      const c2 = amf.RAMLConfiguration.RAML10().baseUnitClient();
      const restored = await c2.parseContent(rendered);
      const doc2 = /** @type amf.Document */ (restored.baseUnit);
      const list = /** @type SecurityScheme[] */ (doc2.findByType('http://a.ml/vocabularies/security#SecurityScheme'));
      assert.lengthOf(list, 1, 'has 1 security scheme');
      const [scheme] = list;
      const settings = doc2.findById(scheme.settings.id);
      assert.ok(settings, 'reads the setting');
    });
  });
});
