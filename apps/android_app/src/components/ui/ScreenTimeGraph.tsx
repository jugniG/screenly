import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { AreaChart } from 'react-native-chart-kit/v2';
import { G, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from './theme';

interface ScreenTimeGraphProps {
  totalMinutes: number;
  appsCount: number;
  isToday?: boolean;
}

// Typical 24-hour daily mobile activity curve (0 = 12 AM midnight, 12 = 12 PM noon, 24 = 12 AM midnight next day)
const HOURLY_PROFILE = [
  0.015, 0.008, 0.005, 0.005, 0.005, 0.01, 0.03, 0.05, 0.07, 0.06, 0.05, 0.06, // 12am - 11am
  0.08, 0.06, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.09, 0.06, 0.03, 0.01, 0.005, // 12pm - 12am (25 data points)
];

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function ScreenTimeGraph({ totalMinutes, appsCount, isToday = true }: ScreenTimeGraphProps) {
  const [containerWidth, setContainerWidth] = useState(320);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  // For today, stop at the current clock hour; for past days, distribute across full 24h
  const currentHour = isToday ? new Date().getHours() : 24;

  // Distribute usage across elapsed hours of the current day up to currentHour
  const elapsedWeights = HOURLY_PROFILE.slice(0, currentHour + 1);
  const totalWeight = elapsedWeights.reduce((sum, w) => sum + w, 0) || 1;

  const data = HOURLY_PROFILE.map((weight, hour) => {
    let minutesInHour: number | null = null;
    if (totalMinutes > 0 && hour <= currentHour) {
      minutesInHour = Math.round((weight / totalWeight) * totalMinutes);
    } else if (totalMinutes === 0 && hour <= currentHour) {
      minutesInHour = 0;
    }

    return {
      hour,
      hourId: `h_${hour}`,
      value: minutesInHour,
      minutes: minutesInHour ?? 0,
    };
  });

  const chartWidth = Math.max(280, containerWidth - 24);
  const chartHeight = 150;

  return (
    <View
      className="bg-surface rounded-2xl border border-border p-3.5 mb-3 shadow-sm"
      onLayout={onLayout}
    >
      {/* Header */}
      <View className="mb-1">
        <Text className="text-sm font-bold text-foreground">Usage Activity</Text>
        <Text className="text-[11px] text-muted-foreground mt-0.5">
          12:00 AM – 12:00 AM
        </Text>
      </View>

      {/* Area Chart: 12 AM to 12 AM with thin line and end label */}
      <View className="items-center justify-center my-1 overflow-hidden">
        <AreaChart
          data={data}
          xKey="hourId"
          yKey="value"
          curve="monotone"
          connectNulls={false}
          width={chartWidth}
          height={chartHeight}
          theme={{
            background: colors.surface,
            plotBackground: colors.surface,
            grid: colors.border,
            axis: colors.border,
            text: colors.text,
            mutedText: colors.textSecondary,
          }}
          areaFill={{
            fromColor: colors.primary,
            toColor: colors.primary,
            fromOpacity: 0.28,
            toOpacity: 0.02,
          }}
          series={[
            {
              yKey: 'value',
              label: '',
              color: colors.primary,
              strokeWidth: 1.2,
              dot: {
                visible: true,
                radius: 2,
                fill: colors.primary,
                stroke: 'transparent',
                strokeWidth: 0,
              },
            },
          ]}
          showDots={true}
          dots={{
            visible: true,
            radius: 2,
            fill: colors.primary,
            stroke: 'transparent',
            strokeWidth: 0,
          }}
          interaction={{
            mode: 'tap',
            selectionPersistence: 'persist',
          }}
          tooltip={true}
          renderTooltip={(props) => {
            const pt = data[props.index];
            if (!pt || pt.value === null || pt.value === undefined) return null;
            const h = pt.hour;
            const startH = h % 12 || 12;
            const startP = h < 12 || h === 24 ? 'AM' : 'PM';
            const nextH = (h + 1) % 12 || 12;
            const nextP = (h + 1) < 12 || (h + 1) === 24 ? 'AM' : 'PM';
            const timeRange = `${startH} ${startP} – ${nextH} ${nextP}`;
            const duration = formatDuration(pt.minutes);

            const boxW = 100;
            const boxH = 40;
            const posX = Math.max(4, Math.min(chartWidth - boxW - 4, props.x - boxW / 2));
            const posY = Math.max(4, Math.min(chartHeight - boxH - 20, props.y - boxH - 8));

            return (
              <G key={`tt-${props.index}`}>
                <Rect
                  x={posX}
                  y={posY}
                  width={boxW}
                  height={boxH}
                  rx={8}
                  fill={colors.surface}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={posX + boxW / 2}
                  y={posY + 15}
                  fill={colors.textSecondary}
                  fontSize={10}
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {timeRange}
                </SvgText>
                <SvgText
                  x={posX + boxW / 2}
                  y={posY + 31}
                  fill={colors.text}
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {duration}
                </SvgText>
              </G>
            );
          }}
          showVerticalGridLines={false}
          showHorizontalGridLines={true}
          labelStrategy="show"
          labelRotation={0}
          edgeLabelPolicy="shift"
          formatXLabel={(_value, index) => {
            if (index === 0) return '12 AM';
            if (index === 12) return '12 PM';
            if (index === 24) return '12 AM';
            return '';
          }}
          formatYLabel={(v: number) => `${Math.round(v)}m`}
          yDomain={{ min: 0 }}
        />
      </View>

      {/* Footer Info Row */}
      <View className="flex-row items-center justify-between pt-2.5 border-t border-border mt-1">
        <View className="flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
          <Text className="text-xs text-muted-foreground">Total: </Text>
          <Text className="text-xs font-semibold text-foreground">{formatDuration(totalMinutes)}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">Active Apps: </Text>
          <Text className="text-xs font-semibold text-foreground">{appsCount}</Text>
        </View>
      </View>
    </View>
  );
}
