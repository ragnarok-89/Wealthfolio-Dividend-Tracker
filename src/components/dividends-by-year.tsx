import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  EmptyPlaceholder,
  formatAmount,
  Icons,
} from '@wealthfolio/ui';
import { Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from '@wealthfolio/ui/chart';
import type { YearlyDividendSummary } from '../types';
import type { Account } from '@wealthfolio/addon-sdk';

interface DividendsByYearProps {
  yearlyData: YearlyDividendSummary[];
  accounts: Account[];
  baseCurrency: string;
  isBalanceHidden: boolean;
}

// Generate gradient colors for each account
const CHART_GRADIENTS = [
  { id: 'gradient-olive', start: '#8a9e6d', end: '#5a6d42' },  // Olive Green
  { id: 'gradient-blue', start: '#2e5c9e', end: '#1a3558' },   // Blue
  { id: 'gradient-orange', start: '#FA8112', end: '#B45A0C' }, // Orange
  { id: 'gradient-darkgreen', start: '#3d6b1f', end: '#1e3510' }, // Dark Green
  { id: 'gradient-red', start: '#A64650', end: '#8A244B' },   // Soft Red
  { id: 'gradient-mint', start: '#44F5C3', end: '#2FA37F' },   // Mint
  { id: 'gradient-purple', start: '#923BC2', end: '#5F247F' }, // Purple
  { id: 'gradient-mauve', start: '#FA0123', end: '#B30019' },    // Mauve
  ];

export function DividendsByYear({
  yearlyData,
  accounts,
  baseCurrency,
  isBalanceHidden,
}: DividendsByYearProps) {
  const accountColors = useMemo(() => {
    const colors: Record<string, string> = {};
    accounts.forEach((account, index) => {
      const gradient = CHART_GRADIENTS[index % CHART_GRADIENTS.length];
      colors[account.id] = `url(#${gradient.id})`;
    });
    return colors;
  }, [accounts]);

  const accountSolidColors = useMemo(() => {
    const colors: Record<string, string> = {};
    accounts.forEach((account, index) => {
      const gradient = CHART_GRADIENTS[index % CHART_GRADIENTS.length];
      colors[account.id] = gradient.start; // Use start color for tooltips and legends
    });
    return colors;
  }, [accounts]);

  const chartData = useMemo(() => {
    return yearlyData.map((yearData) => {
      const data: any = {
        year: yearData.year.toString(),
      };

      accounts.forEach((account) => {
        data[account.id] = yearData.byAccount[account.id] || 0;
      });

      return data;
    });
  }, [yearlyData, accounts]);

  // Sort accounts by total dividend amount (largest first for bottom-to-top stacking)
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const totalA = yearlyData.reduce((sum, year) => sum + (year.byAccount[a.id] || 0), 0);
      const totalB = yearlyData.reduce((sum, year) => sum + (year.byAccount[b.id] || 0), 0);
      return totalB - totalA; // Descending order (largest first)
    });
  }, [accounts, yearlyData]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    sortedAccounts.forEach((account) => {
      config[account.id] = {
        label: account.name,
        color: accountSolidColors[account.id],
      };
    });
    return config;
  }, [sortedAccounts, accountSolidColors]);

  if (yearlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dividends by Year</CardTitle>
          <CardDescription>No dividend data available</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyPlaceholder
            className="mx-auto flex h-[300px] max-w-[420px] items-center justify-center"
            icon={<Icons.ChartBar className="size-10" />}
            title="No dividend data"
            description="Start tracking dividends to see your yearly breakdown"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Dividends by Year</CardTitle>
          <CardDescription>Total dividends collected per year across all accounts</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-6">
          <ChartContainer
            className="min-h-[300px] w-full"
            config={chartConfig}
          >
            <ComposedChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                {CHART_GRADIENTS.map((gradient) => (
                  <linearGradient key={gradient.id} id={gradient.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={gradient.end} stopOpacity={0.9} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const formattedValue = isBalanceHidden
                        ? '••••'
                        : formatAmount(Number(value), baseCurrency);
                      const account = accounts.find((a) => a.id === name);
                      return (
                        <>
                          <div
                            className="border-border h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor: accountSolidColors[name as string],
                            }}
                          />
                          <div className="flex flex-1 items-center justify-between">
                            <span className="text-muted-foreground">
                              {account?.name || name}
                            </span>
                            <span className="text-foreground ml-2 font-mono font-medium tabular-nums">
                              {formattedValue}
                            </span>
                          </div>
                        </>
                      );
                    }}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                }
                itemSorter={(a: any, b: any) => {
                  const indexA = sortedAccounts.findIndex((acc) => acc.id === a.dataKey);
                  const indexB = sortedAccounts.findIndex((acc) => acc.id === b.dataKey);
                  return indexA - indexB;
                }}
              />
              <ChartLegend
                content={(props) => {
                  const { payload } = props;
                  return (
                    <div className="flex flex-wrap justify-center gap-3 text-[11px] sm:text-xs mt-4">
                      {sortedAccounts.map((account) => (
                        <div key={account.id} className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: accountSolidColors[account.id] }}
                          />
                          <span className="text-muted-foreground">{account.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {sortedAccounts.map((account) => (
                <Bar
                  key={account.id}
                  dataKey={account.id}
                  name={account.name}
                  stackId="dividends"
                  fill={accountColors[account.id]}
                  stroke={accountSolidColors[account.id]}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Table</CardTitle>
          <CardDescription>Yearly dividend breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Year</th>
                  {accounts.map((account) => (
                    <th key={account.id} className="text-right p-2 font-medium">
                      {account.name}
                    </th>
                  ))}
                  <th className="text-right p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.map((yearData) => (
                  <tr key={yearData.year} className="border-b">
                    <td className="p-2">{yearData.year}</td>
                    {accounts.map((account) => (
                      <td key={account.id} className="text-right p-2 font-mono tabular-nums">
                        {isBalanceHidden
                          ? '••••'
                          : formatAmount(yearData.byAccount[account.id] || 0, baseCurrency)}
                      </td>
                    ))}
                    <td className="text-right p-2 font-mono font-semibold tabular-nums">
                      {isBalanceHidden ? '••••' : formatAmount(yearData.total, baseCurrency)}
                    </td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className="font-semibold bg-muted/50">
                  <td className="p-2">Grand Total</td>
                  {accounts.map((account) => {
                    const accountTotal = yearlyData.reduce(
                      (sum, yearData) => sum + (yearData.byAccount[account.id] || 0),
                      0
                    );
                    return (
                      <td key={account.id} className="text-right p-2 font-mono tabular-nums">
                        {isBalanceHidden ? '••••' : formatAmount(accountTotal, baseCurrency)}
                      </td>
                    );
                  })}
                  <td className="text-right p-2 font-mono tabular-nums">
                    {isBalanceHidden
                      ? '••••'
                      : formatAmount(
                          yearlyData.reduce((sum, yearData) => sum + yearData.total, 0),
                          baseCurrency
                        )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
