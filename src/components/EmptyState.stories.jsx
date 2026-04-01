import EmptyState from "./EmptyState";

export default {
  title: "UI/EmptyState",
  component: EmptyState,
};

export const Default = () => <EmptyState title="No data" description="Nothing to show here" />;

export const WithAction = () => (
  <EmptyState
    title="No issues yet"
    description="Create the first issue"
    actionLabel="Create Issue"
    onAction={() => alert("Create!")}
  />
);

export const WithPackageIcon = () => (
  <EmptyState
    icon="Package"
    title="No BOM data"
    description="Import bill of materials from Excel"
    actionLabel="AI Import"
    onAction={() => {}}
  />
);

export const AllIcons = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 20 }}>
    {[
      "AlertCircle",
      "Package",
      "Plane",
      "Truck",
      "Scale",
      "FileText",
      "CheckSquare",
      "ShoppingCart",
      "Factory",
      "Warehouse",
      "DollarSign",
    ].map((icon) => (
      <EmptyState key={icon} icon={icon} title={icon} description={`Icon: ${icon}`} />
    ))}
  </div>
);
