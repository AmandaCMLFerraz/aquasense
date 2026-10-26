import { Select } from "@/components/ui/select";
import { useSelectedResidence } from "@/hooks/use-selected-residence";

const ALL_UNITS_VALUE = "all";

function ResidenceSelector() {
  const { units, isLoading, selectedUnitId, setSelectedUnitId } =
    useSelectedResidence();

  if (!isLoading && units.length <= 1) {
    return null;
  }

  return (
    <Select
      label="Residência"
      value={selectedUnitId ?? ALL_UNITS_VALUE}
      loading={isLoading}
      options={[
        { label: "Todas as residências", value: ALL_UNITS_VALUE },
        ...units.map((unit) => ({ label: unit.name, value: unit.id })),
      ]}
      onChange={(value) =>
        setSelectedUnitId(value === ALL_UNITS_VALUE ? null : value)
      }
    />
  );
}

export { ResidenceSelector };
