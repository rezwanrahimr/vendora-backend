import { Injectable } from "@nestjs/common";
import { Parser } from "json2csv";
import { AdminAnalyticsService } from "./admin-analytics.service";

@Injectable()
export class AdminExportService {
  constructor(private analyticsService: AdminAnalyticsService) {}

  async exportRedemptionTrendsToCsv(year?: number): Promise<string> {
    const data = await this.analyticsService.offerRedeemChart(year);

    const parser = new Parser({
      fields: [
        { label: 'Month', value: 'monthName' },
        { label: 'Redemptions', value: 'totalRedemptions' },
      ],
    });

    return '\uFEFFRedemption Trends\n\n' + parser.parse(data);
  }

  async exportVendorPerformanceToCsv(): Promise<string> {
    const data = await this.analyticsService.getTopPerformingVendors();

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