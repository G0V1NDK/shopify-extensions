import { authenticate } from '../shopify.server';

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
        html = generateUPCLabel(productVariant);
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

function generateUPCLabel(productVariant) {
  const color = productVariant?.selectedOptions.find(option => option.name === 'Color')?.value || 'NA';
  const size = productVariant?.selectedOptions.find(option => option.name === 'Size')?.value || 'NA';
  const upc = productVariant?.barcode || 'NA';

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
      <img style="height: 7rem;" src="data:image/jpg;base64,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">
      <div class="right-section">
        <h2>${parseFloat(productVariant?.price).toFixed(2) || 0.00}</h2>
      </div>
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