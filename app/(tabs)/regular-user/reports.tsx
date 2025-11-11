import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

export default function ReportsScreen() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [year, setYear] = useState(2025);
  const points = useMemo(() => [15, 27, 24, 22, 40, 35, 25], []);
  const maxY = 50;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 8, marginTop: 52 }}>Reports</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['weekly', 'monthly', 'yearly'].map((p) => (
          <Chip key={p} selected={period === (p as any)} onPress={() => setPeriod(p as any)}>{p[0].toUpperCase() + p.slice(1)}</Chip>
        ))}
      </View>

      <View style={{ marginTop: 12 }}>
        <Chip>{year}</Chip>
      </View>

      <Text style={{ marginTop: 12 }} variant="bodyMedium">This {period === 'yearly' ? "Month's" : "week's"} earnings</Text>
      <Text variant="headlineLarge" style={{ fontWeight: 'bold' }}>Tsh 2,150,000</Text>

      <Text style={{ marginTop: 12 }} variant="titleMedium">Overview</Text>
      <Card style={{ marginTop: 8, padding: 12 }}>
        <View style={{ height: 160, width: '100%', justifyContent: 'flex-end' }}>
          {/* Simple inline sparkline-like chart */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderColor: '#eee', borderTopWidth: 1, borderBottomWidth: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%' }}>
            {points.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: 2, height: (v / maxY) * 120, backgroundColor: '#CB30E0', borderRadius: 1 }} />
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
            <Text key={m} style={{ color: '#888' }}>{m}</Text>
          ))}
        </View>
      </Card>

      <Text style={{ marginTop: 16 }} variant="titleMedium">Transactions</Text>
      {[{ name: 'Elisha', amount: '25,000' }, { name: 'John', amount: '35,000' }].map((t, i) => (
        <Card key={i} style={{ marginTop: 8 }}>
          <Card.Title title={t.name} subtitle={'Order #12345\nService type: Wash & Fold, Ironing'} right={() => <Text style={{ marginRight: 12 }}>{t.amount}</Text>} />
        </Card>
      ))}
      <Button mode="text" style={{ alignSelf: 'center', marginTop: 8 }}>See all transactions</Button>
    </ScrollView>
  );
}


