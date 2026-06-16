import { render } from 'preact';

/**
 * Full-screen action modal rendered when the "Drop Ship Attribution"
 * menu item is tapped.  For now this is a placeholder with hardcoded
 * text – the real attribution UI will be built in subsequent iterations.
 */
const DropShipAttribution = () => {
  return (
    // @ts-ignore
    <s-navigator>
      {/* @ts-ignore */}
      <s-screen name="DropShipAttribution" title="Drop Ship Attribution">
        {/* @ts-ignore */}
        <s-scroll-view>
          {/* @ts-ignore */}
          <s-stack direction="vertical" spacing="4">
            {/* @ts-ignore */}
            <s-section title="Attribution Details">
              {/* @ts-ignore */}
              <s-text>
                This is the Drop Ship Attribution screen.
              {/* @ts-ignore */}
              </s-text>
              {/* @ts-ignore */}
              <s-text>
                In the next iteration, you will be able to select items,
                choose a fulfillment mode, and enter a Transfer Order ID.
              {/* @ts-ignore */}
              </s-text>
            {/* @ts-ignore */}
            </s-section>

            {/* @ts-ignore */}
            <s-section title="How It Works">
              {/* @ts-ignore */}
              <s-text>
                1. Select one or more cart items to attribute.
              {/* @ts-ignore */}
              </s-text>
              {/* @ts-ignore */}
              <s-text>
                2. Choose a fulfillment source: In-Store, Drop Ship from
                another Store, or Drop Ship from Warehouse.
              {/* @ts-ignore */}
              </s-text>
              {/* @ts-ignore */}
              <s-text>
                3. If shipping from another store, enter the Transfer Order
                ID (hc_transfer_order_id).
              {/* @ts-ignore */}
              </s-text>
              {/* @ts-ignore */}
              <s-text>
                4. Confirm and return to checkout.
              {/* @ts-ignore */}
              </s-text>
            {/* @ts-ignore */}
            </s-section>
          {/* @ts-ignore */}
          </s-stack>
        {/* @ts-ignore */}
        </s-scroll-view>
      {/* @ts-ignore */}
      </s-screen>
    {/* @ts-ignore */}
    </s-navigator>
  );
};

export default async () => {
  render(<DropShipAttribution />, document.body);
};
