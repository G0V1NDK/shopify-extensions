import { authenticate } from '../shopify.server';
import bwipjs from 'bwip-js';

export async function loader({ request }) {
  const { cors } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  const variantId = url.searchParams.get('variantId');
  const labelType = url.searchParams.get('labelType');

  if (!productId || !variantId || !labelType) {
    return cors(new Response('Missing parameters', { status: 400 }));
  }

  try {
    const { productVariant, shop } = await getProductDetails(variantId, request);

    if (!productVariant || !productVariant.product) {
      console.log('Product or variant not found:', { productId, variantId });
      return cors(new Response('Product or variant not found', { status: 404 }));
    }

    const shopName = shop?.name;

    let html = '';
    switch (labelType) {
      case 'UPC Label':
        const barcodeDataUrl = await generateBarcodeUrl(productVariant?.barcode);
        html = generateUPCLabel(productVariant, barcodeDataUrl);
        break;
      case 'Promo Tag':
        html = generatePromoTag(productVariant, shopName);
        break;
      case 'Regular Price Label':
        html = generateRegularPriceLabel(productVariant, shopName);
        break;
      default:
        console.log('Invalid label type:', labelType);
        return cors(new Response('Invalid label type', { status: 400 }));
    }

    return cors(
      new Response(html, {
        headers: { 'Content-Type': 'text/html' },
        status: 200,
        statusText: 'OK',
      })
    );
  } catch (error) {
    console.error('Error generating label:', error.message, error.stack);
    return cors(new Response(`Error generating label: ${error.message}`, { status: 500 }));
  }
}

async function getProductDetails(variantId, request) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
      query GetProductDetails($variantId: ID!) {
        productVariant(id: $variantId) {
          id
          title
          product {
            id
            title
          }
          selectedOptions {
            name
            value
          }
          barcode
          price
          compareAtPrice
          sku
        }
        shop {
          name
        }
      }`,
      {
        variables: {
          variantId: `gid://shopify/ProductVariant/${variantId}`,
        },
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('GraphQL query failed');
    }

    return {
      productVariant: data.data.productVariant,
      shop: data.data.shop,
    };
  } catch (error) {
    console.error('Error getting product details:', error.message, error.stack);
    throw error;
  }
}

