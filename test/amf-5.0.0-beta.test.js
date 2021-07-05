import { assert } from 'chai';
import amf from 'amf-client-js';

describe('Beta tests', function() {
  describe('Adding a type', () => {
    /** @type amf.Document */
    let api;

    beforeEach(() => {
      const wa = new amf.WebApi().withName('Test API');
      const doc = new amf.Document().withId('amf://document');
      doc.withEncodes(wa);
      api = doc;
    });

    it('adds the name', () => {
      const type = new amf.ScalarShape().withName('A type');
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.name.value(), 'A type', 'has the type');
    });

    it('adds the description', () => {
      const type = new amf.ScalarShape().withDescription('A type description');
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.description.value(), 'A type description', 'has the description');
    });

    it('adds the displayName', () => {
      const type = new amf.ScalarShape().withDisplayName('A display name');
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.displayName.value(), 'A display name', 'has the displayName');
    });

    it('adds the data type', () => {
      const type = new amf.ScalarShape().withDataType('http://www.w3.org/2001/XMLSchema#string');
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.dataType.value(), 'http://www.w3.org/2001/XMLSchema#string', 'has the dataType');
    });

    it('adds the deprecated', () => {
      const type = new amf.ScalarShape().withDeprecated(true);
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.isTrue(readType.deprecated.value());
    });

    it('adds the minLength', () => {
      const type = new amf.ScalarShape().withMinLength(1);
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.minLength.value(), 1);
    });

    it('adds the maxLength', () => {
      const type = new amf.ScalarShape().withMaxLength(20);
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.maxLength.value(), 20);
    });

    it('adds the minimum', () => {
      const type = new amf.ScalarShape().withMinimum(1);
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.minimum.value(), 1);
    });

    it('adds the maximum', () => {
      const type = new amf.ScalarShape().withMaximum(20);
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.maximum.value(), 20);
    });

    it('adds the format', () => {
      const type = new amf.ScalarShape().withFormat('float');
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.format.value(), 'float');
    });

    it('combo add type', () => {
      const type = new amf.ScalarShape()
        .withName('A type')
        .withDescription('A type description')
        .withDisplayName('A display name')
        .withDeprecated(true)
        .withMinLength(1)
        .withMaxLength(20)
        .withDataType('http://www.w3.org/2001/XMLSchema#string');
      api.withDeclaredElement(type);
      const readType = /** @type amf.ScalarShape */ (api.findById(type.id));
      assert.equal(readType.name.value(), 'A type', 'has the type');
      assert.equal(readType.description.value(), 'A type description', 'has the description');
      assert.equal(readType.displayName.value(), 'A display name', 'has the displayName');
      assert.isTrue(readType.deprecated.value(), 'has the deprecated');
      assert.equal(readType.minLength.value(), 1, 'has the minLength');
      assert.equal(readType.maxLength.value(), 20, 'has the maxLength');
      assert.equal(readType.dataType.value(), 'http://www.w3.org/2001/XMLSchema#string', 'has the dataType');
    });
  });

  describe('Importing OAS 3', () => {
    const api = `
openapi: '3.0.0'
info:
  title: Servers demo API
  version: '1.0'
  description: Test API for testing AMF service
servers:
  - url: https://development.gigantic-server.com/v1
    description: Development server
components:
  schemas:
    GeneralError:
      type: object
      properties:
        code:
          type: integer
          format: int32
paths:
  /test:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                type: string
    `.trim();

    it('imports the API', async () => {
      const configuration = amf.OASConfiguration.OAS30();
      const client = configuration.createClient();
      const result = await client.parseContent(api);
      const doc = /** @type amf.Document */ (result.baseUnit);
      const webAPi = /** @type amf.WebApi */ (doc.encodes);
      assert.typeOf(webAPi.endPoints, 'array', 'has the endpoints in the API');
      assert.lengthOf(webAPi.endPoints, 1, 'has the endpoint');
    });
  });
});
