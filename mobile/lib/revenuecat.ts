export interface PurchasesPackage {
  identifier: string;
  product: {
    title: string;
    description: string;
    priceString: string;
  };
}

export const Purchases = {
  configure: (_config: { apiKey: string; appUserID?: string }) => {},
  getOfferings: async () => ({ current: { availablePackages: [] } }),
  purchasePackage: async (_pkg: PurchasesPackage) => null,
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  logOut: async () => {}
};

export default Purchases;
