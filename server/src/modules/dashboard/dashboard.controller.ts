import { Controller, Get } from "@nestjs/common";
import { ContactsService } from "../contacts/contacts.service";
import { ContactType } from "@prisma/client";

interface Stat {
  key: string; // i18n key
  value: string;
  delta: string;
  up: boolean;
}

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly contacts: ContactsService) {}

  @Get("stats")
  async stats(): Promise<Stat[]> {
    const total = await this.contacts
      .list(ContactType.user)
      .then((u) => u.length);
    return [
      { key: "dashboard.totalUsers", value: String(total), delta: "+12.5%", up: true },
      { key: "dashboard.activeSessions", value: "342", delta: "+4.1%", up: true },
      { key: "dashboard.revenue", value: "¥ 89,200", delta: "-2.3%", up: false },
      { key: "dashboard.orders", value: "1,932", delta: "+8.7%", up: true },
    ];
  }
}
