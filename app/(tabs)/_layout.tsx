import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUserStore } from '../../stores/userStore';

// Custom Tab Bar Icon Component with proper spacing
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size || 24} style={{ marginBottom: 2 }} {...props} />;
}

// Custom Tab Bar Icon Component for Ionicons
function TabBarIonIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  return <Ionicons size={props.size || 24} style={{ marginBottom: 2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useUserStore();
  
  // Debug logging
  console.log('🔍 Tab Layout Debug:', {
    user: user ? { id: user.id, role: user.role } : 'No user',
  });

  const screenOptions = {
    tabBarActiveTintColor: Colors[(colorScheme ?? 'light') as 'light' | 'dark'].tint,
    tabBarInactiveTintColor: Colors[(colorScheme ?? 'light') as 'light' | 'dark'].tabIconDefault,
    headerShown: false,
    tabBarLabelStyle: { 
      fontSize: 12, 
      fontWeight: '500',
      marginTop: 2,
      textAlign: 'center',
    },
    tabBarItemStyle: { 
      paddingVertical: 4,
      minHeight: 60,
    },
    tabBarStyle: {
      height: 70,
      paddingBottom: 8,
      paddingTop: 4,
    },
  };

  // Define all possible tabs but control visibility based on role
  const getTabVisibility = (tabName: string) => {
    if (!user) return false;
    
    switch (tabName) {
      case 'home':
        return user.role !== 'PARTNER_ADMIN' && user.role !== 'STAFF'; // Only for regular users
      case 'partner-admin-home':
        return user.role === 'PARTNER_ADMIN';
      case 'staff-home':
        return user.role === 'STAFF';
      case 'business':
        return user.role === 'PARTNER_ADMIN' || (user.role !== 'PARTNER_ADMIN' && user.role !== 'STAFF');
      case 'staff':
        return user.role === 'PARTNER_ADMIN';
      case 'regular-user':
        return user.role === 'STAFF' || (user.role !== 'PARTNER_ADMIN' && user.role !== 'STAFF');
      case 'schedule':
        return user.role === 'STAFF' || (user.role !== 'PARTNER_ADMIN' && user.role !== 'STAFF');
      case 'reports':
        return user.role === 'STAFF' || (user.role !== 'PARTNER_ADMIN' && user.role !== 'STAFF');
      case 'partner-admin-reports':
        return user.role === 'PARTNER_ADMIN';
      default:
        return false;
    }
  };

  return (
    <Tabs screenOptions={screenOptions as any}>
      {/* Regular Home tab - for non-PARTNER_ADMIN, non-STAFF users */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="home" color={color} size={24} />,
          href: getTabVisibility('home') ? undefined : null,
        }}
      />

      {/* Partner Admin Home tab */}
      <Tabs.Screen
        name="partner-admin-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="home" color={color} size={24} />,
          href: getTabVisibility('partner-admin-home') ? undefined : null,
        }}
      />

      {/* Staff Home tab */}
      <Tabs.Screen
        name="staff-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="home" color={color} size={24} />,
          href: getTabVisibility('staff-home') ? undefined : null,
        }}
      />

      {/* Business tab */}
      <Tabs.Screen
        name="business"
        options={{
          title: 'Business',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="business" color={color} size={24} />,
          href: getTabVisibility('business') ? undefined : null, // Hide tab if not visible
        }}
      />

      {/* Staff tab */}
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staffs',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="people" color={color} size={24} />,
          href: getTabVisibility('staff') ? undefined : null, // Hide tab if not visible
        }}
      />

      {/* Hidden partner-admin tab - redirects to business */}
      <Tabs.Screen
        name="partner-admin"
        options={{
          href: null, // Completely hide this tab
        }}
      />

      {/* Orders tab (regular-user) */}
      <Tabs.Screen
        name="regular-user"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="cube" color={color} size={24} />,
          href: getTabVisibility('regular-user') ? undefined : null, // Hide tab if not visible
        }}
      />

      {/* Schedule tab */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="calendar" color={color} size={24} />,
          href: getTabVisibility('schedule') ? undefined : null, // Hide tab if not visible
        }}
      />

      {/* Reports tab - for regular users and staff */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="bar-chart" color={color} size={24} />,
          href: getTabVisibility('reports') ? undefined : null, // Hide tab if not visible
        }}
      />

      {/* Partner Admin Reports tab */}
      <Tabs.Screen
        name="partner-admin-reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabBarIonIcon name="analytics" color={color} size={24} />,
          href: getTabVisibility('partner-admin-reports') ? undefined : null, // Hide tab if not visible
        }}
      />
    </Tabs>
  );
}
