export interface PurchasesPackage {
  identifier: string;
  product: {
    title: string;
    description: string;
    priceString: string;
  };
}

export const Purchases = {
  configure: (_config: { apiKey: string; appUserID?: string }) => {
    console.log("RevenueCat disabled in test build");
  },
  getOfferings: async () => {
    return { current: { availablePackages: [] } };
  },
  purchasePackage: async (_pkg: PurchasesPackage) => {
    return null;
  },
  getCustomerInfo: async () => {
    return { entitlements: { active: {} } };
  },
  logOut: async () => {}
};

export default Purchases;
