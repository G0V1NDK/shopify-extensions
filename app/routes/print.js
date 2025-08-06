import { authenticate } from '../shopify.server';

export async function loader({ request }) {
  console.log('------------------ Print loader called ------------------');
  console.log('=== Received request for /print:', request.url);
  const { cors, admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  const variantId = url.searchParams.get('variantId');
  const labelType = url.searchParams.get('labelType');

  console.log('=== Parameters:', { productId, variantId, labelType });

  if (!productId || !variantId || !labelType) {
    console.log('=== Missing parameters:', { productId, variantId, labelType });
    return cors(new Response('Missing parameters', { status: 400 }));
  }

  try {
    const { productVariant, shop } = await getProductDetails(variantId, request);
    console.log('=== Product details fetched:', productVariant);

    if (!productVariant || !productVariant.product) {
      console.log('=== Product or variant not found:', { productId, variantId });
      return cors(new Response('Product or variant not found', { status: 404 }));
    }

    const shopName = shop?.name;
    console.log('=== Shop name:', shopName);

    let html = '';
    switch (labelType) {
      case 'UPC Label':
        html = generateUPCLabel(productVariant);
        break;
      case 'Promo Tag':
        html = generatePromoTag(productVariant, shopName);
        break;
      case 'Regular Price Label':
        html = generateRegularPriceLabel(productVariant, shopName);
        break;
      default:
        console.log('=== Invalid label type:', labelType);
        return cors(new Response('Invalid label type', { status: 400 }));
    }

    console.log('=== Returning HTML for label:', labelType);
    return cors(
      new Response(html, {
        headers: { 'Content-Type': 'text/html' },
        status: 200,
        statusText: 'OK',
      })
    );
  } catch (error) {
    console.error('=== Error generating label:', error.message, error.stack);
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
      console.error('=== GraphQL errors:', data.errors);
      throw new Error('GraphQL query failed');
    }

    return {
      productVariant: data.data.productVariant,
      shop: data.data.shop,
    };
  } catch (error) {
    console.error('=== Error getting product details:', error.message, error.stack);
    throw error;
  }
}

function generateUPCLabel(productVariant) {
  const color = productVariant?.selectedOptions.find(option => option.name === 'Color')?.value || 'NA';
  const size = productVariant?.selectedOptions.find(option => option.name === 'Size')?.value || 'NA';
  const upc = productVariant?.barcode || 'NA';

  console.log('=== Generating UPC label for variant:', productVariant);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>UPC Label</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 2mm; 
          width: 2.25in; 
          height: 1in; 
          box-sizing: border-box; 
          overflow: hidden;
        }
        h2 { 
          font-size: 0.6em; 
          margin: 0.1em 0; 
          font-weight: bold; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
        }
        p { 
          font-size: 0.5em; 
          margin: 0.1em 0; 
          line-height: 1.2;
        }
        @media print { 
          body { 
            width: 2.25in; 
            height: 1in; 
            margin: 0; 
            padding: 2mm; 
          } 
        }
      </style>
    </head>
    <body>
      <h2>${productVariant?.product?.title}</h2>
      <p>Color: ${color}</p>
      <p>Size: ${size}</p>
      <p>UPC: ${upc}</p>
    </body>
    </html>
  `;
}

function generatePromoTag(productVariant, shopName) {
  // // No Records exist template
  // if (!productVariant.compareAtPrice || parseFloat(productVariant.compareAtPrice) <= parseFloat(productVariant.price)) {
  //   return `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //     <head>
  //       <title>Promo Tag</title>
  //       <style>
  //         body { 
  //           font-family: Arial, sans-serif; 
  //           margin: 0; 
  //           padding: 2mm; 
  //           width: 2.25in; 
  //           height: 1in; 
  //           box-sizing: border-box; 
  //           overflow: hidden;
  //         }
  //         p { 
  //           font-size: 0.5em; 
  //           margin: 0.1em 0; 
  //           text-align: center;
  //         }
  //         @media print { 
  //           body { 
  //             width: 2.25in; 
  //             height: 1in; 
  //             margin: 0; 
  //             padding: 2mm; 
  //           } 
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <p>This item is not on promotion.</p>
  //     </body>
  //     </html>
  //   `;
  // }
  // const color = productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA';
  console.log('=== Generating Promo Tag for variant:', productVariant);

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
        <h1>${shopName}</h1>
      </div>
      <div class="left-heading-section">
        <h2>${productVariant.product.title}</h2>
        <h2>${productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA'}</h2>
      </div>
      <div style="display: flex">
          <div class="left-section">
            <h3>Regular</h3>
            <h2>Sale</h2>
          </div>
          <div class="right-section">
            <h3>${parseFloat(productVariant.compareAtPrice).toFixed(2) || 0.00}</h3>
            <h2>${parseFloat(productVariant.price).toFixed(2) || 0.00}</h2>
          </div>
      </div>
    </body>
    </html>
  `;
}

function generateRegularPriceLabel(productVariant, shopName) {
  const color = productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA';
  console.log('=== Generating Regular Price Label for variant:', productVariant);

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
        <h1>${shopName}</h1>
      </div>
      <div class="left-heading-section">
        <h2>${productVariant.product.title}</h2>
        <h2>${productVariant.selectedOptions.find(option => option.name === 'Color')?.value || 'NA'}</h2>
      </div>
      <div class="right-section">
        <h2>${parseFloat(productVariant.price).toFixed(2) || 0.00}</h2>
      </div>
    </body>
  </html>
  `;
}