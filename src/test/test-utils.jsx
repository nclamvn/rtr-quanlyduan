import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { AuditProvider } from "../contexts/AuditContext";

function AllProviders({ children }) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <AuditProvider>{children}</AuditProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

const customRender = (ui, options) => render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
