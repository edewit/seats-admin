import { AuthenticatedUser, License, LicenseService, User } from "../service";
import { deleteSeatsById, getSeats, postSeats } from "./entitlements-service";
import * as Oazapfts from "oazapfts/lib/runtime";
import { listPrincipals } from "./rbac";
import { Principal } from "./rbac";

export class EntitlementsService implements LicenseService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || "";
  }

  private async header(user: AuthenticatedUser): Promise<Oazapfts.RequestOpts> {
    const token = await user.token();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      baseUrl: this.baseUrl,
    };
  }

  async get(user: AuthenticatedUser): Promise<License> {
    const result = await getSeats(
      {
        limit: 10,
        offset: 0,
      },
      await this.header(user)
    );
    return {
      available: result.allowed || 0,
      total: result.consumed || 0,
    };
  }

  async seats(
    user: AuthenticatedUser,
    assigned?: boolean | undefined
  ): Promise<User[]> {
    if (!assigned) {
      const result = await getSeats({}, await this.header(user));

      return result.data.map(({ subscription_id, account_username }) => ({
        id: subscription_id || "",
        name: account_username || "",
        assigned: true,
      }));
    } else {
      const header = await this.header(user);
      header.baseUrl = "https://cloud.redhat.com/api/entitlements/v1/";
      const result = await listPrincipals({ usernameOnly: false }, header);

      return (result.data as Principal[]).map(
        ({ username, first_name, last_name }) => ({
          id: username,
          name: `${first_name} ${last_name}`,
          assigned: false,
        })
      );
    }
  }

  async assign(user: AuthenticatedUser, userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map(async (id) =>
        postSeats({ account_username: id }, await this.header(user))
      )
    );
    return Promise.resolve();
  }

  async unAssign(user: AuthenticatedUser, userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map(async (id) => deleteSeatsById(id, await this.header(user)))
    );
    return Promise.resolve();
  }
}