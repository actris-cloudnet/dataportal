import { UserAccount } from "./entity/UserAccount";

declare global {
  namespace Express {
    interface User extends UserAccount {}
  }
}
