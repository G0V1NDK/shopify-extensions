import { render } from 'preact';
import { useState } from 'preact/hooks';

interface DropShipAttributionProps {
  api?: any;
}

/**
 * Select Fulfillment Method screen.
 * Displays the product details of the line item being attributed,
 * and allows selecting between "Fulfill from Another Store" and
 * "Fulfill from Warehouse".
 */
const DropShipAttribution = ({ api }: DropShipAttributionProps) => {
  // Use passed api object or fallback to global shopify object
  const activeApi = api || (typeof shopify !== 'undefined' ? shopify : null);
  const lineItem = activeApi?.cartLineItem;

  const quantity = lineItem?.quantity;

  // Screen routing state
  const [currentScreen, setCurrentScreen] = useState<'select' | 'input'>('select');
  // Input state for Transfer Order ID
  const [transferOrderId, setTransferOrderId] = useState('');

  // Helper to programmatically close the modal
  const dismissModal = () => {
    if (activeApi?.navigation) {
      if (activeApi.navigation.close) {
        activeApi.navigation.close();
      } else if (activeApi.navigation.dismiss) {
        activeApi.navigation.dismiss();
      }
    } else if (typeof shopify !== 'undefined' && shopify.navigation) {
      if (shopify.navigation.close) {
        shopify.navigation.close();
      } else if (shopify.navigation.dismiss) {
        shopify.navigation.dismiss();
      }
    }
  };

  const onFulfillFromAnotherStore = () => {
    setCurrentScreen('input');
  };

  const onFulfillFromWarehouse = () => {
    console.log("Selected: Fulfill from Warehouse");
    // @ts-ignore
    if (typeof shopify !== 'undefined' && shopify.toast) {
      // @ts-ignore
      shopify.toast.show("Selected: Fulfill from Warehouse");
    }
  };

  const onCancel = () => {
    dismissModal();
  };

  const onCompleteAssignment = async () => {
    // console.log("Selected: Complete Assignment with ID:", transferOrderId);
    
    if (lineItem?.uuid) {
      try {
        if (activeApi?.cart?.addLineItemProperties) {
          await activeApi.cart.addLineItemProperties(lineItem.uuid, {
            hc_transfer_order_id: transferOrderId
          });
          // console.log("Successfully added line item property hc_transfer_order_id:", transferOrderId);
        } else {
          console.warn("addLineItemProperties method not available on activeApi.cart");
        }
      } catch (error) {
        console.error("Failed to add line item property:", error);
      }
    } else {
      console.warn("No active lineItem or lineItem.uuid found to apply properties");
    }

    // @ts-ignore
    if (typeof shopify !== 'undefined' && shopify.toast) {
      // @ts-ignore
      shopify.toast.show(`Assigned Transfer Order ID: ${transferOrderId}`);
    }
    dismissModal();
  };

  return (
    // @ts-ignore
    <s-navigator>
      {currentScreen === 'select' ? (
        // @ts-ignore
        <s-screen name="SelectFulfillmentMethod" title="Select Fulfillment Method">
          {/* @ts-ignore */}
          <s-scroll-view>
            {/* @ts-ignore */}
            <s-stack direction="vertical" spacing="4" gap="large-100">
              
              {quantity != null && (
                /* @ts-ignore */
                <s-stack direction="vertical" spacing="1" alignItems="center">
                  {/* @ts-ignore */}
                  <s-text tone="subdued">
                    {`Attributing ${quantity} ${quantity === 1 ? 'item' : 'items'}`}
                    {/* @ts-ignore */}
                  </s-text>
                  {/* @ts-ignore */}
                </s-stack>
              )}

              {/* <s-clickable onClick={onFulfillFromAnotherStore}>
                <s-box padding="base" background="subdued" borderRadius="base" border="base">
                  <s-stack direction="vertical" spacing="1">
                    <s-text emphasis>Fulfill from Another Store</s-text>
                    <s-text tone="subdued">Ship directly from a different store</s-text>
                  </s-stack>
                </s-box>
              </s-clickable> */}
              {/* @ts-ignore */}
              <s-stack direction="inline" justifyContent="center">
                {/* @ts-ignore */}
                <s-button onClick={onFulfillFromAnotherStore} variant="primary">
                  Fulfill from Another Store
                {/* @ts-ignore */}
                </s-button>
              {/* @ts-ignore */}
              </s-stack>

              {/* @ts-ignore */}
              <s-stack direction="inline" justifyContent="center">
                {/* @ts-ignore */}
                <s-button onClick={onFulfillFromWarehouse}>
                  Fulfill from Warehouse
                {/* @ts-ignore */}
                </s-button>
              {/* @ts-ignore */}
              </s-stack>

            {/* @ts-ignore */}
            </s-stack>
          {/* @ts-ignore */}
          </s-scroll-view>
        {/* @ts-ignore */}
        </s-screen>
      ) : (
        // @ts-ignore
        <s-screen name="TransferOrderId" title="Transfer Order ID">
          {/* @ts-ignore */}
          <s-scroll-view>
            {/* @ts-ignore */}
            <s-stack direction="vertical" gap="large-100" alignItems="center">

              {/* @ts-ignore */}
              <s-stack direction="vertical" spacing="1" alignItems="left">
                {/* @ts-ignore */}
                <s-text tone="subdued" type="strong" >
                  Type: {/* @ts-ignore */}
                  <s-text emphasis>Drop Ship</s-text>
                {/* @ts-ignore */}
                </s-text>
                {/* @ts-ignore */}
                <s-text tone="subdued">
                  {`${quantity} ${quantity === 1 ? 'item' : 'items'} selected`}
                {/* @ts-ignore */}
                </s-text>
              {/* @ts-ignore */}
              </s-stack>

              {/* @ts-ignore */}
              <s-text-field
                label="Enter Transfer Order ID"
                placeholder="e.g., TO202605"
                value={transferOrderId}
                onInput={(e: any) => setTransferOrderId(e.target.value)}
                details="This ID will be used to track the internal transfer order"
              />

              {/* @ts-ignore */}
              <s-stack direction="inline" gap="base">
                {/* @ts-ignore */}
                <s-button onClick={onCancel} style={{ flex: 1 }}>
                  Cancel
                {/* @ts-ignore */}
                </s-button>
                {/* @ts-ignore */}
                <s-button variant="primary" onClick={onCompleteAssignment} style={{ flex: 1 }} disabled={!transferOrderId.trim()}>
                  Complete Assignment
                {/* @ts-ignore */}
                </s-button>
              {/* @ts-ignore */}
              </s-stack>

            {/* @ts-ignore */}
            </s-stack>
          {/* @ts-ignore */}
          </s-scroll-view>
        {/* @ts-ignore */}
        </s-screen>
      )}
    {/* @ts-ignore */}
    </s-navigator>
  );
};

export default async (api: any) => {
  render(<DropShipAttribution api={api} />, document.body);
};
