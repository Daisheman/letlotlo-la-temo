import { PropsWithChildren, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, Persister } from "@tanstack/react-query-persist-client";
import { cache } from "./storage";

const persister: Persister = {
  persistClient: async (client) => {
    cache.set("react-query-cache", JSON.stringify(client));
  },
  restoreClient: async () => {
    const raw = cache.getString("react-query-cache");
    return raw ? JSON.parse(raw) : undefined;
  },
  removeClient: async () => {
    cache.delete("react-query-cache");
  }
};

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24,
            retry: 1
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}>
      {children}
    </PersistQueryClientProvider>
  );
}
