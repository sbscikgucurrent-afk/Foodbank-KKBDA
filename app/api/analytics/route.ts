import { NextRequest, NextResponse } from 'next/server';
import { 
  getDashboardKPIs, 
  getChartDailyDistribution, 
  getChartStockInVsOut, 
  getChartDistributionByCategory, 
  getChartStudentsByProgramme, 
  getChartTopDistributedItems, 
  getChartMonthlyUsage,
  getRestockRecommendations,
  getScorecardMetrics,
  getDateRangeFromPeriod
} from '@/lib/services/analytics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';
  const customStart = searchParams.get('customStart') || undefined;
  const customEnd = searchParams.get('customEnd') || undefined;

  const { startDate, endDate } = getDateRangeFromPeriod(period, customStart, customEnd);

  const kpis = getDashboardKPIs(period, customStart, customEnd);
  const dailyDist = getChartDailyDistribution(startDate, endDate);
  const stockInOut = getChartStockInVsOut(startDate, endDate);
  const byCategory = getChartDistributionByCategory(startDate, endDate);
  const byProgramme = getChartStudentsByProgramme(startDate, endDate);
  const topItems = getChartTopDistributedItems(startDate, endDate);
  const monthlyUsage = getChartMonthlyUsage();
  const restock = getRestockRecommendations();
  const scorecard = getScorecardMetrics();

  return NextResponse.json({
    kpis,
    dailyDist,
    stockInOut,
    byCategory,
    byProgramme,
    topItems,
    monthlyUsage,
    restock,
    scorecard,
    startDate,
    endDate
  });
}
