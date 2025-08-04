import React, { useEffect, useState } from 'react';
import {
  Text,
  Screen,
  Navigator,
  reactExtension,
  useApi,
  PrintPreview,
} from '@shopify/ui-extensions-react/point-of-sale';
import { Button, RadioButtonList } from '@shopify/ui-extensions/point-of-sale';

// Helper function to create individual label pages
function createPage(type, productData) {
  const { parentName, color, size, upc, regularPrice, salePrice, companyName, productIdentifiers } = productData;
  const email = 'customerhelp@example.com';

  const getDocumentInfo = () => {
    switch (type) {
      case 'UPC Label':
        return {
          label: 'UPC Label',
          content: `Product: ${parentName}. Color: ${color}. Size: ${size}. UPC: ${upc}.`,
        };
      case 'Promo Tag':
        return {
          label: 'Promo Tag',
          content: `Store: ${companyName}. SKU: ${productIdentifiers}. Product: ${parentName}. Color: ${color}. Regular Price: $${regularPrice}. Sale Price: $${salePrice}.`,
        };
      case 'Regular Price Label':
        return {
          label: 'Regular Price Label',
          content: `Store: ${companyName}. SKU: ${productIdentifiers}. Product: ${parentName}. Color: ${color}. Price: $${regularPrice}.`,
        };
      default:
        return {
          label: type,
          content: `Sample label for ${parentName}.`,
        };
    }
  };

  const { label, content } = getDocumentInfo();

  return `<main><div><h1>${label}</h1><div class="content">${content}<hr><p>Contact us: ${email}</p></div></main>`;
}

// Helper function to generate full HTML with styling and page breaks
function printHTML(pages) {
  const pageBreak = '<div class="page-break"></div>';
  const pageBreakStyles = `
    @media not print {
      .page-break { width: 100vw; height: 40px; background-color: lightgray; }
    }
    @media print {
      .page-break { page-break-after: always; }
    }`;

  const joinedPages = pages.join(pageBreak);
  return `<!DOCTYPE html><html lang="en"><head><title>Shelf Label</title><style>
    body, html { margin: 0; padding: 0; font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    main { padding: 1rem; width: 4in; height: 2in; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; text-align: center; }
    h1 { margin: 0 0 0.5rem 0; font-size: 1.2rem; }
    .content { font-size: 0.9rem; line-height: 1.3; }
    hr { margin: 0.5rem 0; border: none; border-top: 1px solid #000; }
    ${pageBreakStyles}
  </style></head><body>${joinedPages}</body></html>`;
}

const Modal = () => {
  const api = useApi();
  const [selected, setSelected] = useState('UPC Label');
  const [printUrl, setPrintUrl] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Product and variant data
  const variant = api?.variant || api?.product?.variants?.[0];
  const productId = api.product.id;
  const parentName = api.product.title || 'N/A';
  const color = variant?.option1 || 'N/A';
  const size = variant?.option2 || 'N/A';
  const upc = variant?.barcode || '123456789012';
  const regularPrice = variant?.price || '0.00';
  const salePrice = variant?.compare_at_price || regularPrice;
  const companyName = api.session?.shop || 'Your Store';
  const productIdentifiers = variant?.sku || 'N/A';

  const productData = {
    parentName,
    color,
    size,
    upc,
    regularPrice,
    salePrice,
    companyName,
    productIdentifiers,
  };

  // Generate HTML content for the selected label
  useEffect(() => {
    setIsLoading(true);
    const pages = [createPage(selected, productData)]; // Single page for selected label
    const fullHtml = printHTML(pages);
    const dataUrl = `data:text/html,${fullHtml}`; // Raw data URL without encodeURIComponent
    setPreviewHtml(dataUrl);
    setPrintUrl(dataUrl);
    setError(null);
    setIsLoading(false);
  }, [selected, upc, parentName, color, size, regularPrice, salePrice, companyName, productIdentifiers]);

  // Handle print action
  const handlePrint = () => {
    if (!printUrl) {
      api.toast.show('Label not ready for printing');
      return;
    }
    setIsLoading(true);
    api.print.print(printUrl).catch((err) => {
      console.error('Print error:', err);
      api.toast.show('Failed to print label');
      setError('Failed to print label');
    }).finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <Navigator>
      <Screen name="ProductDetails" title="Shelf Label Printer">
        <Text>{`Product ID: ${productId}`}</Text>
        {error && <Text>{error}</Text>}
        {isLoading && <Text>Loading...</Text>}
        <RadioButtonList
          items={['UPC Label', 'Promo Tag', 'Regular Price Label']}
          onItemSelected={setSelected}
          initialSelectedItem={selected}
        />
        {previewHtml ? (
          <PrintPreview src={previewHtml} />
        ) : (
          <Text>Loading label preview...</Text>
        )}
        <Button title="Print Label" type="primary" onPress={handlePrint} disabled={isLoading} />
      </Screen>
    </Navigator>
  );
};

export default reactExtension('pos.product-details.action.render', () => <Modal />);