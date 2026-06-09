import {
  Screen,
  ScrollView,
  Text,
  Button,
  Navigator,
  Stack,
  TextField,
  useExtensionApi,
  Selectable,
  render
} from "@shopify/retail-ui-extensions-react";
import { useState } from "react";

// Add the missing extension point to suppress the TS constraint errors
declare module "@shopify/retail-ui-extensions" {
  export interface ExtensionPoints {
    "pos.cart.line-item-details.action.render": any;
  }
}

// Dummy export to prevent the CLI's auto-generated <stdin> from crashing
export default () => { };

// Register the actual extension asynchronously so it overwrites the dummy export
setTimeout(() => {
  render("pos.cart.line-item-details.action.render" as any, () => <DropShipAttribution />);
}, 0);

const dummyCartItems = [
  {
    id: "1",
    name: "Leather Oxford Shoes",
    variant: "Size 42 • Brown",
    price: 189.99,
    image: "https://picsum.photos/id/20/80",
    fulfillmentMethod: null as string | null,
  }
];

function DropShipAttribution() {
  const [items, setItems] = useState(dummyCartItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentScreen, setCurrentScreen] = useState<"item-selection" | "fulfillment-method" | "transfer-id" | "review">("item-selection");
  const [tempFulfillmentMethod, setTempFulfillmentMethod] = useState<string | null>(null);
  const [tempTransferId, setTempTransferId] = useState("");

  const api = useExtensionApi<"pos.cart.line-item-details.action.render">() as any;

  const attributedCount = items.filter((item) => item.fulfillmentMethod).length;
  const totalItems = items.length;

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleFulfillmentMethodSelect = (method: string) => {
    setTempFulfillmentMethod(method);
    if (method === "warehouse") {
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.has(item.id)
            ? { ...item, fulfillmentMethod: "warehouse", transferOrderId: null }
            : item
        )
      );
      setSelectedIds(new Set());
      setCurrentScreen("item-selection");
    } else {
      setCurrentScreen("transfer-id");
    }
  };

  const handleTransferIdSubmit = () => {
    if (!tempTransferId.trim()) {
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id)
          ? { ...item, fulfillmentMethod: "drop-ship", transferOrderId: tempTransferId.trim() }
          : item
      )
    );

    setSelectedIds(new Set());
    setTempTransferId("");
    setTempFulfillmentMethod(null);
    setCurrentScreen("item-selection");
  };

  const handleReturnToCheckout = () => {
    if (api.navigation && api.navigation.dismiss) {
      api.navigation.dismiss();
    } else {
      console.warn("Navigation dismiss not available on API object");
    }
  };

  return (
    <Navigator>
      <Screen name="Drop Ship Attribution" title="Drop Ship Attribution">
        <ScrollView>
          <Stack direction="vertical" spacing={11} {...{ gap: "10px" }}>
            <Stack direction="vertical" spacing={5} {...{ gap: "5px" }}>
              <Text variant="headingLarge">Drop Ship Attribution</Text>
              <Text variant="body">{attributedCount} of {totalItems} items attributed</Text>
            </Stack>

            {/* Item Selection Screen */}
            {currentScreen === "item-selection" && (
              <Stack direction="vertical" spacing={11} {...{ gap: "10px" }}>
                <Text variant="headingSmall">Select items to attribute:</Text>
                {items.map((item) => (
                  <Selectable key={item.id} onPress={() => toggleItem(item.id)}>
                    <Stack direction="horizontal" spacing={11} {...{ gap: "10px", alignItems: "center" }}>
                      <Stack direction="vertical" spacing={5} {...{ gap: "5px", flex: 1 }}>
                        <Text variant="headingSmall">
                          {selectedIds.has(item.id) ? "[X] " : "[ ] "}
                          {item.name}
                        </Text>
                        <Text variant="captionRegular">{item.variant}</Text>
                        <Text variant="captionRegular">${item.price.toFixed(2)}</Text>
                      </Stack>
                      {item.fulfillmentMethod && (
                        <Text variant="captionRegular">
                          ✓ {item.fulfillmentMethod === "drop-ship" ? "Drop Ship" : "Warehouse"}
                        </Text>
                      )}
                    </Stack>
                  </Selectable>
                ))}
                <Stack direction="vertical" spacing={5} {...{ gap: "5px" }}>
                  <Button
                    title={`Assign Fulfillment (${selectedIds.size} selected)`}
                    onPress={() => setCurrentScreen("fulfillment-method")}
                  />
                  {attributedCount === totalItems && attributedCount > 0 && (
                    <Button onPress={() => setCurrentScreen("review")} title="Finish & Review" />
                  )}
                </Stack>
              </Stack>
            )}

            {/* Fulfillment Method Screen */}
            {currentScreen === "fulfillment-method" && (
              <Stack direction="vertical" spacing={11} {...{ gap: "10px" }}>
                <Text variant="headingSmall">Choose method for {selectedIds.size} item(s)</Text>
                <Button onPress={() => handleFulfillmentMethodSelect("drop-ship")} title="Drop Ship from Another Store" />
                <Button onPress={() => handleFulfillmentMethodSelect("warehouse")} title="Fulfill from Warehouse" />
                <Button onPress={() => setCurrentScreen("item-selection")} title="Cancel" />
              </Stack>
            )}

            {/* Transfer Order ID Screen */}
            {currentScreen === "transfer-id" && (
              <Stack direction="vertical" spacing={11} {...{ gap: "10px" }}>
                <Text variant="headingSmall">Enter Transfer Order ID</Text>
                <TextField
                  label="Transfer Order Number"
                  value={tempTransferId}
                  onChange={(val: string) => setTempTransferId(val)}
                />
                <Button onPress={handleTransferIdSubmit} title="Confirm Transfer Order ID" />
                <Button onPress={() => setCurrentScreen("fulfillment-method")} title="Back" />
              </Stack>
            )}

            {/* Review Screen */}
            {currentScreen === "review" && (
              <Stack direction="vertical" spacing={11} {...{ gap: "10px" }}>
                <Text variant="headingLarge">Assignment Complete</Text>
                <Text variant="body">All items have been successfully attributed.</Text>
                <Button onPress={handleReturnToCheckout} title="Return to Checkout" />
              </Stack>
            )}
          </Stack>
        </ScrollView>
      </Screen>
    </Navigator>
  );
}