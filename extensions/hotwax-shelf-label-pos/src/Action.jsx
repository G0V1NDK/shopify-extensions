import React, { useState, useEffect } from "react";
import {
  Text,
  Screen,
  Navigator,
  reactExtension,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";
import {
  Button,
  RadioButtonList,
  ScrollView,
} from "@shopify/ui-extensions/point-of-sale";

const Modal = () => {
  const api = useApi();
  const [selected, setSelected] = useState("Regular Price Label");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrint = async () => {
    setUrl("");
    setIsLoading(true);
    setError("");
    const baseUrl = "https://hotwax-shopify-shelf-label-pos.firebaseapp.com";
    const productId = api.product.id;
    const variantId = api.product.variantId;
    if (!variantId) {
      console.error("Variant ID is undefined");
      setError("No variant selected.");
      api.toast.show(error);
      setIsLoading(false);
      return;
    }
    const newUrl = `${baseUrl}/print?productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}&labelType=${encodeURIComponent(selected)}`;
    setUrl(newUrl);
  };

  useEffect(() => {
    const printLabel = async () => {
      if (url && isLoading) {
        setIsLoading(true);
        try {
          setTimeout(() => {api.print.print(url)}, 1000); // Delay to ensure the URL is set before printing
          api.toast.show("Previewing label...");
        } catch (error) {
          console.error("Print failed:", error);
          setError("Failed to print label.");
          api.toast.show("Failed to print label");
        } finally {
          setIsLoading(false);
        }
      }
    };
    printLabel();
  }, [url]);

  return (
    <Navigator>
      <Screen name="ProductDetails" title="Select Label Type">
        <ScrollView>
          <Button
            title="Print"
            type="primary"
            onPress={handlePrint}
            disabled={isLoading}
            isLoading={isLoading}
          />
          <RadioButtonList
            items={["Regular Price Label", "UPC Label", "Promo Tag"]}
            onItemSelected={setSelected}
            initialSelectedItem={selected}
          />
          {/* {error && <Text>{error}</Text>} */}
        </ScrollView>
      </Screen>
    </Navigator>
  );
};

export default reactExtension("pos.product-details.action.render", () => (
  <Modal />
));