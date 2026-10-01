import "server-only";
import { PIN_LENGTH } from "./constants";

export { hashSecret as hashPin, verifySecret as verifyPin } from "./hash";

export function isValidPin(pin: string) {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}
