import {
  Button,
  useExtensionApi,
  render,
} from "@shopify/retail-ui-extensions-react";

// Add the missing extension points to suppress the TS constraint errors
declare module "@shopify/retail-ui-extensions" {
  export interface ExtensionPoints {
    "pos.cart.line-item-details.action.menu-item.render": any;
  }
}

// Dummy export to prevent the CLI's auto-generated <stdin> from crashing
export default () => {};

// Register the actual extension asynchronously so it overwrites the dummy export
setTimeout(() => {
  render("pos.cart.line-item-details.action.menu-item.render" as any, () => <MenuItem />);
}, 0);

function MenuItem() {
  const api = useExtensionApi<"pos.cart.line-item-details.action.menu-item.render">() as any;
  console.log("----- APP STARTED -----");
  
  return (
    <Button 
      title="Drop Ship Attribution"
      onPress={() => {
        if (api.action && api.action.presentModal) {
          api.action.presentModal();
        } else {
          console.warn("presentModal is not available on API object");
        }
      }} 
    />
  );
}
