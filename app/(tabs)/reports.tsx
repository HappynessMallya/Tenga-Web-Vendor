import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [year, setYear] = useState(2025);
  const [refreshing, setRefreshing] = useState(false);
  const points = useMemo(() => [15, 27, 24, 22, 40, 35, 25, 30, 45, 38, 42, 50], []);
  const maxY = 50;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  };

  const earningsData = {
    daily: { amount: 'Tsh 450,000', change: '+5%', trend: 'up' },
    weekly: { amount: 'Tsh 2,150,000', change: '+12%', trend: 'up' },
    monthly: { amount: 'Tsh 8,600,000', change: '+8%', trend: 'up' },
    yearly: { amount: 'Tsh 103,200,000', change: '+15%', trend: 'up' }
  };

  const currentEarnings = earningsData[period];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performance Reports</Text>
          <Text style={styles.subtitle}>
            Track your business performance and earnings
          </Text>
      </View>

        {/* Period Selection */}
        <View style={styles.periodContainer}>
          <Text style={styles.periodLabel}>Reporting Period</Text>
          <View style={styles.chipContainer}>
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <View key={p} style={styles.chipWrapper}>
                <Chip 
                  onPress={() => setPeriod(p as any)}
                  style={[
                    styles.chip,
                    period === p && styles.selectedChip
                  ]}
                  textStyle={[
                    styles.chipText,
                    period === p && styles.selectedChipText
                  ]}
                >
                  {p[0].toUpperCase() + p.slice(1)}
                </Chip>
                {period === p && (
                  <View style={styles.chipIcon}>
                    <Ionicons name="checkmark" size={16} color="white" />
      </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Earnings Overview */}
        <Card style={styles.earningsCard} contentStyle={styles.earningsCardContent}>
          <Card.Content style={styles.earningsContent}>
            <View style={styles.earningsHeader}>
              <View style={styles.earningsIconContainer}>
                <View style={styles.earningsIcon}>
                  <Ionicons name="cash-outline" size={28} color="white" />
                </View>
              </View>
              <View style={styles.earningsInfo}>
                <Text style={styles.earningsLabel}>
                  {period === 'yearly' ? "This Year's" : period === 'monthly' ? "This Month's" : period === 'weekly' ? "This Week's" : "Today's"} Earnings
                </Text>
                <Text style={styles.earningsAmount}>{currentEarnings.amount}</Text>
                <View style={styles.earningsChange}>
                  <View style={styles.changeBadge}>
                    <Ionicons 
                      name={currentEarnings.trend === 'up' ? 'trending-up' : 'trending-down'} 
                      size={14} 
                      color="white" 
                    />
                    <Text style={styles.changeText}>{currentEarnings.change}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Chart Section */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Performance Trend</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScrollContainer}
            >
              <View style={styles.chartContainer}>
                <View style={styles.chartArea}>
                  {points.map((v, i) => (
                    <View key={i} style={styles.chartBarContainer}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { height: (v / maxY) * 120 }
                        ]} 
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.chartLabels}>
                  {months.map((m) => (
                    <Text key={m} style={styles.chartLabel}>{m}</Text>
          ))}
        </View>
              </View>
            </ScrollView>
          </Card.Content>
      </Card>

        {/* Recent Transactions */}
        <Card style={styles.transactionsCard}>
          <Card.Content>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>Recent Transactions</Text>
              <Button 
                mode="text" 
                compact
                onPress={() => {}}
                style={styles.seeAllButton}
              >
                See All
              </Button>
            </View>
            
            {[
              { name: 'Elisha M.', amount: '25,000', order: '#12345', service: 'Wash & Fold, Ironing' },
              { name: 'John D.', amount: '35,000', order: '#12346', service: 'Dry Cleaning' },
              { name: 'Sarah K.', amount: '18,000', order: '#12347', service: 'Wash & Fold' }
            ].map((t, i) => (
              <View key={i} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons name="person-circle" size={32} color={theme.colors.primary} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{t.name}</Text>
                  <Text style={styles.transactionOrder}>Order {t.order}</Text>
                  <Text style={styles.transactionService}>{t.service}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={styles.amountText}>Tsh {t.amount}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chipWrapper: {
    position: 'relative',
  },
  chipIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedChipText: {
    color: 'white',
  },
  earningsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  earningsCardContent: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  earningsContent: {
    padding: 24,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsIconContainer: {
    marginRight: 20,
  },
  earningsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  earningsChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  chartScrollContainer: {
    paddingHorizontal: 8,
  },
  chartContainer: {
    height: 180,
    width: 600, // Wide enough for 12 months
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chartBarContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    width: 50,
  },
  transactionsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  seeAllButton: {
    marginRight: -8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  transactionOrder: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  transactionService: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
});
