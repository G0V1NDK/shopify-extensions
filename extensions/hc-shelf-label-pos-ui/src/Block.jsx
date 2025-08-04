import React from 'react';

import {
  Text,
  useApi,
  reactExtension,
  POSBlock,
  POSBlockRow,
} from '@shopify/ui-extensions-react/point-of-sale';
import { Button } from '@shopify/ui-extensions/point-of-sale';

const Block = () => {
  const api = useApi();
  
  return (
    <POSBlock action={{title: 'Open action', onPress: api.action.presentModal}}>
      <POSBlockRow>
        <Text>{'NEED TO REMOVE'}</Text>
        <Text>{`Product ID for this product: ${api.product.id}`}</Text>
      </POSBlockRow>
    </POSBlock>
  );
};

export default reactExtension('pos.product-details.block.render', () => (
  <Block />
));