import { Injectable } from "@nestjs/common";
import { Parser } from "json2csv";
import { AdminDashboardService } from "./admin-dashboard.service";

@Injectable()
export class AdminExportService {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  async exportRedemptionTrendsToCsv(year?: number): Promise<string> {
    const data = await this.dashboardService.offerRedeemChart(year);

    const parser = new Parser({
      fields: [
        { label: 'Month', value: 'monthName' },
        { label: 'Redemptions', value: 'totalRedemptions' },
      ],
    });

    return '\uFEFFRedemption Trends\n\n' + parser.parse(data);
  }

  async exportVendorPerformanceToCsv(): Promise<string> {
    const data = await this.dashboardService.getTopPerformingVendors();

    const parser = new Parser({
      fields: [
        { label: 'Vendor ID', value: 'vendorId' },
        { label: 'Vendor Name', value: 'vendorName' },
        { label: 'Total Offers', value: 'totalOffers' },
        { label: 'Total Redeemed', value: 'totalRedeemed' },
        { label: 'Redemption Rate (%)', value: 'redemptionRate' },
      ],
    });

    return '\uFEFFTop Vendors\n\n' + parser.parse(data);
  }
}