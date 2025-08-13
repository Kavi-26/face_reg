import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';

export default function AdminDashboard({ navigation }) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAdminProfile();
    }
  }, [user]);

  useEffect(() => {
    if (adminProfile?.assignedSiteLocation) {
      fetchEmployees();
    }
  }, [adminProfile]);

  const fetchAdminProfile = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setAdminProfile(userData);
      } else {
        Alert.alert('Error', 'Admin profile not found');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      Alert.alert('Error', 'Failed to load admin profile');
    }
  };

  const fetchEmployees = async () => {
    if (!adminProfile?.assignedSiteLocation) {
      console.log('No assigned site location found for admin');
      return;
    }

    setLoading(true);
    try {
      // Fetch employees from the same site location as the admin
      const employeesQuery = query(
        collection(db, 'users'),
        where('type', '==', 'employee'),
        where('action', '==', true),
        where('assignedSiteLocation', '==', adminProfile.assignedSiteLocation),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(employeesQuery);
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmployees(employeesData);
      calculateStats(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      
      // If the compound query fails due to missing index, try a simpler approach
      if (error.code === 'failed-precondition') {
        try {
          // Fallback: fetch all employees and filter client-side
          const allEmployeesQuery = query(
            collection(db, 'users'),
            where('type', '==', 'employee'),
            where('action', '==', true)
          );
          
          const snapshot = await getDocs(allEmployeesQuery);
          const allEmployees = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Filter by assignedSiteLocation client-side
          const filteredEmployees = allEmployees.filter(
            employee => employee.assignedSiteLocation === adminProfile.assignedSiteLocation
          );
          
          setEmployees(filteredEmployees);
          calculateStats(filteredEmployees);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          Alert.alert('Error', 'Failed to fetch employees data');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch employees data');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (employeesData) => {
    // This is a simplified calculation
    // In a real app, you'd check actual attendance records for today
    const total = employeesData.length;
    const present = Math.floor(total * 0.8); // 80% present (mock data)
    const absent = Math.floor(total * 0.15); // 15% absent (mock data)
    const onLeave = total - present - absent; // remaining on leave

    setStats({
      totalEmployees: total,
      presentToday: present,
      absentToday: absent,
      onLeave: onLeave
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (adminProfile?.assignedSiteLocation) {
      await fetchEmployees();
    } else {
      await fetchAdminProfile();
    }
    setRefreshing(false);
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statTextContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const renderEmployeeItem = ({ item }) => {
    // Generate a random status for demo purposes
    // In a real app, you'd fetch actual attendance data
    const statuses = ['Present', 'Absent', 'Late', 'On Leave'];
    const statusColors = {
      'Present': '#4CAF50',
      'Absent': '#F44336',
      'Late': '#FF9800',
      'On Leave': '#2196F3'
    };
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return (
      <View style={styles.employeeCard}>
        <View style={styles.employeeAvatar}>
          <Text style={styles.employeeInitials}>
            {item.name ? item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'N/A'}
          </Text>
        </View>
        
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name || 'N/A'}</Text>
          <Text style={styles.employeeRole}>{item.jobRole || 'N/A'}</Text>
          <Text style={styles.employeeLocation}>{item.assignedSiteLocation || 'N/A'}</Text>
          <Text style={styles.employeePhone}>{item.phoneNumber || 'N/A'}</Text>
        </View>
        
        <View style={styles.employeeStatus}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[randomStatus] }]}>
            <Text style={styles.statusText}>{randomStatus}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!adminProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading admin profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {adminProfile.assignedSiteLocation || 'Site Location'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {adminProfile.name || 'Admin'}!
          </Text>
          <Text style={styles.welcomeText}>
            Managing employees at {adminProfile.assignedSiteLocation || 'your site'}
          </Text>
          <Text style={styles.welcomeSubtext}>
            Here's what's happening with your team today
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Employees', stats.totalEmployees, 'people', '#2196F3')}
            {renderStatCard('Present Today', stats.presentToday, 'checkmark-circle', '#4CAF50')}
            {renderStatCard('Absent Today', stats.absentToday, 'close-circle', '#F44336')}
            {renderStatCard('On Leave', stats.onLeave, 'calendar', '#FF9800')}
          </View>
        </View>

        {/* Site Location Info */}
        {adminProfile.assignedSiteLocation && (
          <View style={styles.siteLocationCard}>
            <View style={styles.siteLocationHeader}>
              <Ionicons name="location" size={20} color="#FF6B6B" />
              <Text style={styles.siteLocationTitle}>Your Site Location</Text>
            </View>
            <Text style={styles.siteLocationText}>{adminProfile.assignedSiteLocation}</Text>
            <Text style={styles.siteLocationSubtext}>
              You manage {stats.totalEmployees} employees at this location
            </Text>
          </View>
        )}

        {/* Employees at Site Location */}
        <View style={styles.employeesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Employees at {adminProfile.assignedSiteLocation}
            </Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All ({employees.length})</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading employees...</Text>
            </View>
          ) : (
            <FlatList
              data={employees.slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={renderEmployeeItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>
                    No employees found at {adminProfile.assignedSiteLocation}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Employees need to be assigned to your site location
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteLocationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  siteLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  siteLocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  siteLocationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  siteLocationSubtext: {
    fontSize: 14,
    color: '#666',
  },
  employeesContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  employeeInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  employeeLocation: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  employeePhone: {
    fontSize: 12,
    color: '#999',
  },
  employeeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});