function generateUPCLabel(productVariant, barcodeDataUrl) {
  // const color = productVariant?.selectedOptions.find(option => option.name === 'Color')?.value || 'NA';
  // const size = productVariant?.selectedOptions.find(option => option.name === 'Size')?.value || 'NA';
  // const upc = productVariant?.barcode || 'NA';

  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Promo Tag</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 2mm; 
          /*width: 2.25in; */
          /*height: 1in; */
          box-sizing: border-box; 
          overflow: hidden; 
          /*display: flex; */
          flex-direction: row; 
          justify-content: space-between; 
          align-items: center;
        }
        .left-section { 
          width: 50%; 
          text-align: left;
        }
        .right-section { 
          text-align: right;
        }
        .center-section {
          /*width: 50%; */
          text-align: center;
        }
        h1 {
          font-size: 5em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          white-space: nowrap; 
          /*overflow: hidden; */
          text-overflow: ellipsis;
        }
        h2 { 
          font-size: 3em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          /*white-space: nowrap; */
          overflow: hidden; 
          text-overflow: ellipsis;
        }
        .left-heading-section { 
          width: 50%; 
          text-align: left; 
          /*font-size: 0.5em; */
          margin-bottom: 0.2em;
        }
        p { 
          font-size: 0.5em; 
          margin: 0.1em 0; 
          line-height: 1.2;
        }
        @media print { 
          body { 
            /*width: 2.25in; */
            /*height: 1in; */
            margin: 0; 
            padding: 2mm; 
          } 
        }
      </style>
    </head>
    <body>
      <h2>${productVariant?.barcode || 'NA'}</h2>
      <div style="display: flex">
        <div class="left-heading-section">
          <h2>${productVariant?.product?.title}</h2>
          <h2>${productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA'}</h2>
        </div>
        <div class="right-section">
          <h2>${productVariant.selectedOptions.find(option => option.name === 'Size')?.value || 'NA'}</h2>
        </div>
      </div>
      <div>
        ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode for ${productVariant?.barcode || 'NA'}" />` : ''}
      </div>
      <div class="right-section">
        <h2>${parseFloat(productVariant?.price).toFixed(2) || 0.00}</h2>
      </div>
    </body>
  </html>
  `;
}

function generatePromoTag(productVariant, shopName) {
  return `
        <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Promo Tag</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 2mm; 
          /*width: 2.25in; */
          /*height: 1in; */
          box-sizing: border-box; 
          overflow: hidden; 
          /*display: flex; */
          flex-direction: row; 
          justify-content: space-between; 
          align-items: center;
        }
        .left-section { 
          width: 50%; 
          text-align: left;
        }
        .right-section { 
          width: 50%; 
          text-align: right;
        }
        .center-section {
          /*width: 50%; */
          text-align: center;
        }
        h1 {
          font-size: 5em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          white-space: nowrap; 
          /*overflow: hidden; */
          text-overflow: ellipsis;
        }
        h2 { 
          font-size: 3em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          /*white-space: nowrap; */
          overflow: hidden; 
          text-overflow: ellipsis;
        }
        .left-heading-section { 
          width: 50%; 
          text-align: left; 
          /*font-size: 0.5em; */
          margin-bottom: 0.2em;
        }
        p { 
          font-size: 0.5em; 
          margin: 0.1em 0; 
          line-height: 1.2;
        }
        @media print { 
          body { 
            /*width: 2.25in; */
            /*height: 1in; */
            margin: 0; 
            padding: 2mm; 
          } 
        }
      </style>
    </head>
    <body>
      <div class="center-section">
        <h1>MEPHISTO</h1>
      </div>
      <div class="left-heading-section">
        <h2>${productVariant?.product.title}</h2>
        <h2>${productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA'}</h2>
      </div>
      <div style="display: flex">
          <div class="left-section">
            <h3>Regular</h3>
            <h2>Sale</h2>
          </div>
          <div class="right-section">
            <h3>${parseFloat(productVariant?.compareAtPrice).toFixed(2) || 0.00}</h3>
            <h2>${parseFloat(productVariant?.price).toFixed(2) || 0.00}</h2>
          </div>
      </div>
    </body>
    </html>
  `;
}

function generateRegularPriceLabel(productVariant, shopName) {
  // const color = productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA';

  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Promo Tag</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 2mm; 
          /*width: 2.25in; */
          /*height: 1in; */
          box-sizing: border-box; 
          overflow: hidden; 
          /*display: flex; */
          flex-direction: row; 
          justify-content: space-between; 
          align-items: center;
        }
        .left-section { 
          width: 50%; 
          text-align: left;
        }
        .right-section { 
          width: 50%; 
          text-align: right;
        }
        .center-section {
          /*width: 50%; */
          text-align: center;
        }
        h1 {
          font-size: 5em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          white-space: nowrap; 
          /*overflow: hidden; */
          text-overflow: ellipsis;
        }
        h2 { 
          font-size: 3em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          /*white-space: nowrap; */
          overflow: hidden; 
          text-overflow: ellipsis;
        }
        .left-heading-section { 
          width: 50%; 
          text-align: left; 
          /*font-size: 0.5em; */
          margin-bottom: 0.2em;
        }
        p { 
          font-size: 0.5em; 
          margin: 0.1em 0; 
          line-height: 1.2;
        }
        @media print { 
          body { 
            /*width: 2.25in; */
            /*height: 1in; */
            margin: 0; 
            padding: 2mm; 
          } 
        }
      </style>
    </head>
    <body>
      <div class="center-section">
        <h1>MEPHISTO</h1>
      </div>
      <div class="left-heading-section">
        <h2>${productVariant.product?.title}</h2>
        <h2>${productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA'}</h2>
      </div>
      <div class="right-section">
        <h2>${parseFloat(productVariant?.price).toFixed(2) || 0.00}</h2>
      </div>
    </body>
  </html>
  `;
}

// generate barcode url
async function generateBarcodeUrl(barcodeValue){
  if (barcodeValue && barcodeValue !== 'NA') {
    try {
      const buffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeValue,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center', 
      });

      const base64 = buffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      console.error('Error generating barcode:', err.message);
    }
  }
}