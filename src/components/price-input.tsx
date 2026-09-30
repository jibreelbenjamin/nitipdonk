import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";

export function PriceInput({ id, defaultValue }: { id: string; defaultValue?: number | null }) {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>Rp</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        name="price"
        inputMode="numeric"
        placeholder="25000"
        defaultValue={defaultValue ?? undefined}
      />
    </InputGroup>
  );
}
