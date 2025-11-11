import { useBusinessStore } from '@/stores/businessStore';
import { useUserStore } from '@/stores/userStore';
import { theme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Switch } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function StaffScreen() {
  const { currentBusiness, offices, staff, fetchBusinessStaff, assignStaffToOffice } = useBusinessStore();
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [isContactPerson, setIsContactPerson] = useState(false);

  // Fetch staff data when component mounts
  useEffect(() => {
    const loadStaff = async () => {
      if (currentBusiness?.id) {
        try {
          setIsLoading(true);
          await fetchBusinessStaff(currentBusiness.id);
          console.log('✅ Staff Screen: Staff data loaded successfully');
        } catch (error) {
          console.error('❌ Staff Screen: Failed to load staff data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStaff();
  }, [currentBusiness?.id, fetchBusinessStaff]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentBusiness?.id) {
        await fetchBusinessStaff(currentBusiness.id);
        console.log('✅ Staff Screen: Staff data refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Staff Screen: Failed to refresh staff data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddStaff = () => {
    console.log('👥 Staff Screen: Add Staff clicked');
    console.log('👥 Staff Screen: Current business:', currentBusiness);
    
    if (!currentBusiness) {
      Alert.alert('Error', 'No business found. Please try again.');
      return;
    }
    
    console.log('👥 Staff Screen: Navigating to staff registration');
    router.push('/business/staff-registration');
  };

  const handleManageStaff = (staffMember: any) => {
    console.log('👥 Staff Screen: Managing staff:', staffMember);
    setSelectedStaff(staffMember);
    setSelectedOfficeId(staffMember.officeId || '');
    setIsContactPerson(staffMember.isContactPerson || false);
    setShowManageModal(true);
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff || !selectedOfficeId || !currentBusiness?.id) {
      Alert.alert('Error', 'Please select an office to assign the staff member.');
      return;
    }

    try {
      setIsLoading(true);
      await assignStaffToOffice(currentBusiness.id, selectedOfficeId, {
        userId: selectedStaff.userId,
        isContactPerson: isContactPerson
      });
      
      Alert.alert('Success', 'Staff member assigned to office successfully!');
      setShowManageModal(false);
      
      // Refresh staff data
      await fetchBusinessStaff(currentBusiness.id);
    } catch (error: any) {
      console.error('❌ Staff Screen: Failed to assign staff:', error);
      Alert.alert('Error', error.message || 'Failed to assign staff to office');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowManageModal(false);
    setSelectedStaff(null);
    setSelectedOfficeId('');
    setIsContactPerson(false);
  };


  const renderStaffItem = (staffMember: any) => {
    // Handle the actual API structure where user data is nested
    const user = staffMember.user;
    
    return (
      <Card key={staffMember.id} style={styles.staffCard}>
        <Card.Content style={styles.staffCardContent}>
          <View style={styles.staffHeader}>
            <View style={styles.staffAvatar}>
              <Text style={styles.staffInitial}>
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{user?.fullName || 'Unknown'}</Text>
              <Text style={styles.staffRole}>{user?.role || 'STAFF'}</Text>
              <Text style={styles.staffOffice}>{staffMember.office?.name || 'No Office'}</Text>
            </View>
            <View style={styles.staffStatus}>
              <View style={[
                styles.statusDot,
                { backgroundColor: theme.colors.success } // All staff are considered active
              ]} />
              <Text style={styles.statusText}>
                Active
              </Text>
            </View>
          </View>
          
          <View style={styles.staffDetails}>
            <View style={styles.staffDetailRow}>
              <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.staffDetailText}>{user?.email || 'No email'}</Text>
            </View>
            <View style={styles.staffDetailRow}>
              <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.staffDetailText}>{user?.phoneNumber || 'No phone'}</Text>
            </View>
            <View style={styles.staffDetailRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.staffDetailText}>
                Joined: {new Date(staffMember.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.staffFooter}>
            <Button
              mode="outlined"
              onPress={() => handleManageStaff(staffMember)}
              style={styles.manageButton}
              labelStyle={styles.manageButtonText}
              icon="cog"
            >
              Manage
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyCardContent}>
        <View style={styles.emptyIcon}>
          <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>No Staff Members</Text>
        <Text style={styles.emptyDescription}>
          Add staff members to manage your offices and operations efficiently.
        </Text>
        <Button
          mode="contained"
          onPress={handleAddStaff}
          style={styles.emptyAddButton}
          contentStyle={styles.emptyAddButtonContent}
          icon="account-plus"
        >
          Add First Staff Member
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Staff Management</Text>
          <Text style={styles.subtitle}>
            Manage your team members across all offices
          </Text>
        </View>
        <TouchableOpacity style={styles.addStaffButton} onPress={handleAddStaff}>
          <Ionicons name="person-add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Card style={styles.actionCard}>
          <Card.Content style={styles.actionCardContent}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddStaff}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="person-add" size={32} color="white" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Add Staff Member</Text>
                <Text style={styles.actionDescription}>
                  Register a new staff member for your offices
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </View>

      {/* Staff Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Reports</Text>
        
        <Card style={styles.reportCard}>
          <Card.Content style={styles.reportCardContent}>
            <View style={styles.reportHeader}>
              <View style={styles.reportIcon}>
                <Ionicons name="analytics-outline" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>Staff Performance</Text>
                <Text style={styles.reportDescription}>
                  Overview of staff assignments and office coverage
                </Text>
              </View>
            </View>
            
            <View style={styles.reportStats}>
              <View style={styles.reportStatItem}>
                <Text style={styles.reportStatNumber}>
                  {offices.length > 0 ? Math.round((staff.filter(s => s.officeId).length / offices.length) * 100) : 0}%
                </Text>
                <Text style={styles.reportStatLabel}>Office Coverage</Text>
              </View>
              <View style={styles.reportStatItem}>
                <Text style={styles.reportStatNumber}>
                  {offices.length > 0 ? Math.round(staff.length / offices.length * 10) / 10 : 0}
                </Text>
                <Text style={styles.reportStatLabel}>Staff per Office</Text>
              </View>
            </View>
            
            <View style={styles.reportActions}>
              <TouchableOpacity 
                style={styles.reportActionButton}
                onPress={() => router.push('/(tabs)/partner-admin-reports')}
              >
                <Text style={styles.reportActionText}>View Detailed Reports</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </View>
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{staff.length}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.statNumber}>
              {staff.filter(s => s.officeId).length}
            </Text>
            <Text style={styles.statLabel}>Assigned Staff</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
            </View>
            <Text style={styles.statNumber}>
              {staff.filter(s => !s.officeId).length}
            </Text>
            <Text style={styles.statLabel}>Unassigned</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="business-outline" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={styles.statNumber}>{offices.length}</Text>
            <Text style={styles.statLabel}>Offices</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Staff List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Staff Members ({staff.length})</Text>
        </View>

        {staff.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.staffList}>
            {staff.map((staffMember) => renderStaffItem(staffMember))}
          </View>
        )}
      </View>

      {/* Staff Management Modal */}
      <Modal
        visible={showManageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Staff</Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {selectedStaff && (
            <ScrollView style={styles.modalContent}>
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Text style={styles.modalStaffName}>{selectedStaff.user?.fullName}</Text>
                  <Text style={styles.modalStaffEmail}>{selectedStaff.user?.email}</Text>
                  <Text style={styles.modalStaffPhone}>{selectedStaff.user?.phoneNumber}</Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Text style={styles.modalSectionTitle}>Office Assignment</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Office</Text>
                    <View style={styles.officeList}>
                      {offices.map((office) => (
                        <TouchableOpacity
                          key={office.id}
                          style={[
                            styles.officeItem,
                            selectedOfficeId === office.id && styles.selectedOfficeItem
                          ]}
                          onPress={() => setSelectedOfficeId(office.id)}
                        >
                          <View style={styles.officeIcon}>
                            <Ionicons 
                              name="business-outline" 
                              size={20} 
                              color={selectedOfficeId === office.id ? theme.colors.primary : theme.colors.textSecondary} 
                            />
                          </View>
                          <View style={styles.officeInfo}>
                            <Text style={[
                              styles.officeName,
                              selectedOfficeId === office.id && styles.selectedOfficeName
                            ]}>
                              {office.name}
                            </Text>
                            <Text style={styles.officeLocation}>
                              {office.address.city} • {office.capacity} capacity
                            </Text>
                          </View>
                          {selectedOfficeId === office.id && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <View style={styles.switchRow}>
                      <Text style={styles.inputLabel}>Contact Person</Text>
                      <Switch
                        value={isContactPerson}
                        onValueChange={setIsContactPerson}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text style={styles.switchDescription}>
                      Designate this staff member as the contact person for this office
                    </Text>
                  </View>
                </Card.Content>
              </Card>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleCloseModal}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonText}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAssignStaff}
                  loading={isLoading}
                  disabled={!selectedOfficeId}
                  style={styles.assignButton}
                  labelStyle={styles.assignButtonText}
                >
                  Assign to Office
                </Button>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 52,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    marginTop: 4,
    fontFamily: theme.typography.fontFamily,
  },
  addStaffButton: {
    padding: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    fontFamily: theme.typography.fontFamilyBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily,
  },
  actionCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionCardContent: {
    padding: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
  },
  actionDescription: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  staffList: {
    gap: 16,
  },
  staffCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  staffCardContent: {
    padding: 16,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamilyBold,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
    fontFamily: theme.typography.fontFamilyBold,
  },
  staffRole: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    marginBottom: 2,
    fontFamily: theme.typography.fontFamily,
  },
  staffOffice: {
    fontSize: 12,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  staffStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  staffDetails: {
    marginBottom: 16,
    gap: 8,
  },
  staffDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffDetailText: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  staffFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily,
  },
  emptyCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyCardContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamilyBold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: theme.typography.fontFamily,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
  },
  businessCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessCardContent: {
    padding: 0,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  businessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
  },
  businessTin: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  businessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.primaryLight,
  },
  addButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 64) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyAddButtonContent: {
    paddingVertical: 8,
  },
  
  // Report styles
  reportCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportCardContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
  },
  reportDescription: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  reportStatItem: {
    alignItems: 'center',
  },
  reportStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
  },
  reportStatLabel: {
    fontSize: 12,
    color: theme.colors.grayMedium,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  reportActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  reportActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  reportActionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginRight: 4,
    fontFamily: theme.typography.fontFamily,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  modalStaffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalStaffEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  modalStaffPhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  officeList: {
    gap: 8,
  },
  officeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  selectedOfficeItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  officeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  officeInfo: {
    flex: 1,
  },
  officeName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  selectedOfficeName: {
    color: theme.colors.primary,
  },
  officeLocation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 20,
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
  },
  assignButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  assignButtonText: {
    color: theme.colors.surface,
  },
});